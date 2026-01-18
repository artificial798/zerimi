"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, Truck, ArrowRight, MapPin,
    Ticket, Check, AlertCircle, ShoppingBag, Lock, ChevronLeft, Loader2, X, Trash2, Gift, CreditCard, Crown, Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
// --- RAZORPAY LOADER ---
const initializeRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
// --- CUSTOM TOAST COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-md border ${type === 'success'
            ? 'bg-[#0a1f1c]/90 text-white border-green-500/30'
            : 'bg-red-950/90 text-red-100 border-red-500/30'
            }`}
    >
        <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button onClick={onClose}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
    </motion.div>
);

// --- GOVT. STANDARD GST CALCULATOR (Inclusive Method) ---
const calculateInclusiveGST = (amount: number, rate: number) => {
    const basePrice = amount / (1 + rate / 100);
    const totalTax = amount - basePrice;
    
    return {
        basePrice: basePrice,
        totalTax: totalTax,
        cgst: totalTax / 2,
        sgst: totalTax / 2
    };
};

export default function CheckoutPage() {
    const router = useRouter();
    const store = useStore() as any;

    const [isGift, setIsGift] = useState(false);
const [giftMessage, setGiftMessage] = useState('');



    // ✅ FIX 1: Real Order ID Store karne ke liye State
    const [confirmedOrderId, setConfirmedOrderId] = useState<string>("");
    const [successDetails, setSuccessDetails] = useState<any>(null);

    const {
        cart,
        currentUser,
        placeOrder,
        clearCart,
        systemSettings,
        removeFromCart,
        addToCart,
        updateQuantity,
       // 👇 NEW: LOYALTY & COUPON FROM STORE
        pointsDiscount,
        pointsRedeemed,
        redeemLoyaltyPoints,
        removeLoyaltyPoints,
        
        // 👇 NEW: Store wale Coupon Variables
        appliedCoupon,      // Global Coupon
       couponDiscount: discountAmount, // 👈 MAGIC FIX: Aliasing
        applyCoupon,        // Global Function
        removeCoupon,       // Global Function
        coupons             // List of coupons
    } = store;
// ✨ NEW: AUTO-DETECT GIFT FROM CART
useEffect(() => {
    if (cart.length > 0) {
        // Check agar cart ke kisi bhi item me 'isGift' true hai
        const hasGiftItem = cart.some((item: any) => item.isGift === true);
        if (hasGiftItem) {
            setIsGift(true); // Auto Turn ON
        }
    }
}, [cart]);
    // --- STATE ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
   

    // Settings Fetch
    const [liveSettings, setLiveSettings] = useState<any>(null);

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        saveInfo: true
    });

    const [paymentMethod, setPaymentMethod] = useState('cod'); // Default COD set kiya hai safe side ke liye

    // --- CALCULATIONS ---
// --- 🟢 NEW CALCULATION LOGIC (Matches Admin Invoice) ---
    
    // 1. Settings & Rates
    const taxRate = Number(systemSettings?.taxRate) || 3; // Default 3%
    const divisor = 1 + (taxRate / 100); // 1.03
    
    // 2. Calculate Inclusive Subtotal (MRP Sum displayed to User)
    const cartInclusiveTotal = cart.reduce(
        (sum: number, item: any) => sum + item.product.price * item.qty,
        0
    );

    // 3. Gift Cost (Inclusive)
    const giftModeCost = Number(systemSettings?.giftModeCost) || 50;
    const currentGiftInclusive = isGift ? giftModeCost : 0;

    // 4. Calculate Base (Taxable) Values [REVERSE CALCULATION]
    // Admin Logic: taxable = inc / 1.03
    const cartBasePrice = cartInclusiveTotal / divisor;
    const giftBasePrice = currentGiftInclusive / divisor;

    const totalBasePrice = cartBasePrice + giftBasePrice;

    // 5. Discount Logic
    // Admin Logic: netTaxable = totalTaxable - discount
    // Note: Discount Base Price me se minus hoga
   // 5. Discount Logic (Coupon + Loyalty Points)
    // Points discount bhi Base Price se minus hoga
    const netTaxable = Math.max(0, totalBasePrice - discountAmount - (pointsDiscount || 0));
    // Loyalty Display Helpers
    const pointRate = Number(systemSettings?.pointValue) || 1;
    // Calculate Max Redeemable Points (Total order value se zyada na ho)
    const maxRedeemable = Math.min(
        currentUser?.points || 0, 
        Math.floor(cartInclusiveTotal / pointRate)
    );

    // 6. Tax Calculation (On Net Base)
    // Admin Logic: finalGST = netTaxable * 0.03
    const totalGST = netTaxable * (taxRate / 100);

    // 7. Shipping
    const shippingThreshold = Number(systemSettings?.shippingThreshold) || 5000;
    const baseShipping = Number(systemSettings?.shippingCost) || 150;
    const shipping = cartInclusiveTotal >= shippingThreshold ? 0 : baseShipping;

    // 8. Final Total (Payable)
    // Admin Logic: grandTotal = netTaxable + finalGST + shipping
    const total = netTaxable + totalGST + shipping;

    // 9. Breakdown for UI
    const gstBreakdown = {
        basePrice: netTaxable,
        cgst: totalGST / 2,
        sgst: totalGST / 2,
        totalInclusive: cartInclusiveTotal + currentGiftInclusive
    };
const subtotal = cartInclusiveTotal;
    const currentGiftCost = currentGiftInclusive;
    const taxableBeforeDiscount = subtotal + currentGiftCost;
    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // --- ✅ FIX 2: AUTO FILL & SECRET GIFT LOGIC ---
    useEffect(() => {
        // Agar Secret Gift ON hai, toh fields CLEAR karo
        if (isGift) {
            setFormData(prev => ({
                ...prev,
                firstName: '',
                lastName: '',
                phone: '',     
                address: '',   
                city: '',
                state: '',
                pincode: '',
                // Email ko hum retain kar rahe hain taaki Bill aapko aaye
                email: currentUser?.email || prev.email 
            }));
        } 
        // Agar Secret Gift OFF hai, toh Auto-Fill karo (Agar user logged in hai)
        else if (currentUser) {
            let savedAddr = { text: '', pin: '', type: '' };
            if (currentUser.addresses && currentUser.addresses.length > 0) {
                savedAddr = currentUser.addresses.find((a: any) => a.isDefault) || currentUser.addresses[0];
            }

            setFormData(prev => ({
                ...prev,
                email: currentUser.email || '',
                firstName: currentUser.name?.split(' ')[0] || '',
                lastName: currentUser.name?.split(' ')[1] || '',
                phone: currentUser.phone || '',
                address: savedAddr.text ? savedAddr.text.split(',')[0] : '',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: savedAddr.pin || ''
            }));
        }
    }, [currentUser, isGift]); // 👈 isGift dependency add ki taaki toggle par chal sake

    // Razorpay Script (Existing)
    useEffect(() => {
        if (!(window as any).Razorpay) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    // Initial User Fetch (Backup for Refresh)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !isGift) { // Sirf tab fetch karo agar Gift Mode OFF hai
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const savedAddress = userData.addresses && userData.addresses.length > 0
                            ? userData.addresses[0]
                            : null;

                        setFormData(prev => ({
                            ...prev,
                            email: userData.email || user.email || '',
                            firstName: userData.name?.split(' ')[0] || '',
                            lastName: userData.name?.split(' ')[1] || '',
                            phone: userData.mobile || userData.phone || '',
                            address: savedAddress?.text || savedAddress?.street || '',
                            city: savedAddress?.city || '',
                            pincode: savedAddress?.pin || savedAddress?.pincode || '',
                            state: savedAddress?.state || 'India'
                        }));
                    }
                } catch (err) {
                    console.error("User fetch error:", err);
                }
            }
        });
        return () => unsubscribe();
    }, [isGift]); // dependency added

    // --- EFFECTS ---
    useEffect(() => {
        if (cart.length === 0 && step !== 3) {
            const timer = setTimeout(() => router.push('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [cart, router, step]);

  const handleQuantityChange = (item: any, change: number) => {
        // 1. Agar quantity 1 hai aur user kam kar raha hai, toh delete confirm karo
        if (item.qty === 1 && change === -1) {
            if (confirm("Remove this item from cart?")) {
                // Remove function ko bhi size/color pass karna zaroori hai
                removeFromCart(item.product.id, item.selectedSize, item.selectedColor);
            }
            return;
        }
        
        // 2. ✅ FIX: Use 'updateQuantity' instead of 'addToCart'
        // Ye function drawer open nahi karega, bas number update karega
        updateQuantity(item.product.id, change, item.selectedSize, item.selectedColor);
    };

    // --- COUPON HANDLERS ---
    const availableCoupons = coupons.filter((c: any) => {
        if (!c.allowedEmail) return true;
        if (currentUser?.email && c.allowedEmail.toLowerCase() === currentUser.email.toLowerCase()) {
            return true;
        }
        return false;
    });

  // ✅ NAYA LOGIC (Connected to Store)
    const handleApplyCoupon = () => {
        if (!couponCode) return showToast("Please enter a code", "error");
        
        // Store ka function call karein
        const result = applyCoupon(couponCode);
        
        if (result.success) {
            showToast(result.message, "success");
        } else {
            showToast(result.message, "error");
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon(); // Store reset karega
        setCouponCode('');
        showToast("Coupon Removed", "success");
    };


const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        
        setFormData(prev => ({ ...prev, pincode: code }));

        if (code.length === 6) {
            setLoading(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
                const data = await res.json();

                if (data[0].Status === "Success") {
                    const details = data[0].PostOffice[0];
                    setFormData(prev => ({
                        ...prev,
                        city: details.District, 
                        state: details.State, 
                        pincode: code
                    }));
                    setToast({ msg: "Location Detected! 📍", type: 'success' });
                    setTimeout(() => setToast(null), 3000);
                } else {
                    setToast({ msg: "Invalid Pincode", type: 'error' });
                    setTimeout(() => setToast(null), 3000);
                }
            } catch (err) {
                console.error("Pincode Error:", err);
            } finally {
                setLoading(false);
            }
        }
    };
    
    // --- ✅ NEW: EMAIL SENDING FUNCTION ---
const sendOrderConfirmationEmail = async (details: any, orderId: string) => {
    try {
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: details.email,
                name: details.name,
                orderId: orderId,
                amount: Math.round(details.total)
            }),
        });

        // ✅ AB SACH PATA CHALEGA:
        // Hum check kar rahe hain ki kya server ne 'OK' (200) bola ya Error (500)
        if (!res.ok) {
            const errorData = await res.json(); // Server se pucho kya hua
            throw new Error(errorData.error || "Email failed to send"); // Error phenko
        }

        console.log("Confirmation email sent successfully");

    } catch (error) {
        // Ab ye asli error pakdega
        console.error("Failed to send email:", error);
    }
};
  // --- ✅ CORRECT HANDLE PLACE ORDER FUNCTION ---
    const handlePlaceOrder = async () => {
        const finalEmail = formData.email?.trim().toLowerCase() || currentUser?.email?.trim().toLowerCase();
        
        // 1. Validation
        if (!finalEmail || !formData.firstName || !formData.address || !formData.pincode || !formData.phone) {
            showToast("Please fill all delivery details.", 'error');
            setStep(1);
            return;
        }

        setLoading(true);

        try {
            // ==========================================
            // OPTION A: ONLINE PAYMENT (RAZORPAY)
            // ==========================================
            if (paymentMethod === 'online') {
                
                // 1. Script Load Check
                const res = await initializeRazorpay();
                if (!res) {
                    showToast("Razorpay SDK failed to load. Check internet.", 'error');
                    setLoading(false);
                    return;
                }

                // 2. Base Order Details (Common for both)
             // Inside handlePlaceOrder function...

// ✅ Calculate Total Discount (Coupon + Points)
const totalDiscount = discountAmount + (pointsDiscount || 0);

const baseOrderDetails = {
    name: `${formData.firstName} ${formData.lastName}`,
    email: finalEmail,
    address: {
        // ... address fields ...
    },
    isGift, 
    giftMessage: giftMessage || "", 
    giftWrapPrice: currentGiftCost,
    date: new Date().toLocaleDateString('en-IN'),
    
    total,
    subtotal: taxableBeforeDiscount,
    shipping,
    
    // ✅ FIX: Ab Coupon aur Points dono ka discount database mein jayega
   discount: discountAmount + (pointsDiscount || 0),
    
    tax: totalGST,

    items: cart.map((item: any) => ({
        // ... items mapping ...
    }))
};

                // 3. Razorpay Options
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                    amount: Math.round(total * 100), // Paise mein convert
                    currency: "INR",
                    name: "ZERIMI Luxury",
                    description: "Order Payment",
                    prefill: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: finalEmail,
                        contact: formData.phone,
                    },
                    theme: { color: "#d4af37" },
                    
                    // 4. Payment Success Handler
        // 4. Payment Success Handler
                    handler: async function (response: any) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        const finalOrder = { 
                            ...baseOrderDetails, 
                            status: 'Processing',
                            paymentMethod: 'Online',
                            paymentId: response.razorpay_payment_id 
                        };

                        // Order Save Karein
                        const newOrderId = await placeOrder(finalOrder);
                        
                        // --- ✅ 1. EMAIL TRIGGER (Ye line add ki gayi hai) ---
                        if (newOrderId) {
                            await sendOrderConfirmationEmail(finalOrder, newOrderId);
                        }
                        // -----------------------------------------------------

                        setConfirmedOrderId(newOrderId || "ZER-PAID");
                        setSuccessDetails(finalOrder);
                        
                        if (typeof clearCart === 'function') clearCart();
                          setStep(3); // Success Screen
                        setLoading(false);
                      
                    },
                    modal: {
                        ondismiss: function() {
                            setLoading(false);
                            showToast("Payment Cancelled", 'error');
                        }
                    }
                };
                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
                return; 
            } 
            
            // ==========================================
            // OPTION B: CASH ON DELIVERY (COD)
            // ==========================================
          else if (paymentMethod === 'cod') {
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const orderDetails = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: finalEmail,
        address: {
            id: `addr_${Date.now()}`,
            street: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            phone: formData.phone,
        },
        isGift, 
        giftMessage: giftMessage || "", 
        giftWrapPrice: currentGiftCost,
        status: 'Pending',
        paymentMethod: 'COD',
        date: new Date().toLocaleDateString('en-IN'),
        
        // Financials
        total, 
        subtotal, 
        shipping, 
        // ✅ FIX: Coupon + Loyalty Points dono ka total discount database mein jaye
        discount: discountAmount + (pointsDiscount || 0), 
        tax: totalGST,

        items: cart.map((item: any) => ({
            name: item.product.name, 
            qty: item.qty, 
            price: item.product.price,
            image: item.product.image, 
            selectedSize: item.selectedSize || null, 
            selectedColor: item.selectedColor || null
        }))
    };

    // 1. Database mein Order Place karein
    const newOrderId = await placeOrder(orderDetails);
    
    // ✅ 2. EMAIL TRIGGER (Ye line naye order confirmation email ke liye hai)
    if (newOrderId) {
        await sendOrderConfirmationEmail(orderDetails, newOrderId);
    }
    
    // 3. UI Update karein
    setConfirmedOrderId(newOrderId || "ZER-PENDING");
    setSuccessDetails(orderDetails);

    if (typeof clearCart === 'function') clearCart();
   setStep(3); // Success Screen Redirect 
    setLoading(false);
    
    return;
}

        } catch (error: any) {
            console.error("Order Error:", error);
            showToast(error.message || "Order Failed", 'error');
            setLoading(false);
        }
    };

   // ✅ FIX: Agar loading ho rahi hai, toh Empty Cart page MAT dikhao
if (cart.length === 0 && step !== 3 && !loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 font-sans">
            <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <ShoppingBag className="w-10 h-10 text-stone-400" />
            </div>
            <h2 className="text-2xl font-serif text-[#0a1f1c] mb-2">Your cart is empty</h2>
            <p className="text-stone-500 text-sm mb-8">Looks like you haven't added any luxury items yet.</p>
            <Link href="/" className="px-8 py-3 bg-[#0a1f1c] text-white rounded-lg text-xs uppercase font-bold tracking-widest hover:bg-amber-700 transition">
                Start Shopping
            </Link>
        </div>
    );
}

    // --- ✅ STEP 3: PREMIUM SUCCESS SCREEN ---
    if (step === 3) {
        return (
            <div className="min-h-screen bg-[#0a1f1c] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Background Pattern & Glow */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="bg-[#fcfbf9] rounded-[2rem] max-w-3xl w-full relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
                >
                    {/* LEFT PANEL: Brand & Success Animation */}
                    <div className="bg-[#0f2925] p-8 md:w-5/12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                        
                        <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-8 relative z-10"
                        >
                            <Check className="w-12 h-12 text-[#0f2925] stroke-[3]" />
                        </motion.div>
                        
                        <h2 className="text-3xl font-serif text-white mb-3 relative z-10">Order Confirmed</h2>
                        <p className="text-amber-100/70 text-sm leading-relaxed relative z-10 px-4">
                            Thank you, <span className="text-white font-semibold">{successDetails?.name?.split(' ')[0]}</span>.<br/>
                            Your luxury experience has begun. We have sent a receipt to your email.
                        </p>
                    </div>

                    {/* RIGHT PANEL: Receipt Details */}
                    <div className="p-8 md:w-7/12 bg-white flex flex-col justify-between">
                        <div>
                            {/* Header: ID & Date */}
                            <div className="flex justify-between items-start border-b border-stone-100 pb-6 mb-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Order Number</p>
                                    <p className="text-lg font-mono font-bold text-[#0a1f1c] tracking-tight">#{confirmedOrderId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Date</p>
                                    <p className="text-sm font-medium text-[#0a1f1c]">
                                        {successDetails?.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">Payment Method</p>
                                    <div className="flex items-center gap-2 bg-stone-50 w-fit px-3 py-1.5 rounded-lg border border-stone-100">
                                        {successDetails?.paymentMethod === 'COD' 
                                            ? <Truck className="w-3.5 h-3.5 text-amber-600" /> 
                                            : <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                                        }
                                        <span className="text-xs font-bold text-[#0a1f1c]">
                                            {successDetails?.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">Delivery Estimate</p>
                                    <p className="text-xs font-bold text-green-700 bg-green-50 w-fit px-3 py-1.5 rounded-lg border border-green-100">
                                        3-5 Business Days
                                    </p>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">Shipping To</p>
                                    <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50/50">
                                        <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-[#0a1f1c] mb-0.5">{successDetails?.name}</p>
                                            <p className="text-xs text-stone-500 leading-relaxed">
                                                {successDetails?.address?.street}, {successDetails?.address?.city}, {successDetails?.address?.state} - <span className="font-semibold text-[#0a1f1c]">{successDetails?.address?.pincode}</span>
                                            </p>
                                            <p className="text-[10px] text-stone-400 mt-1">Contact: {successDetails?.address?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Amount & Buttons */}
                        <div>
                            <div className="bg-[#0a1f1c] rounded-xl p-5 flex justify-between items-center shadow-lg mb-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div>
                                    <p className="text-[10px] text-white/50 mb-0.5 uppercase tracking-wider">Total Amount</p>
                                    <p className="text-xs text-amber-500 font-medium">
                                        {successDetails?.items?.length} Items Included
                                    </p>
                                </div>
                                <p className="text-2xl font-serif text-white tracking-wide relative z-10">
                                    ₹{successDetails?.total?.toLocaleString()}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => router.push('/dashboard')} 
                                    className="flex-1 py-3.5 bg-white border-2 border-[#0a1f1c] text-[#0a1f1c] text-[11px] uppercase font-bold tracking-widest rounded-xl hover:bg-[#0a1f1c] hover:text-white transition duration-300"
                                >
                                    Track Order
                                </button>
                                <button 
                                    onClick={() => router.push('/')} 
                                    className="flex-1 py-3.5 bg-amber-600 border-2 border-amber-600 text-white text-[11px] uppercase font-bold tracking-widest rounded-xl hover:bg-amber-700 hover:border-amber-700 transition duration-300 shadow-md"
                                >
                                    Shop More
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#f8f5f2] font-sans text-stone-900 pt-28 pb-20">
            <AnimatePresence>
                {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* LEFT COLUMN: FORMS */}
                <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-stone-400 mb-2">
                        <Link href="/cart" className="hover:text-amber-600 transition">Cart</Link>
                        <ChevronLeft className="w-3 h-3 rotate-180" />
                        <span className={step === 1 ? "text-[#0a1f1c] font-bold" : "text-stone-400"}>Information</span>
                        <ChevronLeft className="w-3 h-3 rotate-180" />
                        <span className={step === 2 ? "text-[#0a1f1c] font-bold" : "text-stone-400"}>Payment</span>
                    </div>

                    <h1 className="text-3xl font-serif text-[#0a1f1c] mb-6">{step === 1 ? 'Shipping Details' : 'Payment Method'}</h1>

                    {/* --- STEP 1: INFORMATION --- */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition duration-300">
                               <h3 className="font-bold text-sm uppercase tracking-widest mb-6 text-stone-400 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">1</span>
                                    {isGift ? "Your Details (For Bill)" : "Contact Info"}
                                </h3>
                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder={isGift ? "Enter YOUR Email (Bill will be sent here)" : "Email Address"}
                                        className="w-full p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">2</span>
                                        {isGift ? "Recipient's Shipping Address" : "Shipping Address"}
                                    </h3>
                                    {currentUser && !isGift && (
                                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                                            Auto-Filled
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">
                                            {isGift ? "Recipient's First Name" : "First Name"}
                                        </label>
                                        <input 
                                            placeholder={isGift ? "e.g. Priya" : "First Name"} 
                                            className="p-4 w-full bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                                            value={formData.firstName} 
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">
                                            {isGift ? "Recipient's Last Name" : "Last Name"}
                                        </label>
                                        <input 
                                            placeholder={isGift ? "e.g. Sharma" : "Last Name"} 
                                            className="p-4 w-full bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                                            value={formData.lastName} 
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-stone-300" />
                                        <input placeholder="Address (House No, Street, Area)" className="w-full p-4 pl-12 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                   {/* ✅ STEP 4: YE PURA BLOCK REPLACE KAREIN */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        
                                        {/* Pincode Input */}
                                        <div className="relative">
                                            <input 
                                                placeholder="PIN Code (e.g. 110001)" 
                                                className="w-full p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition font-mono font-bold placeholder:text-stone-400" 
                                                value={formData.pincode} 
                                                onChange={handlePincodeChange} // Function connect kiya
                                                maxLength={6}
                                            />
                                            {loading && <span className="absolute right-3 top-4 text-xs animate-spin">⏳</span>}
                                        </div>

                                        {/* City Input */}
                                        <input 
                                            placeholder="City / District" 
                                            className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" 
                                            value={formData.city} 
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                                        />

                                        {/* State Dropdown */}
                                        <div className="relative">
                                            <select 
                                                className={`w-full p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition appearance-none cursor-pointer ${formData.state ? 'text-[#0a1f1c] font-bold' : 'text-stone-400'}`}
                                                value={formData.state} 
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            >
                                                <option value="" disabled>Select State</option>
                                                {INDIAN_STATES.map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <ChevronLeft className="w-4 h-4 -rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">
                                            {isGift ? "Recipient's Phone (For Delivery)" : "Phone Number"}
                                        </label>
                                        <input 
                                            placeholder="Phone Number" 
                                            className="w-full p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                                        />
                                        {isGift && <p className="text-[10px] text-amber-600 mt-1">Don't worry, we won't reveal your identity on call.</p>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- SECRET GIFT MODE SECTION --- */}
                           {/* --- SECRET GIFT MODE SECTION (UPDATED) --- */}
{/* --- 🎁 ULTRA-PREMIUM SECRET GIFT SECTION --- */}
<div className="mb-8 group relative">
    
    {/* 1. Animated Border Gradient (Gold Glow border) */}
    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500/40 via-white/10 to-amber-500/40 opacity-0 transition-opacity duration-500 ${isGift ? 'opacity-100 blur-[2px]' : 'group-hover:opacity-50'}`}></div>

    {/* 2. Main Card Container */}
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${isGift ? 'bg-[#051614] border-amber-500/50 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.2)]' : 'bg-white border-stone-200 hover:border-amber-300'}`}>
        
        {/* Background Texture (Subtle Noise/Pattern) */}
        {isGift && (
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        )}

        {/* 3. Header & Toggle */}
        <div 
            className="p-6 cursor-pointer relative z-10"
            onClick={() => setIsGift(!isGift)}
        >
            <div className="flex items-center gap-5">
                
                {/* Icon Box */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner ${isGift ? 'bg-gradient-to-br from-amber-400 to-amber-700 text-white scale-110 shadow-amber-900/50' : 'bg-stone-100 text-stone-400'}`}>
                    {isGift ? <Crown className="w-7 h-7 animate-pulse" /> : <Gift className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h3 className={`font-serif text-lg tracking-wide transition-colors ${isGift ? 'text-white' : 'text-stone-800'}`}>
                            Secret Gift Mode™
                        </h3>
                        
                        {/* Custom Toggle Switch */}
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${isGift ? 'bg-amber-500' : 'bg-stone-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isGift ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                    
                    <p className={`text-xs mt-1 transition-colors ${isGift ? 'text-amber-100/70' : 'text-stone-500'}`}>
                        {isGift ? "VIP Packaging Active. Invoice Hidden." : "Upgrade to luxury packaging & hide the price tag."}
                    </p>
                </div>
            </div>
        </div>

        {/* 4. Expanded Content (Message Box) */}
        <AnimatePresence>
            {isGift && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#0a1f1c]/50 border-t border-white/5"
                >
                    <div className="p-6 pt-2">
                        {/* Features Tags */}
                        <div className="flex gap-3 mb-5 overflow-x-auto no-scrollbar">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-amber-200 font-bold uppercase tracking-wider whitespace-nowrap">
                                <Sparkles className="w-3 h-3" /> No Invoice
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-amber-200 font-bold uppercase tracking-wider whitespace-nowrap">
                                <Gift className="w-3 h-3" /> Premium Box
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-amber-200 font-bold uppercase tracking-wider whitespace-nowrap">
                                <Lock className="w-3 h-3" /> Secret Identity
                            </span>
                        </div>

                        {/* Message Input (Looks like a Premium Card) */}
                        <div className="relative group/input">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-500"></div>
                            <div className="relative">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block pl-1">
                                    Message on Card
                                </label>
                                <textarea
                                    value={giftMessage}
                                    onChange={(e) => setGiftMessage(e.target.value)}
                                    placeholder="Write a heartfelt note... (e.g., Happy Birthday, My Love!)"
                                    maxLength={200}
                                    className="w-full bg-[#051614] border border-amber-500/30 rounded-xl p-4 text-amber-50 text-sm focus:border-amber-400 outline-none transition placeholder:text-white/20 resize-none h-28 font-serif leading-relaxed shadow-inner"
                                />
                                <div className="absolute bottom-3 right-3 text-[9px] text-white/30 font-mono">
                                    {giftMessage.length}/200
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-amber-500/80 mt-4 flex items-center gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 w-fit">
                            <ShieldCheck className="w-3 h-3" /> 
                            We will email the bill to <u>{formData.email || currentUser?.email || "you"}</u> only.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
</div>
{/* ------------------------------------------- */}
                            
                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className="bg-[#0a1f1c] text-white px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-amber-700 transition flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                                    Continue to Payment <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* --- STEP 2: PAYMENT --- */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm text-sm text-stone-600 flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                                    <div className="flex gap-4">
                                        <span className="text-stone-400 w-20">Contact</span>
                                        <span className="font-medium text-[#0a1f1c]">{formData.email}</span>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase">Change</button>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex gap-4">
                                        <span className="text-stone-400 w-20">Ship to</span>
                                        <span className="font-medium text-[#0a1f1c] truncate max-w-[250px]">{formData.address}, {formData.city}, {formData.pincode}</span>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase">Change</button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">3</span>
                                        Select Payment
                                    </h3>
                                    <p className="text-xs text-stone-400 mt-2 ml-8 flex items-center gap-1"><Lock className="w-3 h-3" /> All transactions are secure and encrypted.</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex gap-4 mb-2">
                                        <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-amber-500 bg-amber-500/10 shadow-md' : 'border-stone-200 hover:bg-stone-50'}`}>
                                            <input
                                                type="radio"
                                                name="pay"
                                                className="accent-amber-600 w-5 h-5"
                                                checked={paymentMethod === 'online'}
                                                onChange={() => setPaymentMethod('online')}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#0a1f1c]">Pay Online</span>
                                                <span className="text-[10px] text-stone-500">UPI, Cards, NetBanking</span>
                                            </div>
                                        </label>

                                        <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-500/10 shadow-md' : 'border-stone-200 hover:bg-stone-50'}`}>
                                            <input
                                                type="radio"
                                                name="pay"
                                                className="accent-amber-600 w-5 h-5"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#0a1f1c]">Cash on Delivery</span>
                                                <span className="text-[10px] text-stone-500">Pay at doorstep</span>
                                            </div>
                                        </label>
                                    </div>

                                    {paymentMethod === 'online' && (
                                        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-2 border border-green-200">
                                            <ShieldCheck className="w-4 h-4" />
                                            Fast & Secure Payment. Extra discounts may apply.
                                        </div>
                                    )}
                                    {paymentMethod === 'cod' && (
                                        <div className="p-3 bg-orange-50 text-orange-700 text-xs rounded-lg flex items-center gap-2 border border-orange-200">
                                            <Truck className="w-4 h-4" />
                                            Pay cash when the order arrives. Please keep exact change.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <button onClick={() => setStep(1)} className="text-stone-400 hover:text-[#0a1f1c] flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="bg-[#0a1f1c] text-white px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-amber-700 transition flex items-center gap-3 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ₹${total.toLocaleString()}`}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* RIGHT COLUMN: SUMMARY (FIXED LAYOUT) */}
               <div className="lg:col-span-5 space-y-6 h-fit lg:sticky lg:top-28 order-1 lg:order-2">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
                        <h3 className="font-serif text-lg text-[#0a1f1c] mb-6 border-b border-stone-100 pb-4">Order Summary</h3>
{/* 👑 LOYALTY POINTS CARD */}
                        {currentUser && currentUser.points > 0 && (
                            <div className="mb-6 p-1 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 shadow-md">
                                <div className="bg-white rounded-lg p-4 relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <h3 className="text-amber-600 font-serif text-sm font-bold flex items-center gap-2">
                                                <Crown className="w-4 h-4 fill-current" />
                                                Redeem Points
                                            </h3>
                                            <p className="text-stone-500 text-[10px] mt-1 font-medium">
                                                Balance: <span className="text-[#0a1f1c] font-bold">{currentUser.points} Pts</span>
                                                <span className="mx-2 text-stone-300">|</span>
                                                Rate: ₹{pointRate}/pt
                                            </p>
                                        </div>
                                        {pointsDiscount > 0 && (
                                            <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                                <Check className="w-3 h-3" /> APPLIED
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-stone-100">
                                        {pointsDiscount > 0 ? (
                                            <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-200">
                                                <div>
                                                    <p className="text-green-700 font-bold text-xs">₹{pointsDiscount} Saved!</p>
                                                    <p className="text-green-600/70 text-[9px]">Using {pointsRedeemed} Points</p>
                                                </div>
                                                <button onClick={removeLoyaltyPoints} className="text-stone-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => redeemLoyaltyPoints(maxRedeemable)}
                                                className="w-full py-2 bg-[#0a1f1c] hover:bg-amber-600 text-white font-bold text-[10px] uppercase rounded transition flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <Sparkles className="w-3 h-3" /> Use Max Points (₹{Math.floor(maxRedeemable * pointRate)})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* COUPON SECTION */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Have a Coupon?</label>
                            {!appliedCoupon ? (
                                <div className="flex gap-2">
                                    <input
                                        placeholder="Enter Code"
                                        className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm uppercase font-bold outline-none focus:border-amber-500 transition"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    />
                                    <button onClick={handleApplyCoupon} className="bg-[#0a1f1c] text-white px-4 rounded-lg text-xs font-bold hover:bg-amber-700 transition">APPLY</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Ticket className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="text-xs font-bold text-green-700">'{appliedCoupon.code}' Applied</p>
                                            <p className="text-[10px] text-green-600">You saved ₹{discountAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleRemoveCoupon} className="text-red-500 hover:bg-red-100 p-2 rounded-full transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Available Coupons Suggestions */}
                            {availableCoupons && availableCoupons.length > 0 && !appliedCoupon && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {availableCoupons.slice(0, 4).map((c: any) => (
                                        <button
                                            key={c.code}
                                            onClick={() => setCouponCode(c.code)}
                                            className="text-[9px] px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md uppercase font-bold hover:bg-amber-100"
                                        >
                                            {c.code}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* CART ITEMS WITH DELETE BUTTON */}
                        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                            {/* ✅ FIX 4: Loop mein 'index' daala taaki SAME product error na aaye */}
                            {cart.map((item: any, index: number) => (
                                <div key={`${item.product.id}-${index}`} className="flex gap-4 relative bg-stone-50 p-2 rounded-xl group">
                                    <div className="relative w-14 h-14 bg-white rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
                                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-serif text-xs text-[#0a1f1c] leading-tight truncate pr-4">{item.product.name}</h4>
                                        
                                        {/* Display Variant Info in Cart Summary */}
                                        {(item.selectedSize || item.selectedColor) && (
                                            <div className="flex gap-2 mt-1">
                                                {item.selectedSize && <span className="text-[9px] text-stone-500 bg-white px-1.5 rounded border border-stone-200">Size: {item.selectedSize}</span>}
                                                {item.selectedColor && <span className="text-[9px] text-stone-500 bg-white px-1.5 rounded border border-stone-200 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-current" style={{color: item.selectedColor}}></span> {item.selectedColor}</span>}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-2">
                                            {/* Qty Controls */}
                                            <div className="flex items-center bg-white border border-stone-200 rounded h-6">
                                                <button onClick={() => handleQuantityChange(item, -1)} className="w-5 text-stone-500 text-xs hover:bg-stone-100">-</button>
                                                <span className="px-2 text-xs font-bold text-[#0a1f1c]">{item.qty}</span>
                                                <button onClick={() => handleQuantityChange(item, 1)} className="w-5 text-stone-500 text-xs hover:bg-stone-100">+</button>
                                            </div>
                                            <span className="font-bold text-xs text-amber-600">₹{(item.product.price * item.qty).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* ✅ RESTORED DELETE BUTTON */}
                                   <button 
                                        onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                                        className="absolute top-2 right-2 text-stone-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-full"
                                        title="Remove Item"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* TOTALS */}
                       {/* TOTALS (ALIGNED WITH INVOICE) */}
                        <div className="space-y-3 text-sm text-stone-500 pt-6 border-t border-stone-100">
                            
                            <div className="flex justify-between">
                                <span>MRP Total (Inclusive of Tax)</span>
                                <span className="font-medium text-[#0a1f1c]">₹{cartInclusiveTotal.toLocaleString()}</span>
                            </div>

                            {isGift && (
                                <div className="flex justify-between text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1">
                                    <span className="flex items-center gap-1 text-xs font-bold"><Gift className="w-3 h-3" /> Secret Gift Mode (Incl. GST)</span>
                                    <span className="font-bold text-xs">+ ₹{currentGiftInclusive}</span>
                                </div>
                            )}

                            {/* --- BREAKDOWN FOR CLARITY --- */}
                            <div className="pt-2 pb-2 space-y-1 border-b border-stone-100 mb-2 bg-stone-50/50 p-2 rounded">
                                <div className="flex justify-between text-[11px] text-stone-400">
                                    <span>Taxable Value (Base Price)</span>
                                    <span>₹{totalBasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                {/* 1. COUPON DISCOUNT (Jo gayab ho gaya tha) */}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-[11px] text-green-600 font-bold">
                                        <span>Less: Coupon Discount</span>
                                        <span>- ₹{discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {pointsDiscount > 0 && (
                                    <div className="flex justify-between text-[11px] text-amber-600 font-bold animate-pulse">
                                        <span className="flex items-center gap-1"><Crown className="w-3 h-3"/> Loyalty Points</span>
                                        <span>- ₹{pointsDiscount.toLocaleString()}</span>
                                    </div>

                                )}
                                <div className="flex justify-between text-[11px] text-stone-400">
                                    <span>Net Taxable Value</span>
                                    <span>₹{gstBreakdown.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between text-[11px] text-stone-400">
                                    <span>GST ({taxRate}%)</span>
                                    <span>₹{totalGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <span>Shipping Charges</span>
                                <span className="font-medium text-[#0a1f1c]">{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${shipping}`}</span>
                            </div>

                            <div className="flex justify-between items-end pt-4 border-t border-dashed border-stone-200 mt-4">
                                <span className="text-lg text-[#0a1f1c] font-serif">Grand Total</span>
                                <div className="text-right">
                                    <span className="text-[10px] text-stone-400 block mb-1 uppercase tracking-widest">Inclusive of All Taxes</span>
                                    <span className="text-2xl font-serif text-amber-600">₹{Math.round(total).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-stone-400 bg-stone-50 p-3 rounded-lg">
                            <ShieldCheck className="w-3 h-3" />
                            Secure SSL Checkout powered by ZERIMI
                        </div>
                    </div>
                </div>
{/* ✅ STEP: IS CODE KO YAHAN PASTE KAREIN (Last </div> se theek pehle) */}
            
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-[#0a1f1c]/95 backdrop-blur-xl flex flex-col items-center justify-center text-white"
                    >
                        {/* Animated Logo/Spinner */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-white/50" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-serif tracking-[0.2em] text-white mb-4">PROCESSING</h2>
                        
                        <div className="flex flex-col items-center space-y-2">
                            <p className="text-amber-500/80 text-xs uppercase tracking-widest animate-pulse">
                                Securing your luxury items...
                            </p>
                            <p className="text-stone-400 text-[10px]">
                                Please do not close or refresh the page.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ✅ YAHAN CODE KHATAM */}
            </div>
        </div>
    );
}