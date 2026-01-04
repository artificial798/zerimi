"use client";
import { useStore, Order } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  Package, User, ShoppingBag, ChevronRight, Heart, 
  FileText, Download, Award, Bell, Key, Camera, Tag, Trash2, 
  Sparkles, RotateCcw, RefreshCcw, Plus, LogOut, X, 
  Home, Briefcase, Save, Edit2, ShieldCheck, Clock,Lock, Check, Truck, CheckCircle, Info, 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
// Assuming ProductCard is compatible, otherwise wrap it in a dark container
import ProductCard from '../../components/ProductCard'; 
// ✅ Ye line file ke top par imports ke saath jod dein
// Is line ko dhundein aur update karein:
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// ✅ Is line ko sabse upar imports mein add karein
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- HELPER: DATE PARSER (Unchanged) ---
const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(dateStr);
};

// --- HELPER: RETURN CHECK (Unchanged) ---
const isOrderReturnable = (orderDateStr: string) => {
  try {
    const orderDate = parseDate(orderDateStr);
    const today = new Date();
    orderDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (isNaN(orderDate.getTime())) return false; 
    const diffTime = Math.abs(today.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  } catch (e) { return false; }
};

// --- HELPER: INVOICE GENERATOR (Unchanged Logic, Styled Output) ---
// --- HELPER: NUMBER TO WORDS ---
// --- HELPER: NUMBER TO WORDS ---
// --- HELPER: NUMBER TO WORDS ---
// --- HELPER: NUMBER TO WORDS ---
const numberToWords = (price: number) => {
  return `Rupees ${Math.floor(price)} Only`;
};

/* ----------------------------------------
   FINAL INVOICE GENERATOR
   (CHECKOUT TRUTH BASED)
---------------------------------------- */
/* ----------------------------------------
   ✅ UPDATED CUSTOMER INVOICE (With Secret Gift & Tax Breakup)
---------------------------------------- */
/* ----------------------------------------
   ✅ FINAL CUSTOMER INVOICE (MATCHING ADMIN LOGIC)
---------------------------------------- */
export const downloadInvoice = (order: any, settings: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- 1. SETTINGS & LOGIC ---
  const TAX_RATE = 3;
  const companyState = "Maharashtra"; // ZERIMI Base Location
  
  // Customer State Check (For CGST/SGST vs IGST)
  let customerState = "";
  let fullAddress = "";

  if (typeof order.address === "object") {
    customerState = order.address.state || "";
    fullAddress = `${order.address.street || ""}, ${order.address.city || ""}, ${order.address.state || ""} - ${order.address.pincode || ""}`;
    if (order.address.phone) fullAddress += `\nPhone: ${order.address.phone}`;
  } else {
    fullAddress = order.address || "Address not provided";
    customerState = order.address || "";
  }

  const isSameState = customerState.toLowerCase().includes(companyState.toLowerCase());

  /* ========================================
     2. HEADER
  ======================================== */
  doc.setFontSize(24);
  doc.setTextColor(212, 175, 55); // Gold
  doc.setFont("helvetica", "bold");
  doc.text("ZERIMI", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Luxury Jewelry & Accessories", 14, 26);
  doc.text("Mumbai, Maharashtra, 400001", 14, 31);
  doc.text(`GSTIN: ${settings?.gstNo || "27ABCDE1234F1Z5"}`, 14, 36);
  doc.text("Email: support@zerimi.com", 14, 41);

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("TAX INVOICE", pageWidth - 14, 20, { align: "right" });

  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.invoiceNo || "INV-" + order.id.slice(0, 6)}`, pageWidth - 14, 30, { align: "right" });
  doc.text(`Date: ${new Date(order.date).toLocaleDateString("en-GB")}`, pageWidth - 14, 35, { align: "right" });
  doc.text(`Order ID: #${order.id}`, pageWidth - 14, 40, { align: "right" });

  doc.line(14, 48, pageWidth - 14, 48);

  /* ========================================
     3. BILL TO
  ======================================== */
  const billingY = 55;
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, billingY);

  doc.setFont("helvetica", "normal");
  const custName = order.name || order.customerName || "Customer";
  doc.text(custName, 14, billingY + 5);
  doc.text(doc.splitTextToSize(fullAddress, 80), 14, billingY + 10);

  /* ========================================
     4. TABLE DATA CALCULATION (REVERSE GST)
  ======================================== */
  let totalTaxable = 0;
  let totalGST = 0;
  let giftTaxable = 0;
  let giftGST = 0;

  const tableRows: any[] = [];

  // A. ITEMS ROW
  order.items.forEach((item: any, index: number) => {
    const qty = Number(item.qty || 1);
    const incPrice = Number(item.price); // Inclusive Price
    const totalInc = incPrice * qty;
    
    // Reverse Calc: Taxable = Inclusive / 1.03
    const taxable = totalInc / (1 + TAX_RATE / 100);
    const tax = totalInc - taxable;

    totalTaxable += taxable;
    totalGST += tax;

    tableRows.push([
      index + 1,
      item.name,
      item.hsn || "7117",
      qty,
      `Rs.${(taxable/qty).toFixed(2)}`, // Unit Rate (Taxable)
      `Rs.${taxable.toFixed(2)}`,       // Total Taxable
      isSameState ? "1.5%" : "-",
      isSameState ? (tax/2).toFixed(2) : "-",
      isSameState ? "1.5%" : "-",
      isSameState ? (tax/2).toFixed(2) : "-",
      !isSameState ? "3%" : "-",
      !isSameState ? tax.toFixed(2) : "-",
      `Rs.${totalInc.toFixed(2)}`
    ]);
  });

  // B. GIFT PACKAGING ROW (IF APPLICABLE)
  const giftWrapPrice = Number(order.giftWrapPrice || 0);
  if (giftWrapPrice > 0) {
    giftTaxable = giftWrapPrice / (1 + TAX_RATE / 100);
    giftGST = giftWrapPrice - giftTaxable;

    totalTaxable += giftTaxable;
    totalGST += giftGST;

    tableRows.push([
      tableRows.length + 1,
      "Gift Packaging (Add-on)",
      "9985",
      1,
      `Rs.${giftTaxable.toFixed(2)}`,
      `Rs.${giftTaxable.toFixed(2)}`,
      isSameState ? "1.5%" : "-",
      isSameState ? (giftGST/2).toFixed(2) : "-",
      isSameState ? "1.5%" : "-",
      isSameState ? (giftGST/2).toFixed(2) : "-",
      !isSameState ? "3%" : "-",
      !isSameState ? giftGST.toFixed(2) : "-",
      `Rs.${giftWrapPrice.toFixed(2)}`
    ]);
  }

  // @ts-ignore
  autoTable(doc, {
    startY: billingY + 35,
    head: [[
      "Sn", "Item", "HSN", "Qty", "Rate", "Taxable",
      "CGST", "Amt", "SGST", "Amt", "IGST", "Amt", "Total"
    ]],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [15, 41, 37], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    styles: { halign: 'center' },
    columnStyles: {
      1: { halign: 'left' }, // Item Name Left Align
      12: { halign: 'right', fontStyle: 'bold' } // Total Right Align
    },
  });

  /* ========================================
     5. SUMMARY TOTALS (ADMIN MATCHING)
  ======================================== */
  const discount = Number(order.discount || 0);
  const netTaxable = totalTaxable - discount;
  const finalGST = netTaxable * (TAX_RATE / 100);
  const shipping = Number(order.shipping || 0);
  const grandTotal = netTaxable + finalGST + shipping;

  // @ts-ignore
  let currentY = doc.lastAutoTable.finalY + 10;
  const rightX = pageWidth - 14;
  const labelX = rightX - 70;

  doc.setFontSize(9);
  doc.setTextColor(80);

  // 1. Sub Total (Taxable)
  doc.text("Sub Total (Taxable):", labelX, currentY);
  doc.text(`Rs.${totalTaxable.toFixed(2)}`, rightX, currentY, { align: "right" });
  currentY += 6;

  // 2. Gift Info (Only if present)
  if (giftWrapPrice > 0) {
      doc.text("Gift Packaging (Incl. GST):", labelX, currentY);
      doc.text(`Rs.${giftWrapPrice.toFixed(2)}`, rightX, currentY, { align: "right" });
      currentY += 6;
  }

  // 3. Discount (Red)
  if (discount > 0) {
      doc.setTextColor(200, 30, 30);
      doc.text("Less: Coupon Discount (Before Tax):", labelX, currentY);
      doc.text(`- Rs.${discount.toFixed(2)}`, rightX, currentY, { align: "right" });
      doc.setTextColor(80);
      currentY += 6;
  }

  // 4. Net Taxable
  doc.setTextColor(0); // Black for main values
  doc.text("Net Taxable Value:", labelX, currentY);
  doc.text(`Rs.${netTaxable.toFixed(2)}`, rightX, currentY, { align: "right" });
  currentY += 6;

  // 5. Total GST
  doc.setTextColor(100);
  doc.text(`Total GST (${TAX_RATE}%):`, labelX, currentY);
  doc.text(`+ Rs.${finalGST.toFixed(2)}`, rightX, currentY, { align: "right" });
  currentY += 6;

  // 6. Shipping
  doc.text("Shipping Charges:", labelX, currentY);
  doc.text(shipping === 0 ? "Free" : `+ Rs.${shipping.toFixed(2)}`, rightX, currentY, { align: "right" });
  currentY += 8;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(labelX, currentY - 2, rightX, currentY - 2);

  // 7. GRAND TOTAL
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 140, 0); // Gold
  doc.text("Grand Total:", labelX, currentY + 4);
  doc.text(`Rs.${grandTotal.toFixed(2)}`, rightX, currentY + 4, { align: "right" });

  /* ========================================
     6. FOOTER
  ======================================== */
  const footerY = currentY + 15;
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(`Amount in Words: ${numberToWords(grandTotal)}`, 14, footerY);

  doc.rect(14, footerY + 10, pageWidth - 28, 20);
  doc.setFontSize(8);
  doc.text("Declaration:", 16, footerY + 15);
  doc.text("We declare that this invoice shows the actual price of the goods described above.", 16, footerY + 20);

  doc.setFont("helvetica", "bold");
  doc.text("For ZERIMI", pageWidth - 40, footerY + 25, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signatory", pageWidth - 40, footerY + 28, { align: "center" });

  doc.save(`Invoice_${order.id}.pdf`);
};

// --- HELPER: CERTIFICATE GENERATOR (Unchanged) ---
// --- HELPER: PREMIUM ZERIMI CERTIFICATE GENERATOR (6 MONTHS WARRANTY) ---
// --- HELPER: ULTIMATE LUXURY CERTIFICATE (NO EMPTY SPACE) ---
const generateCertificate = (item: any, user: any, date: string) => {
    // 6 Months Warranty Logic
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(purchaseDate.getMonth() + 6);
    const expiryString = expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    if (!printWindow) return alert("Please allow popups.");

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ZERIMI Royal Certificate</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800&family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
          
          :root {
            --bg-dark: #020b09;
            --bg-light: #0a1f1c;
            --gold-light: #f9f295;
            --gold-dark: #987e41;
            --gold-gradient: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); /* Placeholder, overwritten below */
            --gold-text: linear-gradient(to bottom, #cfc09f 22%, #634f2c 24%, #cfc09f 26%, #cfc09f 27%,#ffecb3 40%,#3a2c0f 78%); 
          }

          @page { size: A4 landscape; margin: 0; }

          body { 
            margin: 0; padding: 0; 
            background: #111; 
            width: 297mm; height: 210mm; 
            display: flex; justify-content: center; align-items: center; 
            overflow: hidden; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            font-family: 'Cormorant Garamond', serif;
          }

          .cert-frame {
            position: relative;
            width: 287mm; height: 200mm;
            background: radial-gradient(circle at center, #0f2b26 0%, #020b09 100%);
            box-shadow: 0 0 50px rgba(0,0,0,0.9);
            display: flex; justify-content: center; align-items: center;
            box-sizing: border-box;
            border: 1px solid #333;
          }

          /* Intricate Pattern Overlay */
          .pattern-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: repeating-linear-gradient(45deg, rgba(212, 175, 55, 0.03) 0px, rgba(212, 175, 55, 0.03) 1px, transparent 1px, transparent 10px),
                              repeating-linear-gradient(-45deg, rgba(212, 175, 55, 0.03) 0px, rgba(212, 175, 55, 0.03) 1px, transparent 1px, transparent 10px);
            opacity: 0.5; pointer-events: none;
          }

          .gold-border-container {
            width: 96%; height: 94%;
            border: 4px double #b8860b;
            position: relative;
            display: flex; flex-direction: column; justify-content: space-between;
            padding: 30px;
            box-sizing: border-box;
          }

          /* Corner Ornaments using CSS borders */
          .corner {
            position: absolute; width: 60px; height: 60px;
            border: 2px solid #d4af37;
            border-radius: 2px;
          }
          .tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
          .tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
          .bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
          .br { bottom: 10px; right: 10px; border-left: none; border-top: none; }

          /* Watermark */
          .watermark {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-family: 'Cinzel', serif; font-size: 350px; color: rgba(255, 255, 255, 0.02);
            z-index: 0; pointer-events: none;
          }

          /* Layout */
          .layout-grid {
            display: flex; gap: 40px; align-items: center; height: 100%; z-index: 2; position: relative;
          }

          /* Left Side: Product */
          .left-panel {
            width: 35%; display: flex; flex-direction: column; align-items: center; justify-content: center;
            border-right: 1px solid rgba(212, 175, 55, 0.2); height: 80%;
          }

          .product-halo {
            width: 220px; height: 220px;
            border-radius: 50%;
            padding: 5px;
            background: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7);
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
            margin-bottom: 20px;
          }
          .product-img {
            width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
            border: 5px solid #0a1f1c; background: #000;
          }
          
          .qr-box { margin-top: 20px; padding: 5px; background: #fff; border: 1px solid #d4af37; }

          /* Right Side: Text */
          .right-panel { flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: center; }

          .brand-header {
            font-family: 'Cinzel', serif; font-size: 50px; letter-spacing: 12px; font-weight: 800;
            background: linear-gradient(to bottom, #cfc09f 0%, #ffecb3 50%, #b38728 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 5px; text-transform: uppercase; filter: drop-shadow(0px 2px 0px rgba(0,0,0,0.5));
          }

          .cert-title {
            font-family: 'Pinyon Script', cursive; font-size: 55px; color: #fff;
            margin-top: -10px; margin-bottom: 20px; text-shadow: 0 0 10px rgba(255,255,255,0.3);
          }

          .divider {
            height: 2px; width: 60%; margin: 10px auto;
            background: linear-gradient(90deg, transparent, #d4af37, transparent);
          }

          .main-text {
            font-size: 18px; line-height: 1.6; color: #ccc; margin: 20px 40px; font-style: italic;
          }
          
          .product-name {
            font-family: 'Cinzel', serif; font-size: 32px; color: #d4af37;
            text-transform: uppercase; letter-spacing: 3px; font-weight: bold; margin: 10px 0;
          }

          .details-table {
            width: 80%; margin: 20px auto; border-collapse: collapse;
          }
          .details-table td {
            padding: 8px 15px; border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; text-align: left;
          }
          .details-table td:last-child { color: #fff; font-weight: 600; text-align: right; }

          .signatures {
            display: flex; justify-content: space-around; margin-top: 30px; width: 100%;
          }
          .sig-block { text-align: center; }
          .sig-line { width: 150px; height: 1px; background: #d4af37; margin: 5px auto; }
          .sig-name { font-family: 'Pinyon Script', cursive; font-size: 24px; color: #fff; }
          .sig-role { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #d4af37; }

          .warranty-badge {
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #000; border: 1px solid #d4af37; padding: 8px 30px;
            font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 3px; color: #fff; text-transform: uppercase;
          }

          @media print {
             body, html { width: 297mm; height: 210mm; overflow: hidden; background: none; }
             .cert-frame { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="cert-frame">
          <div class="pattern-overlay"></div>
          <div class="gold-border-container">
             <div class="watermark">Z</div>
             
             <div class="corner tl"></div><div class="corner tr"></div>
             <div class="corner bl"></div><div class="corner br"></div>

             <div class="layout-grid">
                
                <div class="left-panel">
                   <div class="product-halo">
                      <img src="${item.image || 'https://via.placeholder.com/300/000000/d4af37?text=ZERIMI'}" class="product-img" />
                   </div>
                   <div style="text-align:center; color:#888; font-size:10px; letter-spacing:2px; margin-top:10px;">CERTIFIED AUTHENTIC</div>
                   <div class="qr-box">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${item.certificateId}" width="90" height="90" />
                   </div>
                   <div style="font-size:9px; color:#555; margin-top:5px;">SCAN TO VERIFY</div>
                </div>

                <div class="right-panel">
                   <div class="brand-header">ZERIMI</div>
                   <div class="cert-title">Certificate of Authenticity</div>
                   
                   <div class="divider"></div>

                   <p class="main-text">
                      This document certifies that the item identified below is a genuine ZERIMI creation. 
                      It has been crafted with the highest standards of luxury and precision.
                   </p>

                   <div class="product-name">${item.name}</div>

                   <table class="details-table">
                      <tr><td>Owner</td><td>${user.name}</td></tr>
                      <tr><td>Certificate ID</td><td style="font-family:'Cinzel'">${item.certificateId || 'ZER-GEN-001'}</td></tr>
                      <tr><td>Acquired On</td><td>${date}</td></tr>
                      <tr><td>Warranty Valid Until</td><td style="color:#fcf6ba">${expiryString}</td></tr>
                   </table>

                   <div class="signatures">
                      <div class="sig-block">
                         <div class="sig-name">Ashutosh Zerimi</div>
                         <div class="sig-line"></div>
                         <div class="sig-role">Chief Executive Officer</div>
                      </div>
                      <div class="sig-block">
                         <div style="width:60px; height:60px; border-radius:50%; border:2px solid #d4af37; display:flex; align-items:center; justify-content:center; color:#d4af37; font-size:8px; letter-spacing:1px; margin:auto;">OFFICIAL<br>SEAL</div>
                      </div>
                      <div class="sig-block">
                         <div class="sig-name">Verified</div>
                         <div class="sig-line"></div>
                         <div class="sig-role">Quality Assurance</div>
                      </div>
                   </div>
                </div>
             </div>

             <div class="warranty-badge">
                6 Months Limited Warranty &bull; Global Coverage
             </div>

          </div>
        </div>
        <script>
           window.onload = function(){ setTimeout(function(){ window.print(); }, 1500); }
        </script>
      </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
};
// --- 1. HELPER: SMART NOTIFICATION ICON ---
// --- 1. HELPER: SMART NOTIFICATION ICON (CRASH FIXED) ---
// --- 1. HELPER: SMART NOTIFICATION ICON (CRASH FIXED) ---
const getNotificationIcon = (title: string) => {
    // 🛡️ SAFETY CHECK: Agar title undefined/null hai to empty string bana do
    const t = (title || "").toLowerCase(); 
    
    if (t.includes('delivered')) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (t.includes('shipped') || t.includes('track') || t.includes('out')) return <Truck className="w-5 h-5 text-blue-500" />;
    if (t.includes('processing') || t.includes('confirmed')) return <Package className="w-5 h-5 text-amber-500" />;
    if (t.includes('return') || t.includes('refund')) return <RefreshCcw className="w-5 h-5 text-red-500" />;
    return <Info className="w-5 h-5 text-white/50" />;
};

// --- 2. COMPONENT: NOTIFICATION DRAWER (KEY PROP FIXED) ---
// --- 2. COMPONENT: NOTIFICATION DRAWER (FIXED) ---
function NotificationDrawer({ isOpen, onClose, notifications, markRead }: any) {
    if (!isOpen) return null;

    // Safety: Ensure notifications is always an array
    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    // Count only UNREAD notifications
    const unreadCount = safeNotifications.filter((n: any) => !n.isRead).length;

    const handleMarkAllRead = () => {
        safeNotifications.forEach((n: any) => {
            // ✅ FIX: Sirf tab mark karo agar ID exist karti ho
            if (!n.isRead && n.id) {
                markRead(n.id);
            }
        });
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] transition-opacity animate-in fade-in" 
                onClick={onClose}
            ></div>

            <div className={`fixed top-0 right-0 h-full w-[85%] md:w-[400px] bg-[#0f2925] border-l border-white/10 shadow-2xl z-[100] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a1f1c]">
                    <div>
                        <h3 className="font-serif text-xl text-white tracking-wide flex items-center gap-3">
                            Notifications
                            {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold shadow-red-900/20 shadow-lg">{unreadCount} New</span>}
                        </h3>
                        <p className="text-white/40 text-xs mt-1">Updates on your orders & offers.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition group">
                        <X className="w-5 h-5 text-white/60 group-hover:text-red-400" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Recent Activity</span>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider flex items-center gap-1 transition-colors">
                            <Check className="w-3 h-3" /> Mark all read
                        </button>
                    )}
                </div>

                {/* List Area */}
                <div className="overflow-y-auto h-[calc(100vh-140px)] custom-scrollbar p-3 space-y-3">
                    {safeNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm">No new updates yet.</p>
                        </div>
                    ) : (
                        safeNotifications.map((n: any, idx: number) => (
                            <div 
                                // ✅ FIX: Key error hatane ke liye ID ya Index use karein
                                key={n.id || idx} 
                                onClick={() => !n.isRead && n.id && markRead(n.id)}
                                className={`group p-4 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                    n.isRead 
                                    ? 'bg-transparent border-transparent hover:bg-white/5 opacity-60 hover:opacity-100' 
                                    : 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40'
                                }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${n.isRead ? 'bg-white/5 border-white/5' : 'bg-[#0a1f1c] border-amber-500/30 shadow-lg'}`}>
                                        {getNotificationIcon(n.title)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-bold ${n.isRead ? 'text-white/70' : 'text-white'}`}>{n.title || "Notification"}</h4>
                                            <span className="text-[9px] text-white/30 whitespace-nowrap ml-2 font-mono">{n.date || "Just now"}</span>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${n.isRead ? 'text-white/40' : 'text-white/80'}`}>{n.message || "No details available."}</p>
                                    </div>
                                </div>

                                {!n.isRead && (
                                    <div className="absolute top-4 right-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

// --- 2. COMPONENT: NOTIFICATION DRAWER (PREMIUM SLIDER) ---

// --- MAIN COMPONENT ---
export default function CustomerDashboard() {
 const { currentUser, orders, logout, coupons, notifications, wishlist, updateOrderStatus, sendNotification, systemSettings, markNotificationRead } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
const [profileImage, setProfileImage] = useState<string | null>(null);

  // --- Image Sync Fix: Login karte hi photo dikhane ke liye ---
  useEffect(() => {
      if (currentUser?.profileImage) {
          setProfileImage(currentUser.profileImage);
      }
  }, [currentUser]);
  
  // --- NOTIFICATION STATE ---
  
const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [vaultItems, setVaultItems] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (!currentUser) router.push('/login');
  }, [currentUser, router]);

  // Click Outside to Close Notification
 
// --- 🟢 UPDATED: VAULT LOGIC (Auto Create & Auto Delete) ---
  useEffect(() => {
    if (currentUser && orders) {
        const userEmail = currentUser.email.toLowerCase();
        
        // 1. Sirf 'Delivered' orders ko filter karo.
        // Jaise hi Admin status badal kar 'Returned' karega, ye filter usse hata dega.
        const deliveredOrders = orders.filter(o => 
            o.customerEmail?.toLowerCase() === userEmail && 
            o.status.toLowerCase() === 'delivered' // Case-insensitive check
        );

        // 2. Items ko map karke Certificate banao
        const certificates = deliveredOrders.flatMap(order => 
            order.items.map((item, index) => {
                // Stable Certificate ID generate karna (Order ID + Item Index)
                // Taki refresh karne par ID badle nahi
                const cleanOrderId = order.id.replace('ZER-', '').replace(/-/g, '');
                const stableCertId = `CERT-${cleanOrderId}-${index + 1}`;

                return { 
                    ...item, 
                    orderId: order.id, 
                    purchaseDate: order.date, 
                    certificateId: stableCertId 
                };
            })
        );
        
        setVaultItems(certificates);
    }
  }, [orders, currentUser]);

  if (!isMounted || !currentUser) return null;

  const userEmail = currentUser.email.toLowerCase();
 // ✅ FIX: Notifications Sorted (Newest First) & Filtered
  // Hum array ko reverse kar rahe hain kyunki Firebase usually purana data pehle bhejta hai
  const myNotifications = notifications
      .filter((n: any) => n.userId.toLowerCase() === userEmail)
      .slice() // Copy array to avoid mutating state directly
      .reverse();
  const myOrders = orders.filter((o: Order) => o.customerEmail?.toLowerCase() === userEmail);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const handleReturnRequest = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // 1. Check Logic
    if (!order || !isOrderReturnable(order.date)) {
        return toast.error("Return window (3 days) has expired.");
    }

    // 2. Confirmation & Action
    // Note: Native confirm thik hai, ya aap custom modal bhi bana sakte hain future mein
    if(confirm("Are you sure you want to return this item?")) {
        // Update Status
        updateOrderStatus(orderId, 'Return Requested');
        
        // Notify Admin
        sendNotification('admin@zerimi.com', 'Return Request', `User ${currentUser.name} requested return for Order #${orderId}`);
        
        // ✅ Premium Success Message
        toast.success("Return Request Submitted! Our team will review it shortly.");
        
        // Refresh UI
        router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1c] pt-28 pb-12 font-sans text-white flex flex-col md:flex-row relative">
      {/* 👇 YE LINE ADD KAREIN (Ye naya Drawer hai) */}
      <NotificationDrawer 
         isOpen={isNotifOpen} 
         onClose={() => setIsNotifOpen(false)} 
         notifications={myNotifications} 
         markRead={markNotificationRead} 
      />
      {/* SIDEBAR - Styled to match Admin/Auth */}
      <aside className="w-full md:w-80 bg-[#0f2925] border-r md:border border-white/5 flex-shrink-0 md:min-h-[calc(100vh-7rem)] p-6 md:m-4 md:rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        {/* User Profile Header */}
        <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-white/10 relative z-10">
           <div className="relative w-24 h-24 mb-4 group cursor-pointer">
              <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-amber-200 to-amber-600">
                <div className="w-full h-full rounded-full bg-[#0a1f1c] overflow-hidden flex items-center justify-center text-3xl font-serif text-amber-200 relative">
                   {profileImage ? <Image src={profileImage} alt="Profile" fill className="object-cover" /> : currentUser.name.charAt(0).toUpperCase()}
                </div>
              </div>
           </div>
           <h2 className="font-serif text-xl tracking-wide text-white">{currentUser.name}</h2>
           <div className="flex items-center gap-2 mt-2">
             <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
             <p className="text-xs text-amber-400 uppercase tracking-widest">{currentUser.tier || 'Silver'} Member</p>
           </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar relative z-10">
           <SidebarItem icon={<Award />} label="Overview" id="overview" active={activeTab} onClick={setActiveTab} />
           <SidebarItem icon={<ShoppingBag />} label="My Orders" id="orders" active={activeTab} onClick={setActiveTab} />
           <SidebarItem icon={<RotateCcw />} label="Returns & Refunds" id="returns" active={activeTab} onClick={setActiveTab} />
           
           {/* Notification Button */}
          <button 
             onClick={() => setIsNotifOpen(true)}
             className={`w-full flex items-center gap-4 p-4 rounded-xl text-sm transition-all duration-300 group ${isNotifOpen ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
           >
              <span className={isNotifOpen ? "text-white" : "text-amber-500/80 group-hover:text-amber-400"}><Bell className="w-5 h-5"/></span>
              <span className="tracking-wide flex-1 text-left">Notifications</span>
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">{unreadCount}</span>}
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isNotifOpen ? 'rotate-90' : ''}`} />
           </button>

           <SidebarItem icon={<Key />} label="My Vault" id="vault" active={activeTab} onClick={setActiveTab} />
           <SidebarItem icon={<Tag />} label="Coupons & Offers" id="coupons" active={activeTab} onClick={setActiveTab} />
           <SidebarItem icon={<Heart />} label="Wishlist" id="wishlist" active={activeTab} onClick={setActiveTab} count={wishlist.length} />
           <SidebarItem icon={<User />} label="Profile & Address" id="profile" active={activeTab} onClick={setActiveTab} />
        </nav>

        {/* Logout */}
        <div className="pt-6 border-t border-white/10 relative z-10">
           <button onClick={() => { logout(); router.push('/'); }} className="flex items-center gap-3 text-white/40 hover:text-red-400 transition w-full p-3 rounded-lg hover:bg-white/5 group">
             <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition" /> Sign Out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-7rem)]">
         <AnimatePresence mode='wait'>
            <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
            >
               {activeTab === 'overview' && <OverviewTab user={currentUser} orders={myOrders} setActiveTab={setActiveTab} />}
               {/* ✅ 2. YAHAN 'settings={systemSettings}' ADD KAREIN */}
             {activeTab === 'orders' && <OrdersTab orders={myOrders} onReturn={handleReturnRequest} settings={systemSettings} sendNotification={sendNotification} currentUser={currentUser} />}
               
               {activeTab === 'returns' && <ReturnsTab orders={myOrders} />}
               {activeTab === 'vault' && <VaultTab vaultItems={vaultItems} user={currentUser} />}
              {/* ✅ user prop pass kiya taaki email check kar sakein */}
{activeTab === 'coupons' && <CouponsTab coupons={coupons} user={currentUser} />}
               {activeTab === 'wishlist' && <WishlistTab wishlist={wishlist} />}
               {activeTab === 'profile' && <ProfileTab user={currentUser} profileImage={profileImage} setProfileImage={setProfileImage} />}
            </motion.div>
         </AnimatePresence>
      </main>

      {/* --- NOTIFICATION POPUP (Dark Theme) --- */}
    

    </div>
  );
}

// --- SUB COMPONENTS (Dark Themed) ---

function SidebarItem({ icon, label, id, active, onClick, count }: any) {
  return (
    <button onClick={() => onClick(id)} className={`w-full flex items-center gap-4 p-4 rounded-xl text-sm transition-all duration-300 group ${active === id ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active === id ? 'text-white' : 'text-amber-500/80 group-hover:text-amber-400'}`}>{icon}</span>
      <span className="tracking-wide flex-1 text-left">{label}</span>
      {count > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{count}</span>}
      {active === id && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function OverviewTab({ user, orders, setActiveTab }: any) {
  // ✅ FIX: Router yahan define karein
  const router = useRouter();
  
  const totalValue = orders.reduce((sum: number, o: Order) => sum + o.total, 0);
  const lastOrder = orders.length > 0 ? orders[0] : null;
  
  return (
    <div className="space-y-8">
       {lastOrder && (
         <div className="bg-[#0f2925] rounded-xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-white/5">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <Sparkles className="w-4 h-4 text-amber-400" />
                     <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Order Confirmed</p>
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl mb-2 text-white">Thank you for your patronage.</h3>
                  <p className="text-white/70 text-sm font-light max-w-xl leading-relaxed">
                     Your recent acquisition (Order <span className="font-mono text-amber-200">#{lastOrder.id}</span>) is being processed.
                  </p>
               </div>
               
               <button 
                  onClick={() => router.push(`/track-order?orderId=${lastOrder.id}`)}
                  className="px-6 py-3 border border-amber-500/30 text-amber-400 text-xs uppercase tracking-widest hover:bg-amber-600 hover:text-[#0a1f1c] hover:border-amber-600 transition rounded-lg font-bold"
               >
                  Track Status
               </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         </div>
       )}
       <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
             <h2 className="font-serif text-3xl md:text-4xl text-white mb-2">Welcome Back, {user.name.split(' ')[0]}</h2>
             <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm hover:border-amber-500/30 transition"><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Collection Value</p><h3 className="text-2xl font-serif text-white">₹{totalValue.toLocaleString()}</h3></div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm hover:border-amber-500/30 transition"><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Loyalty Points</p><h3 className="text-2xl font-serif text-amber-500">{user.points?.toLocaleString() || 0}</h3></div>
             </div>
          </div>
       </div>
    </div>
  );
}

function OrdersTab({ orders, onReturn, settings, sendNotification, currentUser }: any) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // --- 1. SORTING & GROUPING LOGIC ---
    // Pehle orders ko Date ke hisab se sort karein (Newest First)
    const sortedOrders = [...orders].sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Active Statuses define karein
    const activeStatuses = ['Placed', 'Processing', 'Confirmed', 'Shipped', 'Out for Delivery'];

    // Do groups mein baatein
    const activeOrders = sortedOrders.filter(o => activeStatuses.includes(o.status));
    const pastOrders = sortedOrders.filter(o => !activeStatuses.includes(o.status));

    // --- CANCEL HANDLER (Same Logic) ---
    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setLoadingId(orderId);
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) { toast.error("Order not found!"); setLoadingId(null); return; }
            const orderData = orderSnap.data();
            if ((orderData as any).shiprocketOrderId || (orderData as any).awb || (orderData as any).shipmentId) { toast.error("Cannot cancel: Shipment/AWB already generated."); setLoadingId(null); return; }
            await updateDoc(orderRef, { status: 'Cancelled', cancelledAt: new Date().toISOString(), cancellationReason: 'User requested cancellation' });
            if (sendNotification) {
                /* Notification Logic (Hidden for brevity, same as before) */
            }
            toast.success("Order cancelled successfully");
            router.refresh();
        } catch (error) { console.error(error); toast.error("Failed to cancel order"); } finally { setLoadingId(null); }
    };

    // --- HELPER: CARD RENDERER (Dry Code) ---
    const OrderCard = ({ order }: { order: Order }) => {
        const isCancellable = activeStatuses.includes(order.status) && !(order as any).shiprocketOrderId && !(order as any).awb;
        const formattedDate = new Date(order.date).toLocaleDateString('en-GB');

        return (
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative bg-[#0f2925] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-500 shadow-xl mb-6"
            >
                {/* TOP BAR */}
                <div className="bg-black/30 px-5 py-3 md:px-6 md:py-4 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] ${order.status === 'Delivered' ? 'bg-green-500 shadow-green-500' : 'bg-amber-500 shadow-amber-500'}`}></span>
                        <p className="text-[10px] md:text-xs font-mono text-white/60 tracking-wider">#{order.id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${
                        order.status === 'Delivered' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        order.status === 'Cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                        {order.status}
                    </div>
                </div>

                {/* INFO GRID */}
                <div className="px-5 py-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 items-center border-b border-white/5 bg-[#0f2925]">
                    <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Date</p>
                        <p className="text-xs md:text-sm font-medium text-white">{formattedDate}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Total</p>
                        <p className="text-xs md:text-sm font-bold text-amber-400 font-serif">₹{order.total.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-start md:justify-end">
                        {order.status === 'Delivered' ? (
                            <button
                                onClick={() => downloadInvoice({ ...order, name: (order as any).name || (order as any).customerName || currentUser?.name || "Valued Customer" }, settings)}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-500/20 px-4 py-2 rounded hover:bg-amber-500 hover:text-[#0a1f1c] transition-all w-full md:w-auto justify-center"
                            >
                                <FileText className="w-3 h-3" /> Invoice
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded border border-white/5 w-full md:w-auto justify-center">
                                <Lock className="w-3 h-3 text-white/20" />
                                <span className="text-[9px] text-white/30 uppercase font-bold tracking-wide">Invoice Locked</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ITEMS */}
                <div className="p-5 md:p-6 space-y-4 bg-gradient-to-b from-[#0f2925] to-[#0a1f1c]">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start md:items-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-sm relative">
                                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-serif text-sm md:text-lg text-white leading-tight truncate">{item.name}</h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                    <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5">Qty: {item.qty}</span>
                                    <span className="text-xs text-white/70">₹{item.price.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bg-white/[0.02] p-4 md:px-6 md:py-4 flex flex-col md:flex-row justify-end items-center gap-3 border-t border-white/5">
                    {isCancellable && (
                        <button onClick={() => handleCancelOrder(order.id)} disabled={loadingId === order.id} className="w-full md:w-auto py-3 md:py-2 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-300 transition border border-transparent hover:border-red-500/20 rounded">
                            {loadingId === order.id ? 'Processing...' : 'Cancel Order'}
                        </button>
                    )}
                    {order.status === 'Delivered' && (
                        <button onClick={() => onReturn(order.id)} disabled={!isOrderReturnable(order.date)} className={`w-full md:w-auto py-3 md:py-2 px-6 rounded text-[10px] uppercase font-bold tracking-wide transition flex items-center justify-center gap-2 border ${isOrderReturnable(order.date) ? 'border-white/20 hover:border-white/50 text-white hover:bg-white/5' : 'border-transparent text-white/20 cursor-not-allowed'}`}>
                            <RotateCcw className="w-3 h-3" /> Return Item
                        </button>
                    )}
                    <button onClick={() => router.push(`/track-order?orderId=${order.id}`)} className="w-full md:w-auto bg-white text-[#0a1f1c] px-8 py-3 md:py-2.5 rounded text-[10px] uppercase font-bold tracking-widest hover:bg-stone-200 transition-all flex items-center justify-center gap-2 shadow-lg">
                        Track Shipment <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </motion.div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* MAIN HEADER (APPEARS ONLY ONCE) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                    <h2 className="font-serif text-3xl text-white tracking-wide">Purchase History</h2>
                    <p className="text-white/40 text-xs md:text-sm mt-1 font-light tracking-wide">
                        Manage your acquisitions and track shipments.
                    </p>
                </div>
                {sortedOrders.length > 0 && (
                    <div className="bg-[#0a1f1c] border border-amber-500/20 px-4 py-2 rounded-full self-start md:self-auto">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingBag className="w-3 h-3" /> {sortedOrders.length} Total Orders
                        </span>
                    </div>
                )}
            </div>

            {sortedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-[#0f2925]/50 rounded-3xl border border-dashed border-white/10 mx-auto max-w-2xl">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full flex items-center justify-center mb-6 ring-1 ring-amber-500/20">
                        <ShoppingBag className="w-8 h-8 text-amber-500/50" />
                    </div>
                    <h3 className="text-white font-serif text-2xl mb-2">Your collection is empty</h3>
                    <p className="text-white/40 mb-8 font-light text-sm text-center px-4">Begin your journey with our exclusive jewelry selection.</p>
                    <Link href="/" className="px-10 py-4 bg-white text-[#0a1f1c] text-xs font-bold uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-amber-50 transition-all duration-300 transform hover:-translate-y-1">
                        Explore Collection
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* SECTION 1: ACTIVE ORDERS */}
                    {activeOrders.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Shipments</h3>
                            </div>
                            <div>
                                {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: PAST ORDERS */}
                    {pastOrders.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <span className="w-2 h-2 rounded-full bg-white/20"></span>
                                <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Past Orders</h3>
                            </div>
                            <div>
                                {pastOrders.map(order => <OrderCard key={order.id} order={order} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
function ReturnsTab({ orders }: { orders: Order[] }) {
    const returnOrders = orders.filter(o => ['Return Requested', 'Returned', 'Return Approved', 'Return Rejected'].includes(o.status));
    return (
        <div className="space-y-6">
            <h2 className="font-serif text-2xl text-white mb-6">Returns & Refunds</h2>
            {returnOrders.length === 0 ? (
                <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <RefreshCcw className="w-12 h-12 text-white/20 mx-auto mb-4"/>
                    <p className="text-white/50">No active return requests.</p>
                </div>
            ) : returnOrders.map(order => (
                    <div key={order.id} className="bg-[#0f2925] p-6 rounded-2xl border border-white/10 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full"><RotateCcw className="w-6 h-6" /></div>
                            <div><h4 className="font-bold text-white">Order #{order.id}</h4><p className="text-sm text-white/50">Status: {order.status}</p></div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide mb-1 border border-amber-500/20">{order.status}</span>
                            <p className="text-xs text-white/40">Refund Amount: ₹{order.total.toLocaleString()}</p>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

function VaultTab({ vaultItems, user }: any) {
  return (
    <div className="space-y-8">
       <div className="bg-[#0f2925] text-white p-8 rounded-2xl mb-8 relative overflow-hidden border border-white/5">
          <div className="relative z-10"><h2 className="font-serif text-3xl mb-2">My Vault</h2><p className="text-white/60 text-sm max-w-md">Securely stored digital certificates for your purchases.</p></div>
          <Key className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white/5" />
       </div>
       {vaultItems.length === 0 ? (
          <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
             <ShieldCheck className="w-12 h-12 text-white/20 mx-auto mb-4"/>
             <h3 className="text-white font-serif text-lg mb-2">Your Vault is Empty</h3>
             <p className="text-white/50 text-sm max-w-xs mx-auto">Certificates will appear here once orders are delivered.</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {vaultItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#0f2925] border border-white/10 p-6 rounded-2xl shadow-lg hover:border-amber-500/30 transition group relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">VERIFIED</div>
                   <div className="flex gap-4 mb-6">
                      <div className="w-16 h-16 bg-black/30 rounded-lg overflow-hidden relative border border-white/10">
                         {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                      </div>
                      <div>
                         <h4 className="font-serif text-lg text-white">{item.name}</h4>
                         <p className="text-xs text-white/50 mt-1">Order #{item.orderId}</p>
                         <p className="text-[10px] text-white/30 mt-1 font-mono">{item.certificateId}</p>
                      </div>
                   </div>
                   <button onClick={() => generateCertificate(item, user, item.purchaseDate)} className="w-full py-3 border border-white/10 text-white/80 rounded-lg text-xs uppercase font-bold hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Download Certificate
                   </button>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}

// ✅ UPDATED COUPON TAB (Isse replace karein)
function CouponsTab({ coupons, user }: any) {
  
  // 🔥 Logic: Sirf wahi coupons dikhao jo Public hain YA mere liye hain
  const myCoupons = coupons.filter((coupon: any) => {
      // 1. Agar 'allowedEmail' khali hai -> Public Coupon (Sabko dikhega)
      if (!coupon.allowedEmail) return true;

      // 2. Agar 'allowedEmail' hai -> Check karo ki mera email match karta hai ya nahi
      // (Optional chaining '?' zaroori hai taaki agar user data na ho to crash na kare)
      return user?.email && coupon.allowedEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
  });

  return (
    <div className="space-y-6">
       <h2 className="font-serif text-2xl text-white mb-6">Exclusive Offers</h2>
       
       {myCoupons.length === 0 ? (
           <div className="p-10 text-center bg-white/5 rounded-2xl border border-white/10 text-white/40">
               No active offers available for you right now.
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCoupons.map((coupon: any) => (
                 <div key={coupon.code} className={`p-6 rounded-2xl relative overflow-hidden shadow-lg border group transition-all ${coupon.allowedEmail ? 'bg-gradient-to-br from-amber-900/40 to-black border-amber-500/50' : 'bg-gradient-to-br from-stone-900 to-black border-white/10'}`}>
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10">
                       <div className="flex justify-between items-start mb-1">
                           <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                               {coupon.allowedEmail ? '💎 Personalized For You' : 'ZERIMI Exclusive'}
                           </p>
                           {/* Agar Personalized hai to Lock Icon dikhao */}
                           {coupon.allowedEmail && <span className="bg-amber-500/20 text-amber-400 p-1 rounded"><Lock className="w-3 h-3" /></span>}
                       </div>

                       <h3 className="font-serif text-3xl text-white mt-2">
                           {coupon.type === 'percent' ? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}
                       </h3>
                       <p className="text-white/60 text-sm mt-2">{coupon.description || 'Applicable on your next order.'}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                       <div className="bg-white/10 px-4 py-2 rounded-lg font-mono tracking-widest text-amber-200 border border-amber-500/20 select-all cursor-pointer hover:bg-white/20 transition">
                           {coupon.code}
                       </div>
                       <p className="text-[10px] text-white/40">Expires: {coupon.expiryDate || 'Valid Forever'}</p>
                    </div>
                 </div>
              ))}
           </div>
       )}
    </div>
  );
}

function WishlistTab({ wishlist }: { wishlist: any[] }) {
   if (wishlist.length === 0) return <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10"><Heart className="w-12 h-12 text-white/20 mx-auto mb-4" /><p className="text-white/50">Wishlist empty.</p><Link href="/category/all" className="text-amber-500 text-sm font-bold mt-2 inline-block hover:underline">Start Exploring</Link></div>;
   return <div className="space-y-6"><h2 className="font-serif text-2xl mb-6 text-white">My Wishlist</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{wishlist.map((product) => <ProductCard key={product.id} product={product} />)}</div></div>;
}

// ✅ Is poore function ko copy karke purane ProfileTab ki jagah paste karein
// ✅ Is poore function ko copy karke purane ProfileTab ki jagah paste karein
// ✅ Is updated function ko paste karein (Toast Notifications Added)
function ProfileTab({ user, profileImage, setProfileImage }: any) {
   const { updateUserProfile } = useStore(); 
   const [isEditing, setIsEditing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   
   // --- 1. INITIAL STATE ---
   const [formData, setFormData] = useState({ 
       name: user?.name || '', 
       email: user?.email || '', 
       phone: user?.phone || (user as any)?.mobile || '',
       alternatePhone: user?.alternatePhone || '',
       dob: user?.dob || '',
       gender: user?.gender || 'Select'
   });
   
   const [addresses, setAddresses] = useState(user?.addresses || []);
   const [showAddAddress, setShowAddAddress] = useState(false);
   const [newAddress, setNewAddress] = useState({ type: 'Home', text: '', pin: '' });
   const fileInputRef = useRef<HTMLInputElement>(null);

   // --- SYNC DATA ---
   useEffect(() => {
       if (user && !isEditing) {
           setFormData({
               name: user.name || '',
               email: user.email || '',
               phone: user.phone || (user as any).mobile || '',
               alternatePhone: user.alternatePhone || '',
               dob: user.dob || '',
               gender: user.gender || 'Select'
           });
           setAddresses(user.addresses || []);
           if (user.profileImage) setProfileImage(user.profileImage);
       }
   }, [user, isEditing, setProfileImage]);

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
       const file = e.target.files?.[0]; 
       if (file) { 
           const reader = new FileReader(); 
           reader.onloadend = () => setProfileImage(reader.result as string); 
           reader.readAsDataURL(file); 
       } 
   };

   // --- SAVE FUNCTION ---
   const handleSaveProfile = async () => { 
       if (!user || !user.id) return toast.error("User ID missing. Login again.");
       setIsSaving(true);
       try {
           await updateUserProfile(user.id, {
               ...formData,
               profileImage: profileImage || "", 
               addresses: addresses 
           });
           setIsEditing(false); 
           toast.success("Profile Updated Successfully!");
       } catch (error: any) { 
           console.error(error); 
           toast.error("Failed to update profile.");
       } finally { 
           setIsSaving(false); 
       }
   };

   // --- ADDRESS HANDLERS ---
   const handleAddAddress = async () => { 
       if(!newAddress.text) return toast.error("Address is required");
       const updatedList = [...addresses, { ...newAddress, id: Date.now(), isDefault: false }];
       setAddresses(updatedList); 
       try {
           if (user?.id) await updateUserProfile(user.id, { addresses: updatedList }); 
           setShowAddAddress(false); 
           setNewAddress({ type: 'Home', text: '', pin: '' }); 
           toast.success("New Address Added");
       } catch (error) { toast.error("Failed to add address"); }
   };

   const removeAddress = async (id: number) => { 
       const updatedList = addresses.filter((a: any) => a.id !== id);
       setAddresses(updatedList);
       try {
           if (user?.id) await updateUserProfile(user.id, { addresses: updatedList });
           toast.success("Address Removed");
       } catch (error) { toast.error("Failed to delete address"); }
   };

   return (
      <div className="max-w-6xl mx-auto animate-fade-in pb-24">
         <Toaster position="top-center" toastOptions={{ style: { background: '#0f2925', color: '#fff', border: '1px solid #d4af37' } }} />

         {/* --- HEADER: TITLE & ACTIONS --- */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-white/5 pb-8">
            <div className="space-y-2">
                <h2 className="font-serif text-3xl md:text-4xl text-white tracking-wide">
                    <span className="text-amber-500">My</span> Profile
                </h2>
                <p className="text-white/40 text-sm font-light max-w-md">
                    Manage your personal information and shipping addresses to ensure a seamless luxury experience.
                </p>
            </div>
            
            {!isEditing ? (
               <button onClick={() => setIsEditing(true)} className="group flex items-center gap-3 px-8 py-3 rounded-full border border-amber-500/30 text-amber-400 bg-amber-900/10 hover:bg-amber-500 hover:text-[#0a1f1c] transition-all duration-300 text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-amber-500/20">
                  <Edit2 className="w-4 h-4 group-hover:scale-110 transition" /> Edit Details
               </button>
            ) : (
               <div className="flex items-center gap-4">
                  <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-6 py-2.5 rounded-full text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition">
                      Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-0.5">
                     {isSaving ? "Saving..." : <><Save className="w-4 h-4"/> Save Changes</>}
                  </button>
               </div>
            )}
         </div>

         <div className="flex flex-col xl:flex-row gap-12">
            
            {/* --- LEFT: EXCLUSIVE PROFILE CARD --- */}
            <div className="w-full xl:w-1/3 space-y-8">
                {/* Image Card */}
                <div className="bg-[#0f2925] border border-white/5 p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col items-center text-center group">
                    {/* Background Glow */}
                    <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-amber-500/10 to-transparent opacity-50"></div>
                    
                    {/* Profile Image Wrapper */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-300 to-amber-700 rounded-full blur-md opacity-40 group-hover:opacity-70 transition duration-700"></div>
                        <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-amber-200 to-amber-600 cursor-pointer shadow-2xl" onClick={() => isEditing && fileInputRef.current?.click()}>
                           <div className="w-full h-full rounded-full bg-[#0a1f1c] overflow-hidden relative border-4 border-[#0a1f1c]">
                              {profileImage ? (
                                  <Image src={profileImage} alt="Profile" fill className="object-cover transition duration-700 group-hover:scale-110" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-5xl text-amber-500/30 font-serif">{user?.name?.charAt(0) || 'U'}</div>
                              )}
                              
                              {/* Edit Overlay */}
                              {isEditing && (
                                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                     <Camera className="w-6 h-6 text-amber-400 mb-1" />
                                     <span className="text-[8px] text-white uppercase tracking-widest font-bold">Update</span>
                                  </div>
                              )}
                           </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={!isEditing} />
                        
                        {/* Tier Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 border border-amber-500/50 px-4 py-1 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{user?.tier || 'Silver'} Member</span>
                        </div>
                    </div>

                    {/* Name & Email */}
                    <h3 className="text-2xl text-white font-serif tracking-wide">{user?.name || 'Valued Customer'}</h3>
                    <p className="text-white/40 text-sm mt-1">{user?.email}</p>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 w-full mt-8 pt-8 border-t border-white/5">
                        <div>
                            <p className="text-amber-500 font-serif text-xl">{user?.points || 0}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Loyalty Points</p>
                        </div>
                        <div>
                            <p className="text-white font-serif text-xl">{addresses.length}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Addresses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT: DETAILS FORM & ADDRESSES --- */}
            <div className="w-full xl:w-2/3 space-y-8">
               
               {/* 1. PERSONAL DETAILS SECTION */}
               <div className="bg-[#0f2925] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
                   {/* Decoration */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                   <h4 className="font-serif text-xl text-white mb-8 flex items-center gap-3">
                       <span className="bg-amber-500/10 p-2 rounded-lg text-amber-500"><User className="w-5 h-5" /></span>
                       Personal Information
                   </h4>
                   
                   {/* Form Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      
                      {/* Full Name */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest ml-1">Full Name</label>
                          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full bg-black/20 text-white px-5 py-4 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all ${isEditing ? 'border-amber-500/30' : 'border-transparent text-white/70'}`} readOnly={!isEditing} />
                      </div>

                      {/* Email (Locked) */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Email (Verified)</label>
                          <div className="flex items-center gap-3 bg-white/[0.02] px-5 py-4 rounded-xl border border-white/5">
                              <span className="text-white/40 text-sm flex-1">{formData.email}</span>
                              <ShieldCheck className="w-4 h-4 text-green-500/40"/>
                          </div>
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest ml-1">Gender</label>
                          {isEditing ? (
                              <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-black/20 text-white px-5 py-4 rounded-xl border border-amber-500/30 focus:outline-none appearance-none cursor-pointer">
                                  <option value="Select" disabled>Select Gender</option>
                                  <option value="Male" className="bg-[#0f2925]">Male</option>
                                  <option value="Female" className="bg-[#0f2925]">Female</option>
                                  <option value="Other" className="bg-[#0f2925]">Other</option>
                              </select>
                          ) : (
                              <input type="text" value={formData.gender} readOnly className="w-full bg-black/20 text-white/70 px-5 py-4 rounded-xl border border-transparent" />
                          )}
                      </div>

                      {/* DOB */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest ml-1">Date of Birth</label>
                          <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className={`w-full bg-black/20 text-white px-5 py-4 rounded-xl border focus:outline-none ${isEditing ? 'border-amber-500/30' : 'border-transparent text-white/70'}`} readOnly={!isEditing} />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest ml-1">Primary Mobile</label>
                          <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91..." className={`w-full bg-black/20 text-white px-5 py-4 rounded-xl border focus:outline-none ${isEditing ? 'border-amber-500/30' : 'border-transparent text-white/70'}`} readOnly={!isEditing} />
                      </div>

                      {/* Alt Phone */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest ml-1">Alternate Mobile</label>
                          <input type="text" value={formData.alternatePhone} onChange={(e) => setFormData({...formData, alternatePhone: e.target.value})} placeholder="Optional Backup" className={`w-full bg-black/20 text-white px-5 py-4 rounded-xl border focus:outline-none ${isEditing ? 'border-amber-500/30' : 'border-transparent text-white/70'}`} readOnly={!isEditing} />
                      </div>
                   </div>
               </div>

               {/* 2. ADDRESSES SECTION */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                     <h4 className="font-serif text-xl text-white flex items-center gap-3">
                        <span className="bg-amber-500/10 p-2 rounded-lg text-amber-500"><Home className="w-5 h-5" /></span>
                        Saved Locations
                     </h4>
                     <button onClick={() => setShowAddAddress(true)} className="flex items-center gap-2 text-[10px] font-bold text-amber-500 border border-amber-500/30 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-amber-500 hover:text-[#0a1f1c] transition-all">
                        <Plus className="w-3 h-3"/> Add New
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     {addresses.map((addr: any, idx: number) => (
                        <div key={addr.id || idx} className="group relative bg-[#0f2925] p-6 rounded-2xl border border-white/5 hover:border-amber-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1">
                           {/* Decorative Stripe */}
                           <div className="absolute top-4 left-0 w-1 h-12 bg-amber-500/20 group-hover:bg-amber-500 rounded-r-full transition-all duration-300"></div>
                           
                           <div className="flex justify-between items-start mb-4 pl-4">
                              <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-2 ${addr.type === 'Home' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-blue-500/10 text-blue-300 border border-blue-500/10'}`}>
                                 {addr.type === 'Home' ? <Home className="w-3 h-3"/> : <Briefcase className="w-3 h-3"/>} 
                                 {addr.type || 'Home'}
                              </span>
                              <button onClick={() => removeAddress(addr.id)} className="text-white/20 hover:text-red-400 transition p-2 hover:bg-white/5 rounded-full">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                           
                           <p className="text-sm text-white/80 leading-relaxed font-light mb-3 pl-4 line-clamp-2 h-10">
                               {addr.text || (addr.street ? `${addr.street}, ${addr.city}` : 'Details unavailable')}
                           </p>
                           <p className="text-xs text-white/30 font-mono tracking-wide pl-4 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span> PIN: {addr.pin || addr.pincode}
                           </p>
                        </div>
                     ))}
                     
                     {/* Add Button Placeholder (Empty State) */}
                     {addresses.length === 0 && (
                         <div onClick={() => setShowAddAddress(true)} className="col-span-full border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-white/30 hover:text-amber-500 hover:border-amber-500/30 cursor-pointer transition-all">
                             <Plus className="w-8 h-8 mb-2" />
                             <span className="text-xs font-bold uppercase tracking-widest">Add First Address</span>
                         </div>
                     )}
                  </div>

                  {/* Add Address Modal */}
                  {showAddAddress && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-[#0a1f1c] w-full max-w-lg rounded-3xl border border-amber-500/20 shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f2925]">
                               <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                   <Home className="w-4 h-4 text-amber-500"/> New Location
                               </h4>
                               <button onClick={() => setShowAddAddress(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition"><X className="w-4 h-4"/></button>
                           </div>
                           
                           <div className="p-8 space-y-6">
                              <div className="flex gap-4">
                                 <div className="w-1/3">
                                     <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Label</label>
                                     <select className="w-full p-4 bg-black/30 border border-white/10 text-white rounded-xl text-sm outline-none focus:border-amber-500/50 appearance-none" value={newAddress.type} onChange={(e) => setNewAddress({...newAddress, type: e.target.value})}>
                                         <option value="Home" className="bg-[#0f2925]">Home</option>
                                         <option value="Office" className="bg-[#0f2925]">Office</option>
                                         <option value="Other" className="bg-[#0f2925]">Other</option>
                                     </select>
                                 </div>
                                 <div className="flex-1">
                                     <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Pincode</label>
                                     <input className="w-full p-4 bg-black/30 border border-white/10 text-white rounded-xl text-sm outline-none focus:border-amber-500/50" placeholder="e.g. 400050" value={newAddress.pin} onChange={(e) => setNewAddress({...newAddress, pin: e.target.value})} />
                                 </div>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Complete Address</label>
                                  <textarea className="w-full p-4 bg-black/30 border border-white/10 text-white rounded-xl text-sm h-28 resize-none outline-none focus:border-amber-500/50 placeholder:text-white/20" placeholder="House No, Street, Landmark, City..." value={newAddress.text} onChange={(e) => setNewAddress({...newAddress, text: e.target.value})} />
                              </div>
                              <button onClick={handleAddAddress} className="w-full py-4 bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-900/20 transition-all transform hover:-translate-y-0.5">
                                  Save Address
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}