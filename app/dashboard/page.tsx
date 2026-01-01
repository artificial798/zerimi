"use client";
import { useStore, Order } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  Package, User, ShoppingBag, ChevronRight, Heart, 
  FileText, Download, Award, Bell, Key, Camera, Tag, Trash2, 
  Sparkles, RotateCcw, RefreshCcw, Plus, LogOut, X, 
  Home, Briefcase, Save, Edit2, ShieldCheck, Clock,Lock, XCircle
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
export const downloadInvoice = (order: any, settings: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  /* ========================================
     1. CORE DATA LOGIC (NO GUESSING)
  ======================================== */

  // A. Items MRP Total (GST INCLUDED)
  const itemsMrpTotal = order.items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.price) * Number(item.qty),
    0
  );

  // B. Final Paid Amount (SOURCE OF TRUTH)
  const paidAmount = Number(order.total);

  // C. Explicit Checkout Values
  const shippingCost = Number(
    order.shipping ?? order.shippingCost ?? 0
  );
  const discountAmount = Number(
    order.discount ?? order.couponDiscount ?? 0
  );

  // Safety check (logs only)
  const calcTotal =
    itemsMrpTotal + shippingCost - discountAmount;

  if (Math.abs(calcTotal - paidAmount) > 1) {
    console.warn("Invoice mismatch detected", {
      itemsMrpTotal,
      shippingCost,
      discountAmount,
      paidAmount,
    });
  }

  /* ========================================
     2. TAX LOGIC (INFORMATIONAL ONLY)
  ======================================== */

  const taxRate = 3; // Jewellery GST
  const totalBasePrice =
    itemsMrpTotal / (1 + taxRate / 100);
  const totalTaxAmount =
    itemsMrpTotal - totalBasePrice;

  /* ========================================
     3. HEADER
  ======================================== */

  doc.setFontSize(24);
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.text("ZERIMI", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Luxury Jewelry & Accessories", 14, 26);
  doc.text("Mumbai, Maharashtra, 400001", 14, 31);
  doc.text(
    `GSTIN: ${settings?.gstNo || "27ABCDE1234F1Z5"}`,
    14,
    36
  );
  doc.text("Email: support@zerimi.com", 14, 41);
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("TAX INVOICE", pageWidth - 14, 20, {
    align: "right",
  });

  doc.setFontSize(10);
  doc.text(
    `Invoice #: ${order.invoiceNo || "INV-" + order.id.slice(0, 6)}`,
    pageWidth - 14,
    30,
    { align: "right" }
  );
  doc.text(
    `Date: ${new Date(order.date).toLocaleDateString("en-IN")}`,
    pageWidth - 14,
    35,
    { align: "right" }
  );
  doc.text(
    `Order ID: #${order.id}`,
    pageWidth - 14,
    40,
    { align: "right" }
  );

  doc.line(14, 48, pageWidth - 14, 48);

  /* ========================================
     4. BILL TO
  ======================================== */

  const billingY = 55;
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, billingY);

  doc.setFont("helvetica", "normal");
  const custName =
    order.name || order.customerName || "Customer";
  doc.text(custName, 14, billingY + 5);

  const address =
    typeof order.address === "string"
      ? order.address
      : `${order.address?.street || ""}, ${order.address?.city || ""} - ${
          order.address?.pincode || ""
        }`;

  doc.text(
    doc.splitTextToSize(address, 80),
    14,
    billingY + 10
  );

  /* ========================================
     5. ITEMS TABLE
  ======================================== */

  const tableRows = order.items.map(
    (item: any, index: number) => {
      const mrp = Number(item.price);
      const qty = Number(item.qty);
      const totalMrp = mrp * qty;

      const basePrice = mrp / (1 + taxRate / 100);
      const taxAmt = totalMrp - basePrice * qty;

      return [
        index + 1,
        item.name,
        qty,
        `Rs.${basePrice.toFixed(2)}`,
        `Rs.${taxAmt.toFixed(2)}`,
        `Rs.${totalMrp.toFixed(2)}`,
      ];
    }
  );

  autoTable(doc, {
    startY: billingY + 35,
    head: [
      ["Sn", "Item Description", "Qty", "Taxable Val", "GST Amt", "Total (MRP)"],
    ],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [15, 41, 37],
      textColor: 255,
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right", fontStyle: "bold" },
    },
  });

  /* ========================================
     6. TOTALS (CHECKOUT MATCHED)
  ======================================== */

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const rightX = pageWidth - 14;

  doc.setFontSize(10);
  doc.text("Subtotal (MRP):", rightX - 60, finalY);
  doc.text(`Rs.${itemsMrpTotal.toLocaleString()}`, rightX, finalY, {
    align: "right",
  });

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `(Includes GST @3%: Rs.${totalTaxAmount.toFixed(2)})`,
    rightX,
    finalY + 5,
    { align: "right" }
  );

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("Shipping Charges:", rightX - 60, finalY + 12);
  doc.text(
    shippingCost === 0 ? "Free" : `Rs.${shippingCost.toFixed(2)}`,
    rightX,
    finalY + 12,
    { align: "right" }
  );

  let currentY = finalY + 18;

  if (discountAmount > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("Coupon Discount:", rightX - 60, currentY);
    doc.text(
      `- Rs.${discountAmount.toLocaleString()}`,
      rightX,
      currentY,
      { align: "right" }
    );
    currentY += 6;
  }

  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text("NET PAYABLE", rightX, currentY + 5, {
    align: "right",
  });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 140, 0);
  doc.text(
    `Rs.${paidAmount.toLocaleString()}`,
    rightX,
    currentY + 12,
    { align: "right" }
  );
  doc.text("Grand Total", rightX - 60, currentY + 12);

  /* ========================================
     7. FOOTER
  ======================================== */

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Amount in Words: ${numberToWords(paidAmount)}`,
    14,
    currentY + 12
  );

  doc.rect(14, currentY + 20, pageWidth - 28, 20);
  doc.setFontSize(8);
  doc.text("Declaration:", 16, currentY + 25);
  doc.text(
    "We declare that this invoice shows the actual price of the goods described above.",
    16,
    currentY + 30
  );

  doc.setFont("helvetica", "bold");
  doc.text("For ZERIMI", pageWidth - 40, currentY + 35, {
    align: "center",
  });
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
// --- MAIN COMPONENT ---
export default function CustomerDashboard() {
  const { currentUser, orders, logout, coupons, notifications, wishlist, updateOrderStatus, sendNotification, systemSettings } = useStore();
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
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [vaultItems, setVaultItems] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (!currentUser) router.push('/login');
  }, [currentUser, router]);

  // Click Outside to Close Notification
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser && orders) {
        const userEmail = currentUser.email.toLowerCase();
        const delivered = orders.filter(o => o.customerEmail?.toLowerCase() === userEmail && o.status === 'Delivered');
        const certificates = delivered.flatMap(order => 
            order.items.map(item => ({ ...item, orderId: order.id, purchaseDate: order.date, certificateId: `ZER-${order.id.slice(-4)}-${Math.floor(Math.random() * 1000)}` }))
        );
        setVaultItems(certificates);
    }
  }, [orders, currentUser]);

  if (!isMounted || !currentUser) return null;

  const userEmail = currentUser.email.toLowerCase();
  const myNotifications = notifications.filter(n => n.userId.toLowerCase() === userEmail);
  const myOrders = orders.filter((o: Order) => o.customerEmail?.toLowerCase() === userEmail);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const handleReturnRequest = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !isOrderReturnable(order.date)) return alert("Return window (3 days) has expired.");
    if(confirm("Submit Return Request?")) {
        updateOrderStatus(orderId, 'Return Requested');
        sendNotification('admin@zerimi.com', 'Return Request', `User ${currentUser.name} requested return for Order #${orderId}`);
        alert("Return request submitted.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1c] pt-28 pb-12 font-sans text-white flex flex-col md:flex-row relative">
      
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
             onClick={() => setShowNotifPopup(!showNotifPopup)}
             className={`w-full flex items-center gap-4 p-4 rounded-xl text-sm transition-all duration-300 group ${showNotifPopup ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
           >
              <span className="text-amber-500/80"><Bell className="w-5 h-5"/></span>
              <span className="tracking-wide flex-1 text-left">Notifications</span>
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
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
               {activeTab === 'orders' && <OrdersTab orders={myOrders} onReturn={handleReturnRequest} />}
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
      {showNotifPopup && (
        <div 
            ref={notifRef} 
            className="fixed top-24 left-4 md:left-80 z-[100] w-80 bg-[#0f2925] border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-left-5 duration-300 backdrop-blur-md"
            style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
        >
            <div className="p-4 bg-[#051614] border-b border-white/5 text-white flex justify-between items-center rounded-t-2xl flex-shrink-0">
                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400"/> Notifications</span>
                <button onClick={() => setShowNotifPopup(false)}><X className="w-4 h-4 text-white/50 hover:text-white"/></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-2 flex-1">
                {myNotifications.length === 0 ? (
                    <div className="p-8 text-center text-white/30 text-xs flex flex-col items-center">
                        <Bell className="w-8 h-8 mb-2 opacity-20"/>
                        No new notifications.
                    </div>
                ) : (
                    myNotifications.map((n: any, idx: number) => (
                        <div key={n.id || idx} className="p-3 mb-2 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition cursor-default">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-white text-xs">{n.title}</span>
                                <span className="text-[9px] text-white/40 flex items-center gap-1"><Clock className="w-3 h-3"/> {n.date}</span>
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed">{n.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}

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
                try {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("role", "in", ["admin", "manager"]));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        const staffMember = doc.data();
                        if (staffMember.email) sendNotification(staffMember.email, 'Order Cancelled Alert', `URGENT: Order #${orderId} has been cancelled by customer ${currentUser?.name || ''}.`);
                    });
                } catch (err) { console.error("Error fetching staff emails:", err); }
            }
            toast.success("Order cancelled successfully");
            router.refresh();
        } catch (error) { console.error(error); toast.error("Failed to cancel order"); } finally { setLoadingId(null); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="font-serif text-2xl text-white">Order History</h2>
                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-white/60">{orders.length} Orders</span>
            </div>
            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                    <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" /><p className="text-white/50 mb-6 font-serif text-lg">Your collection awaits.</p>
                    <Link href="/" className="bg-amber-600 text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-amber-700 transition rounded-lg shadow-lg">Browse Collection</Link>
                </div>
            ) : orders.map((order: Order) => {
                const isCancellable = ['Placed', 'Processing', 'Confirmed'].includes(order.status) && !(order as any).shiprocketOrderId && !(order as any).awb && !(order as any).shipmentId;
                return (
                    <div key={order.id} className="bg-[#0f2925] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-amber-500/20 transition duration-300">
                        <div className="bg-black/20 p-6 border-b border-white/5 flex flex-wrap gap-6 justify-between items-center">
                            <div className="flex gap-8">
                                <div><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Order Placed</p><p className="text-sm font-bold text-white">{order.date}</p></div>
                                <div><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Amount</p><p className="text-sm font-bold text-amber-500">₹{order.total.toLocaleString()}</p></div>
                                <div><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Order ID</p><p className="text-sm font-mono text-white/60">#{order.id}</p></div>
                            </div>

                            {/* 👇 UPDATED: Invoice Logic yahan hai */}
                            {order.status === 'Delivered' ? (
                                <button
                                    onClick={() => downloadInvoice({ ...order, name: (order as any).name || (order as any).customerName || currentUser?.name || "Valued Customer" }, settings)}
                                    className="flex items-center gap-2 text-xs font-bold text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg hover:bg-amber-500/10 transition"
                                >
                                    <FileText className="w-4 h-4" /> Invoice
                                </button>
                            ) : (
                                <span className="text-[10px] text-white/30 italic flex items-center gap-1 border border-white/5 px-3 py-2 rounded-lg">
                                    <Lock className="w-3 h-3" /> Invoice Locked (Wait for Delivery)
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-6 items-center py-4 border-b border-white/5 last:border-0">
                                    <div className="w-20 h-20 bg-black/30 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                        {item.image && <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-serif text-lg text-white">{item.name}</h4>
                                        <p className="text-xs text-white/50 mt-1">Qty: {item.qty} &bull; Price: ₹{item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-black/40 text-white p-4 px-6 flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${order.status === 'Delivered' ? 'bg-green-500' : order.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500'} animate-pulse`}></div><span className="text-xs uppercase tracking-widest font-bold">Status: {order.status}</span></div>
                            <div className="flex gap-2">
                                {isCancellable && (
                                    <button onClick={() => handleCancelOrder(order.id)} disabled={loadingId === order.id} className="flex items-center gap-2 text-xs font-bold uppercase bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition px-4 py-2 rounded-lg border border-red-500/20">{loadingId === order.id ? 'Processing...' : <><XCircle className="w-4 h-4" /> Cancel</>}</button>
                                )}
                                {order.status === 'Delivered' && (
                                    <button onClick={() => onReturn(order.id)} disabled={!isOrderReturnable(order.date)} className={`text-[10px] px-4 py-2 rounded uppercase tracking-wide transition flex items-center gap-2 ${isOrderReturnable(order.date) ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}>
                                        <RotateCcw className="w-3 h-3" /> {isOrderReturnable(order.date) ? 'Return Item' : 'Return Period Expired'}
                                    </button>
                                )}
                                <button onClick={() => router.push(`/track-order?orderId=${order.id}`)} className="flex items-center gap-2 text-xs font-bold uppercase bg-white text-[#0a1f1c] hover:bg-stone-200 transition px-6 py-2 rounded-lg">Track</button>
                            </div>
                        </div>
                    </div>
                );
            })}
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
   const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
   
   const defaultAddress = { id: 1, type: 'Home', text: 'No Address Saved', pin: '', isDefault: true };
   const [addresses, setAddresses] = useState(user?.addresses || [defaultAddress]);
   
   const [showAddAddress, setShowAddAddress] = useState(false);
   const [newAddress, setNewAddress] = useState({ type: 'Home', text: '', pin: '' });
   const fileInputRef = useRef<HTMLInputElement>(null);
   
   // ✅ Fetch User Data
   useEffect(() => {
       const fetchUserData = async () => {
           if (user?.id) {
               try {
                   const docRef = doc(db, "users", user.id);
                   const docSnap = await getDoc(docRef);
                   if (docSnap.exists()) {
                       const data = docSnap.data();
                       setFormData({
                           name: data.name || '',
                           email: data.email || '',
                           phone: data.mobile || data.phone || '' 
                       });
                       if (data.addresses && data.addresses.length > 0) {
                           setAddresses(data.addresses);
                       }
                       if (data.profileImage) setProfileImage(data.profileImage);
                   }
               } catch (e) { console.error("Fetch error", e); }
           }
       };
       fetchUserData();
   }, [user, setProfileImage]);

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
       const file = e.target.files?.[0]; 
       if (file) { 
           const reader = new FileReader(); 
           reader.onloadend = () => setProfileImage(reader.result as string); 
           reader.readAsDataURL(file); 
       } 
   };

   // ✅ Updated: Uses Toast instead of Alert
   const handleSaveProfile = async () => { 
       if (!user || !user.id) return toast.error("User ID missing. Login again.");
       setIsSaving(true);
       try {
           await updateUserProfile(user.id, {
               name: formData.name,
               phone: formData.phone,
               profileImage: profileImage || "", 
               addresses: addresses 
           });
           setIsEditing(false); 
           toast.success("Profile Updated Successfully!"); // ✨ Fancy Toast
       } catch (error) { 
           console.error(error); 
           toast.error("Failed to update profile."); // 🔴 Error Toast
       } finally { 
           setIsSaving(false); 
       }
   };

   const handleAddAddress = async () => { 
       if(!newAddress.text) return toast.error("Address is required");
       const updatedList = [...addresses, { ...newAddress, id: Date.now(), isDefault: false }];
       setAddresses(updatedList); 
       if (user?.id) await updateUserProfile(user.id, { addresses: updatedList }); 
       setShowAddAddress(false); 
       setNewAddress({ type: 'Home', text: '', pin: '' }); 
       toast.success("New Address Added");
   };

   const removeAddress = async (id: number) => { 
       const updatedList = addresses.filter((a: any) => a.id !== id);
       setAddresses(updatedList);
       if (user?.id) await updateUserProfile(user.id, { addresses: updatedList });
       toast.success("Address Removed");
   };

   return (
      <div className="max-w-4xl space-y-6 animate-fade-in">
         {/* ✅ Toaster Component Added Here */}
         <Toaster position="top-center" toastOptions={{ style: { background: '#0f2925', color: '#fff', border: '1px solid #d4af37' } }} />

         <div className="flex justify-between items-center mb-8">
            <h2 className="font-serif text-2xl text-white">Personal Profile</h2>
            {!isEditing ? (
               <button onClick={() => setIsEditing(true)} className="text-amber-500 text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3"/> Edit Details</button>
            ) : (
               <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 rounded-lg text-white/50 text-xs font-bold hover:bg-white/10">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 flex items-center gap-2">{isSaving ? "Saving..." : <><Save className="w-3 h-3"/> Save Changes</>}</button>
               </div>
            )}
         </div>
         <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col items-center">
               <div className="relative w-32 h-32 rounded-full border-4 border-[#0f2925] shadow-xl overflow-hidden group cursor-pointer bg-black/20" onClick={() => isEditing && fileInputRef.current?.click()}>
                  {profileImage ? <Image src={profileImage} alt="Profile" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-white/20 font-serif">{user?.name?.charAt(0) || 'U'}</div>}
                  {isEditing && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Camera className="w-8 h-8 text-white" /></div>)}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={!isEditing} />
               </div>
               {isEditing && <p className="text-xs text-white/40 mt-2">Tap to change</p>}
            </div>
            <div className="flex-1 space-y-6 w-full">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-xs font-bold text-white/40 uppercase mb-2 block">Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full p-4 bg-black/20 border ${isEditing ? 'border-amber-500/50' : 'border-white/10'} rounded-xl outline-none text-white transition`} readOnly={!isEditing} /></div>
                  <div><label className="text-xs font-bold text-white/40 uppercase mb-2 block">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91..." className={`w-full p-4 bg-black/20 border ${isEditing ? 'border-amber-500/50' : 'border-white/10'} rounded-xl outline-none text-white transition`} readOnly={!isEditing} /></div>
               </div>
               <div><label className="text-xs font-bold text-white/40 uppercase mb-2 block">Email Address</label><input type="text" value={formData.email} className="w-full p-4 bg-white/5 border border-white/5 rounded-xl outline-none text-white/50 cursor-not-allowed" readOnly /></div>
               <div className="pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-serif text-lg text-white">Saved Addresses</h3><button onClick={() => setShowAddAddress(true)} className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:bg-white/5 px-3 py-1.5 rounded-lg transition"><Plus className="w-3 h-3"/> Add New</button></div>
                  <div className="space-y-4">
                     {addresses.map((addr: any, idx: number) => (
                        <div key={addr.id || idx} className="p-5 bg-white/5 border border-white/5 rounded-xl flex justify-between items-start group hover:border-amber-500/30 transition">
                           <div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 w-fit mb-2 ${addr.type === 'Home' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                 {addr.type === 'Home' ? <Home className="w-3 h-3"/> : <Briefcase className="w-3 h-3"/>} {addr.type || 'Home'}
                              </span>
                              <p className="text-sm text-white/80 leading-relaxed">{addr.text || (addr.street ? `${addr.street}, ${addr.city}` : 'Unknown Address')}</p>
                              <p className="text-xs text-white/40 mt-1">Pin: {addr.pin || addr.pincode}</p>
                           </div>
                           <button onClick={() => removeAddress(addr.id)} className="text-white/20 hover:text-red-400 p-2"><Trash2 className="w-4 h-4"/></button>
                        </div>
                     ))}
                  </div>
                  {showAddAddress && (<div className="mt-4 p-5 bg-[#0f2925] rounded-xl border border-white/10 animate-in fade-in zoom-in-95 duration-200"><h4 className="text-sm font-bold text-white mb-3">Add New Address</h4><div className="space-y-3"><div className="flex gap-4"><select className="p-3 bg-black/40 border border-white/10 text-white rounded-lg text-sm outline-none" value={newAddress.type} onChange={(e) => setNewAddress({...newAddress, type: e.target.value})}><option>Home</option><option>Office</option><option>Other</option></select><input className="flex-1 p-3 bg-black/40 border border-white/10 text-white rounded-lg text-sm outline-none" placeholder="Pincode" value={newAddress.pin} onChange={(e) => setNewAddress({...newAddress, pin: e.target.value})} /></div><textarea className="w-full p-3 bg-black/40 border border-white/10 text-white rounded-lg text-sm h-20 resize-none outline-none" placeholder="Full Address..." value={newAddress.text} onChange={(e) => setNewAddress({...newAddress, text: e.target.value})} /><div className="flex gap-2 justify-end"><button onClick={() => setShowAddAddress(false)} className="px-4 py-2 text-white/50 text-xs font-bold hover:bg-white/10 rounded-lg">Cancel</button><button onClick={handleAddAddress} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700">Save Address</button></div></div></div>)}
               </div>
            </div>
         </div>
      </div>
   );
}