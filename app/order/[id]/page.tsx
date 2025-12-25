"use client";
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CheckCircle, Printer, Download, MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Number to Words function (Simplified for Indian Currency)
function numberToWords(price: number) {
  const sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensPlace = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  // Note: Full implementation usually requires a library, returning simple string for demo
  return price + " Rupees Only"; 
}

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { orders, banner } = useStore();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Order Not Found</div>;
  }

  // GST Calculation (Assuming 3% Total GST => 1.5% CGST + 1.5% SGST)
  const gstRate = 1.5; 
  const cgstAmount = Math.round(order.subtotal * (gstRate / 100));
  const sgstAmount = Math.round(order.subtotal * (gstRate / 100));
  const totalTax = cgstAmount + sgstAmount;

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
      
      {/* Success Message (Hidden on Print) */}
      <div className="max-w-3xl mx-auto text-center mb-8 print:hidden">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="font-serif text-3xl text-stone-900 mb-2">Order Confirmed!</h1>
        <p className="text-stone-500">Invoice #{order.invoiceNo} has been generated.</p>
        <div className="flex justify-center gap-4 mt-6">
           <button onClick={() => window.print()} className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 uppercase text-xs tracking-widest hover:bg-amber-700 rounded-lg">
             <Printer className="w-4 h-4" /> Print / Save PDF
           </button>
           <Link href="/dashboard" className="flex items-center gap-2 border border-stone-900 px-6 py-3 uppercase text-xs tracking-widest hover:bg-stone-200 rounded-lg">
             Go to Dashboard
           </Link>
        </div>
      </div>

      {/* --- GST INVOICE PAPER --- */}
      <div className="max-w-[210mm] mx-auto bg-white p-12 shadow-lg print:shadow-none print:w-full print:max-w-none print:p-8" id="invoice">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-stone-900 pb-6 mb-6">
           <div className="w-40">
              {/* Logo */}
              <div className="relative h-12 w-full mb-2">
                 <Image src={banner.logoDark} alt="ZERIMI" fill className="object-contain object-left" />
              </div>
              <p className="text-xs text-stone-500">Luxury Artificial Jewelry</p>
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-bold text-stone-900 uppercase tracking-widest">Tax Invoice</h2>
              <p className="text-xs text-stone-500 mt-1">Original for Recipient</p>
           </div>
        </div>

        {/* Seller & Buyer Details */}
        <div className="flex justify-between mb-8 text-sm">
           <div className="w-[48%]">
              <h3 className="font-bold text-stone-900 uppercase text-xs mb-2 bg-stone-100 p-1 pl-2">Sold By (Seller)</h3>
              <div className="pl-2">
                 <p className="font-bold text-lg">ZERIMI India Pvt Ltd.</p>
                 <p className="text-stone-600">Plot 45, Fashion Street, Industrial Area</p>
                 <p className="text-stone-600">Mumbai, Maharashtra - 400093</p>
                 <p className="text-stone-600 mt-2"><span className="font-bold">GSTIN:</span> 27AABCZ1234H1Z5</p>
                 <p className="text-stone-600"><span className="font-bold">State Code:</span> 27 (Maharashtra)</p>
                 <p className="text-stone-600"><span className="font-bold">Email:</span> support@zerimi.com</p>
              </div>
           </div>
           <div className="w-[48%]">
              <h3 className="font-bold text-stone-900 uppercase text-xs mb-2 bg-stone-100 p-1 pl-2">Billing To (Buyer)</h3>
              <div className="pl-2">
                 <p className="font-bold text-lg">{order.customerName}</p>
                 <p className="text-stone-600">{order.address.street}</p>
                 <p className="text-stone-600">{order.address.city}, {order.address.state}</p>
                 <p className="text-stone-600">PIN: {order.address.pincode}</p>
                 <p className="text-stone-600 mt-2"><span className="font-bold">Phone:</span> {order.address.phone}</p>
                 <p className="text-stone-600"><span className="font-bold">Date:</span> {order.date}</p>
                 <p className="text-stone-600"><span className="font-bold">Invoice No:</span> {order.invoiceNo}</p>
              </div>
           </div>
        </div>

        {/* Item Table */}
        <table className="w-full text-sm mb-8 border border-stone-200">
           <thead className="bg-stone-900 text-white text-xs uppercase">
              <tr>
                 <th className="py-3 px-4 text-left border-r border-stone-700">SN</th>
                 <th className="py-3 px-4 text-left border-r border-stone-700">Description</th>
                 <th className="py-3 px-4 text-center border-r border-stone-700">HSN</th>
                 <th className="py-3 px-4 text-center border-r border-stone-700">Qty</th>
                 <th className="py-3 px-4 text-right border-r border-stone-700">Rate</th>
                 <th className="py-3 px-4 text-right">Amount</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-stone-200 text-stone-700">
              {order.items.map((item, idx) => (
                 <tr key={idx}>
                    <td className="py-3 px-4 text-center border-r border-stone-200">{idx + 1}</td>
                    <td className="py-3 px-4 border-r border-stone-200">
                       <span className="font-bold text-stone-900">{item.name}</span>
                       <br/><span className="text-xs text-stone-500">Premium Finish</span>
                    </td>
                    <td className="py-3 px-4 text-center border-r border-stone-200">{item.hsn}</td>
                    <td className="py-3 px-4 text-center border-r border-stone-200">{item.qty}</td>
                    <td className="py-3 px-4 text-right border-r border-stone-200">₹{item.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold">₹{(item.price * item.qty).toLocaleString()}</td>
                 </tr>
              ))}
           </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
           <div className="w-1/2">
              <div className="flex justify-between py-2 border-b border-stone-100">
                 <span className="text-stone-600">Taxable Amount</span>
                 <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100 text-stone-600 text-xs">
                 <span>CGST @ {gstRate}%</span>
                 <span>₹{cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100 text-stone-600 text-xs">
                 <span>SGST @ {gstRate}%</span>
                 <span>₹{sgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b-2 border-stone-900 text-lg font-bold bg-stone-50 px-2 mt-2">
                 <span>Grand Total</span>
                 <span>₹{order.total.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-right">
                 <p className="text-xs text-stone-500">Amount in Words:</p>
                 <p className="text-sm font-medium italic">Rupees {order.total} Only</p>
              </div>
           </div>
        </div>

        {/* Footer / Terms */}
        <div className="border-t border-stone-200 pt-6 flex justify-between items-end text-xs">
           <div className="w-2/3 text-stone-500">
              <h4 className="font-bold text-stone-900 mb-1">Terms & Conditions:</h4>
              <ol className="list-decimal pl-4 space-y-1">
                 <li>Goods once sold will not be taken back without a valid reason.</li>
                 <li>Any return request must be raised within 7 days.</li>
                 <li>This is a computer-generated invoice and does not require a physical signature.</li>
              </ol>
           </div>
           <div className="text-right">
              <p className="font-bold text-stone-900">For ZERIMI India Pvt Ltd.</p>
              <div className="h-10"></div>
              <p className="text-stone-400">(Authorized Signatory)</p>
           </div>
        </div>

      </div>
    </div>
  );
}