"use client";
import { useState, useEffect } from 'react';
import { 
    Download, TrendingUp, AlertCircle, Layers, DollarSign, CheckCircle, FileText, Printer 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TYPES ---
interface GSTRow {
    date: string;
    invoiceNo: string;
    cnNo?: string;
    customer: string;
    state: string;
    
    // Values (Consolidated Line)
    netTaxable: number;
    totalTax: number;
    shipping: number;
    grandTotal: number;
    
    // Tax Breakup
    igst: number;
    cgst: number;
    sgst: number;
    
    type: 'B2C' | 'CN';
    originalOrder: any; // For PDF Generation
}

// ✅ Props: Receive Download Handlers from Parent
export default function GSTManager({ orders, settings, onDownloadInvoice, onDownloadCreditNote }: any) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Data Containers
    const [b2cSales, setB2cSales] = useState<GSTRow[]>([]);
    const [creditNotes, setCreditNotes] = useState<GSTRow[]>([]);
    
    // ✅ 4 TABS SYSTEM
    const [activeTab, setActiveTab] = useState<'b2c' | 'cn' | 'gstr1' | 'gstr3b'>('b2c');

    // Live Stats
    const [stats, setStats] = useState({
        totalSales: 0,
        totalReturns: 0,
        netTaxable: 0,     // For 3B (3.1.a)
        netTaxLiability: 0, // For 3B
        netIGST: 0,
        netCGST: 0,
        netSGST: 0
    });

    // Init Dates
    useEffect(() => {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    // --- 🧮 CORE CALCULATION ENGINE (MATCHES INVOICE LOGIC) ---
    useEffect(() => {
        if (!orders || !startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const cleanStr = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || "";
        const adminState = cleanStr(settings?.invoice?.state || "Uttar Pradesh");

        const sales: GSTRow[] = [];
        const returns: GSTRow[] = [];

        orders.forEach((order: any) => {
            const orderDate = new Date(order.date);
            if (orderDate < start || orderDate > end) return;

          // ---------------------------------------------
            // 1. Identify Type (LOGIC UPDATED FOR RTO)
            // ---------------------------------------------
            let type: 'B2C' | 'CN' | null = null;

            // ✅ Sale Maana Jayega
            if (order.status === 'Delivered') type = 'B2C';

            // ✅ Credit Note Maana Jayega (RTO Added)
            if (
                order.status === 'Refunded' || 
                order.status === 'Return Approved' || 
                order.status === 'RTO' ||             // 👈 YE ADD KIYA
                order.status === 'RTO Delivered'      // 👈 YE BHI ADD KIYA (Safety)
            ) {
                type = 'CN';
            }
            
            // Agar status match nahi hua (Pending/Processing etc.), to skip karo
            if (!type) return;
            const custStateRaw = order.address?.state || "Unknown";
            const custState = cleanStr(custStateRaw);
            const isInterState = adminState !== custState;

            // --- 1. AGGREGATE GROSS TAXABLE (Reversed from Inclusive Price) ---
            let totalTaxableBase = 0; 
            let totalGSTGross = 0;    

            // Items
            order.items.forEach((item: any) => {
                const qty = Number(item.qty || 1);
                const rate = Number(item.price);
                const amount = rate * qty;
                const taxRate = item.gstRate || 3;
                
                const taxable = amount / (1 + (taxRate / 100));
                const tax = amount - taxable;
                
                totalTaxableBase += taxable;
                totalGSTGross += tax;
            });

            // Gift Wrap (Service 18%)
            if (order.isGift && order.giftWrapPrice > 0) {
                const gAmount = Number(order.giftWrapPrice);
                const gTaxable = gAmount / 1.18;
                const gTax = gAmount - gTaxable;
                totalTaxableBase += gTaxable;
                totalGSTGross += gTax;
            }

            // --- 2. APPLY DISCOUNT (NET TAXABLE) ---
            const discountTotal = Number(order.couponDiscount || 0) + Number(order.pointsDiscount || 0);
            const netTaxableValue = Math.max(0, totalTaxableBase - discountTotal);

            // --- 3. RE-CALCULATE GST (PROPORTIONATE) ---
            const ratio = totalTaxableBase > 0 ? (netTaxableValue / totalTaxableBase) : 0;
            const finalGST = totalGSTGross * ratio;

            // --- 4. SHIPPING (FLAT / NON-TAXABLE IN SUMMARY) ---
            const shipping = Number(order.shipping || 0);
            const grandTotal = Math.round(netTaxableValue + finalGST + shipping);

            // Split Tax
            let igst = 0, cgst = 0, sgst = 0;
            if (isInterState) { igst = finalGST; } else { cgst = finalGST / 2; sgst = finalGST / 2; }

            const row: GSTRow = {
                date: new Date(order.date).toLocaleDateString('en-GB'),
                invoiceNo: order.invoiceNo || order.id,
                // ✅ FIX: Use Real Database Credit Note Number if exists
                cnNo: type === 'CN' ? (order.creditNoteNo || `CN-${order.invoiceNo || order.id}`) : undefined,
                customer: order.customerName,
                state: custStateRaw,
                
                netTaxable: netTaxableValue,
                totalTax: finalGST,
                shipping: shipping,
                grandTotal: grandTotal,
                
                igst: igst, cgst: cgst, sgst: sgst,
                
                type: type as 'B2C' | 'CN',
                originalOrder: order // Store for PDF Download
            };

            if (type === 'B2C') sales.push(row);
            else returns.push(row);
        });

        setB2cSales(sales);
        setCreditNotes(returns);

        // --- STATS (Net of Returns) ---
        const sum = (arr: GSTRow[], key: keyof GSTRow) => arr.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0);

        setStats({
            totalSales: sum(sales, 'grandTotal'),
            totalReturns: sum(returns, 'grandTotal'),
            netTaxable: sum(sales, 'netTaxable') - sum(returns, 'netTaxable'),
            netTaxLiability: sum(sales, 'totalTax') - sum(returns, 'totalTax'),
            netIGST: sum(sales, 'igst') - sum(returns, 'igst'),
            netCGST: sum(sales, 'cgst') - sum(returns, 'cgst'),
            netSGST: sum(sales, 'sgst') - sum(returns, 'sgst')
        });

    }, [orders, startDate, endDate, settings]);

    // --- HELPERS ---
    const getGSTR1Data = () => {
        const map = new Map();
        const process = (rows: GSTRow[], isReturn: boolean) => {
            rows.forEach(item => {
                const key = item.state; 
                if (!map.has(key)) map.set(key, { state: item.state, taxable: 0, igst: 0, cgst: 0, sgst: 0 });
                const entry = map.get(key);
                const factor = isReturn ? -1 : 1;
                entry.taxable += (item.netTaxable * factor);
                entry.igst += (item.igst * factor);
                entry.cgst += (item.cgst * factor);
                entry.sgst += (item.sgst * factor);
            });
        };
        process(b2cSales, false);
        process(creditNotes, true);
        return Array.from(map.values());
    };

    // --- DOWNLOADS ---
    const exportCSV = () => {
        let data: any[] = [];
        if (activeTab === 'b2c') data = b2cSales;
        else if (activeTab === 'cn') data = creditNotes;
        else { alert("For Summary, please rely on GSTR-3B PDF."); return; }

        const headers = ["Date", "Invoice", "CN No", "State", "Net Taxable", "IGST", "CGST", "SGST", "Shipping", "Grand Total"];
        const rows = data.map(r => [
            r.date, r.invoiceNo, r.cnNo || "-", r.state, 
            r.netTaxable.toFixed(2), r.igst.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2), 
            r.shipping.toFixed(2), r.grandTotal.toFixed(2)
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `ZERIMI_${activeTab.toUpperCase()}_REPORT.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

   // ✅ DOWNLOAD GSTR-3B PDF (Fixed Type Error)
    const downloadGSTR3B_PDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("GSTR-3B Auto-Draft Summary", 14, 20);
        doc.setFontSize(10);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 26);
        doc.text(`Company: ${settings?.invoice?.companyName || 'ZERIMI'}`, 14, 32);

        // @ts-ignore
        autoTable(doc, {
            startY: 40,
            head: [["Nature of Supplies", "Taxable Value", "IGST", "CGST", "SGST", "Cess"]],
            body: [
                [
                    "3.1(a) Outward Taxable Supplies (Net)",
                    `Rs.${stats.netTaxable.toFixed(2)}`,
                    `Rs.${stats.netIGST.toFixed(2)}`,
                    `Rs.${stats.netCGST.toFixed(2)}`,
                    `Rs.${stats.netSGST.toFixed(2)}`,
                    "0.00"
                ],
                ["3.1(b) Outward Zero Rated", "0.00", "0.00", "0.00", "0.00", "0.00"],
                ["3.1(c) Other Outward Supplies (Nil/Exempt)", "0.00", "-", "-", "-", "-"],
                ["3.1(d) Inward Supplies (Reverse Charge)", "0.00", "0.00", "0.00", "0.00", "0.00"],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }
        });

        // ✅ FIX: (doc as any) use kiya taaki TypeScript error na de
        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFontSize(9);
        doc.text("* Note: Values are NET of Credit Notes (Sales - Returns).", 14, finalY);
        
        doc.save(`GSTR-3B_Summary_${startDate}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-serif text-white">GST Filing Center</h2>
                    <p className="text-white/40 text-sm mt-1">Invoice-Matched Reports & GSTR-3B Auto-Draft.</p>
                </div>
                <div className="flex gap-4 items-end bg-[#0f2925] p-2 rounded-xl border border-white/5 shadow-lg">
                    <div><label className="text-[10px] text-white/40 uppercase font-bold ml-1">Start</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black/20 text-white text-xs p-2 rounded-lg border border-white/10 outline-none" /></div>
                    <div><label className="text-[10px] text-white/40 uppercase font-bold ml-1">End</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black/20 text-white text-xs p-2 rounded-lg border border-white/10 outline-none" /></div>
                </div>
            </div>

            {/* 2. SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SummaryCard title="Total Sales (B2C)" value={stats.totalSales} icon={<TrendingUp className="w-5 h-5 text-emerald-400"/>} bg="bg-emerald-900/10 border-emerald-500/20" textColor="text-emerald-400"/>
                <SummaryCard title="Total Returns (CN)" value={stats.totalReturns} icon={<AlertCircle className="w-5 h-5 text-red-400"/>} bg="bg-red-900/10 border-red-500/20" textColor="text-red-400"/>
                <SummaryCard title="Net Taxable Value" value={stats.netTaxable} icon={<Layers className="w-5 h-5 text-blue-400"/>} bg="bg-blue-900/10 border-blue-500/20" textColor="text-blue-400"/>
                <SummaryCard title="Net GST Liability" value={stats.netTaxLiability} icon={<DollarSign className="w-5 h-5 text-amber-400"/>} bg="bg-amber-900/10 border-amber-500/20" textColor="text-amber-400" isMain/>
            </div>

            {/* 3. TABS & DATA AREA */}
            <div className="bg-[#0f2925] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                
                {/* Tab Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-white/5 bg-[#0a1f1c] gap-4">
                    <div className="flex gap-2 p-1 bg-black/20 rounded-lg overflow-x-auto">
                        <TabButton label="B2C Invoices" active={activeTab === 'b2c'} onClick={() => setActiveTab('b2c')} />
                        <TabButton label="Credit Notes" active={activeTab === 'cn'} onClick={() => setActiveTab('cn')} />
                        <TabButton label="GSTR-1 Summary" active={activeTab === 'gstr1'} onClick={() => setActiveTab('gstr1')} />
                        <TabButton label="GSTR-3B View" active={activeTab === 'gstr3b'} onClick={() => setActiveTab('gstr3b')} />
                    </div>
                    
                    {/* Action Buttons */}
                    {activeTab === 'gstr3b' ? (
                        <button onClick={downloadGSTR3B_PDF} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition shadow-lg">
                            <FileText className="w-4 h-4" /> Download 3B PDF
                        </button>
                    ) : activeTab === 'gstr1' ? (
                        <div className="text-white/30 text-xs italic">View Only</div>
                    ) : (
                        <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition shadow-lg">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto max-h-[600px] custom-scrollbar p-1">
                    
                    {/* --- VIEW: GSTR-3B (Auto Draft) --- */}
                    {activeTab === 'gstr3b' ? (
                        <div className="p-8 max-w-3xl mx-auto animate-in fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-serif text-xl">GSTR-3B : Table 3.1 Tax Liability</h3>
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] uppercase font-bold rounded border border-green-500/20">Auto-Drafted</span>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-6 p-4 border-b border-white/5 bg-black/20 text-[10px] uppercase font-bold text-white/50">
                                    <div className="col-span-2">Nature of Supply</div>
                                    <div className="text-right">Taxable</div>
                                    <div className="text-right">IGST</div>
                                    <div className="text-right">CGST</div>
                                    <div className="text-right">SGST</div>
                                </div>
                                
                                {/* 3.1 (a) Row */}
                                <div className="grid grid-cols-6 p-4 border-b border-white/5 items-center">
                                    <div className="col-span-2 text-white font-bold text-sm">3.1(a) Outward Taxable Supplies</div>
                                    <div className="text-right font-mono text-white">₹{stats.netTaxable.toFixed(2)}</div>
                                    <div className="text-right font-mono text-blue-300">₹{stats.netIGST.toFixed(2)}</div>
                                    <div className="text-right font-mono text-green-300">₹{stats.netCGST.toFixed(2)}</div>
                                    <div className="text-right font-mono text-green-300">₹{stats.netSGST.toFixed(2)}</div>
                                </div>

                                {/* Zero Rated / Exempt Placeholders */}
                                <div className="grid grid-cols-6 p-3 text-white/30 text-xs">
                                    <div className="col-span-2">3.1(b) Outward Zero Rated</div>
                                    <div className="text-right">0.00</div><div className="text-right">0.00</div><div className="text-right">0.00</div><div className="text-right">0.00</div>
                                </div>
                                <div className="grid grid-cols-6 p-3 text-white/30 text-xs">
                                    <div className="col-span-2">3.1(c) Other Outward (Nil)</div>
                                    <div className="text-right">0.00</div><div className="text-right">-</div><div className="text-right">-</div><div className="text-right">-</div>
                                </div>

                                {/* Total Row */}
                                <div className="bg-amber-500/10 p-4 flex justify-between items-center border-t border-amber-500/20">
                                    <span className="text-amber-500 text-xs uppercase font-bold tracking-widest">Total Tax Payable</span>
                                    <span className="text-amber-400 font-mono font-bold text-xl">₹{stats.netTaxLiability.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'gstr1' ? (
                        /* --- VIEW: GSTR-1 SUMMARY --- */
                        <table className="w-full text-left text-sm text-white/80">
                            <thead className="bg-[#051614] text-[10px] uppercase text-white/40 tracking-widest sticky top-0 z-10">
                                <tr><th className="p-5">State (Place of Supply)</th><th className="p-5 text-right">Net Taxable</th><th className="p-5 text-right">IGST</th><th className="p-5 text-right">CGST</th><th className="p-5 text-right">SGST</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {getGSTR1Data().map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition">
                                        <td className="p-5 font-bold text-white">{row.state || "Other"}</td>
                                        <td className="p-5 text-right font-mono text-white">₹{row.taxable.toFixed(2)}</td>
                                        <td className="p-5 text-right font-mono text-blue-300">₹{row.igst.toFixed(2)}</td>
                                        <td className="p-5 text-right font-mono text-green-300">₹{row.cgst.toFixed(2)}</td>
                                        <td className="p-5 text-right font-mono text-green-300">₹{row.sgst.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* --- VIEW: DETAILED SALES / RETURNS --- */
                        <table className="w-full text-left text-sm text-white/80">
                            <thead className="bg-[#051614] text-[10px] uppercase text-white/40 tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="p-5">Date</th>
                                    <th className="p-5">Doc No (Click to Download)</th>
                                    <th className="p-5">State</th>
                                    <th className="p-5 text-right">Net Taxable</th>
                                    <th className="p-5 text-right">IGST</th>
                                    <th className="p-5 text-right">CGST</th>
                                    <th className="p-5 text-right">SGST</th>
                                    <th className="p-5 text-right text-amber-400">Ship (0%)</th>
                                    <th className="p-5 text-right font-bold text-white">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(activeTab === 'b2c' ? b2cSales : creditNotes).map((row, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition group">
                                        <td className="p-5">{row.date}</td>
                                        <td className="p-5 font-mono text-xs">
                                            {/* ✅ CLICKABLE INVOICE / CN */}
                                            {activeTab === 'b2c' ? (
                                                <button 
                                                    onClick={() => onDownloadInvoice(row.originalOrder, settings)} 
                                                    className="flex items-center gap-2 text-blue-400 hover:text-white hover:underline transition"
                                                >
                                                    <FileText className="w-3 h-3" /> {row.invoiceNo}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => onDownloadCreditNote(row.originalOrder, settings)} 
                                                    className="flex items-center gap-2 text-red-400 hover:text-white hover:underline transition"
                                                >
                                                    <FileText className="w-3 h-3" /> {row.cnNo}
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-5 text-xs text-white/60">{row.state}</td>
                                        <td className="p-5 text-right font-mono text-white">₹{row.netTaxable.toFixed(2)}</td>
                                        <td className="p-5 text-right font-mono text-white/60">{row.igst > 0 ? `₹${row.igst.toFixed(2)}` : '-'}</td>
                                        <td className="p-5 text-right font-mono text-white/60">{row.cgst > 0 ? `₹${row.cgst.toFixed(2)}` : '-'}</td>
                                        <td className="p-5 text-right font-mono text-white/60">{row.sgst > 0 ? `₹${row.sgst.toFixed(2)}` : '-'}</td>
                                        <td className="p-5 text-right font-mono text-amber-400">{row.shipping > 0 ? `₹${row.shipping.toFixed(2)}` : '-'}</td>
                                        <td className="p-5 text-right font-mono font-bold text-white text-base">₹{Math.round(row.grandTotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {((activeTab === 'b2c' && b2cSales.length === 0) || (activeTab === 'cn' && creditNotes.length === 0)) && (
                                    <tr><td colSpan={9} className="p-12 text-center text-white/30 italic">No records found for selected period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---
const SummaryCard = ({ title, value, icon, bg, textColor, isMain }: any) => (
    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${bg} ${isMain ? 'shadow-[0_0_20px_rgba(245,158,11,0.15)] border-amber-500/40' : ''}`}>
        <div className="flex justify-between items-start mb-4"><div className={`p-3 rounded-xl bg-black/20 ${textColor}`}>{icon}</div></div>
        <h3 className={`text-2xl font-serif mb-1 ${textColor}`}>₹{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{title}</p>
    </div>
);

const TabButton = ({ label, active, onClick }: any) => (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${active ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{label}</button>
);