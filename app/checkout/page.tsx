"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, Truck, ArrowRight, MapPin,
    Ticket, Check, AlertCircle, ShoppingBag, Lock, ChevronLeft, Loader2, X, Trash2, Gift
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
    // ✅ YE 2 LINES ADD KAREIN:
    const [isGift, setIsGift] = useState(false);
    const [giftMessage, setGiftMessage] = useState('');

    const {
        cart,
        currentUser,
        coupons,
        placeOrder,
        clearCart,
        systemSettings,
        removeFromCart,
        addToCart
    } = store;

    // --- STATE ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Settings Fetch
    const [liveSettings, setLiveSettings] = useState<any>(null);

    useEffect(() => {
        if (!(window as any).Razorpay) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    // User Data Fetch
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
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
    }, []);

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

    const [paymentMethod, setPaymentMethod] = useState('online');

    // --- CALCULATIONS ---
    if (systemSettings?.maintenanceMode) {
        return (
            <div className="min-h-screen bg-[#051614] flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
                <h1 className="text-3xl font-serif text-white mb-2">Under Maintenance</h1>
                <p className="text-white/50">Store upgrades in progress. Please check back shortly.</p>
                <Link href="/" className="mt-6 text-amber-500 hover:underline">Return Home</Link>
            </div>
        );
    }

    const subtotal = cart.reduce((sum: number, item: any) => sum + item.product.price * item.qty, 0);
    const taxRate = Number(systemSettings?.taxRate) || 3; 
    const gstBreakdown = calculateInclusiveGST(subtotal, taxRate);

    const shippingThreshold = Number(systemSettings?.shippingThreshold) || 5000;
    const baseShipping = Number(systemSettings?.shippingCost) || 150;
    const isFreeShipping = subtotal >= shippingThreshold;
    const shipping = isFreeShipping ? 0 : baseShipping;

   // 1. Gift Cost Nikalein (Settings se ya Default 50)
const giftModeCost = Number(systemSettings?.giftModeCost) || 50; 
const currentGiftCost = isGift ? giftModeCost : 0;

// 2. Total mein Add Karein
const total = subtotal + shipping - discountAmount + currentGiftCost;

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // --- EFFECTS ---
    useEffect(() => {
        if (cart.length === 0 && step !== 3) {
            const timer = setTimeout(() => router.push('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [cart, router, step]);

    useEffect(() => {
        if (currentUser) {
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
    }, [currentUser]);

    const handleQuantityChange = (item: any, change: number) => {
        if (item.qty === 1 && change === -1) {
            if (confirm("Remove this item from cart?")) {
                removeFromCart(item.product.id);
            }
            return;
        }
        addToCart(item.product, change);
    };

    // --- COUPON HANDLERS ---
    const availableCoupons = coupons.filter((c: any) => {
        if (!c.allowedEmail) return true;
        if (currentUser?.email && c.allowedEmail.toLowerCase() === currentUser.email.toLowerCase()) {
            return true;
        }
        return false;
    });

    const handleApplyCoupon = () => {
        if (!couponCode) return setToast({ msg: "Please enter a code", type: "error" });
        const found = coupons?.find((c: any) => c.code.toLowerCase() === couponCode.toLowerCase());
        if (!found) return setToast({ msg: "Invalid Coupon Code", type: "error" });

        if (subtotal < (found.minOrderValue || 0)) {
            return setToast({ msg: `Add items worth ₹${found.minOrderValue - subtotal} more`, type: "error" });
        }

        const userEmail = auth.currentUser?.email?.toLowerCase();
        if (found.allowedEmail && found.allowedEmail.toLowerCase() !== userEmail) {
            return setToast({ msg: "This coupon is not valid for your account", type: "error" });
        }

        let disc = 0;
        if (found.type === 'percent') {
            disc = Math.round((subtotal * found.discount) / 100);
        } else {
            disc = found.discount;
        }

        setAppliedCoupon(found);
        setDiscountAmount(disc);
        setToast({ msg: "Coupon Applied!", type: "success" });
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode('');
        setToast({ msg: "Coupon Removed", type: "success" });
    };

    const handlePlaceOrder = async () => {
        const finalEmail = formData.email?.trim().toLowerCase() || currentUser?.email?.trim().toLowerCase();
        
        // Validation
        if (!finalEmail || !formData.firstName || !formData.address || !formData.pincode || !formData.phone) {
            showToast("Please fill all delivery details.", 'error');
            setStep(1);
            return;
        }

        setLoading(true);

        try {
            const state = useStore.getState();
            const settings = liveSettings || state.systemSettings || {};
            
            // ✅ PRICE CALCULATIONS (Gift Cost Added)
            const giftModeCost = Number(settings?.giftModeCost) || 50;
            const currentGiftCost = isGift ? giftModeCost : 0;
            
            // Total Recalculate taaki server pe sahi amount jaye
            const finalTotal = subtotal + shipping + currentGiftCost - discountAmount;

            if (paymentMethod === 'online') {
                 // Online Logic (Future Scope)
                 showToast("Online payment coming soon. Please select COD.", 'error');
                 setLoading(false);
                 return;
            } else if (paymentMethod === 'cod') {
                console.log("Processing COD Order...");
                const action = state.placeOrder;
                
                // Fake Delay for UX
                await new Promise(resolve => setTimeout(resolve, 1500));

                // ✅ FIXED ORDER DETAILS OBJECT
                const orderDetails = {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: finalEmail,
                    
                    // 1. Address Object (Isme Gift info MAT dalna)
                    address: {
                        id: `addr_${Date.now()}`,
                        street: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        phone: formData.phone,
                    },

                    // 2. Main Order Flags (Ye Address se BAHAR hone chahiye)
                    isGift: isGift, 
                    giftMessage: giftMessage || "",
                    giftWrapPrice: currentGiftCost, // ✅ Database mein price save hoga

                    // 3. Payment & Status
                    status: 'Pending',
                    paymentMethod: 'COD',
                    date: new Date().toLocaleDateString('en-IN'),
                    
                    // 4. Amounts
                    total: finalTotal, 
                    subtotal: subtotal,
                    shipping: shipping,
                    discount: discountAmount,
                    tax: gstBreakdown.totalTax,
                    
                    // 5. Items (Size & Color Mapped)
                    items: cart.map((item: any) => ({
                        name: item.product.name,
                        qty: item.qty,
                        price: item.product.price,
                        image: item.product.image,
                        selectedSize: item.selectedSize || null,
                        selectedColor: item.selectedColor || null
                    }))
                };

                // Action Call
                await action(orderDetails);
                
                if (typeof clearCart === 'function') clearCart();
                setLoading(false);
                setStep(3); // Success Screen
                return;
            }
        } catch (error: any) {
            console.error("Order Error:", error);
            showToast(error.message || "Order Failed", 'error');
            setLoading(false);
        }
    };

    if (cart.length === 0 && step !== 3) {
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

    if (step === 3) {
        return (
            <div className="min-h-screen bg-[#0a1f1c] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl p-10 max-w-lg w-full text-center relative z-10 shadow-2xl"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-200">
                        <Check className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-serif text-[#0a1f1c] mb-3">Order Confirmed</h2>
                    <p className="text-stone-500 mb-8 leading-relaxed">
                        Thank you for choosing ZERIMI. A confirmation email has been sent to <span className="font-bold text-[#0a1f1c]">{formData.email}</span>.
                    </p>
                    <div className="bg-stone-50 rounded-xl p-6 mb-8 text-left border border-stone-100">
                        <div className="flex justify-between mb-3 pb-3 border-b border-stone-200">
                            <span className="text-xs uppercase text-stone-400 tracking-widest">Order ID</span>
                            <span className="font-mono font-bold text-[#0a1f1c]">#{Math.floor(100000 + Math.random() * 900000)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs uppercase text-stone-400 tracking-widest">Est. Delivery</span>
                            <span className="font-bold text-amber-600">3-5 Business Days</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={() => router.push('/dashboard')} className="w-full py-4 bg-[#0a1f1c] text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-stone-800 transition shadow-lg">
                            Track My Order
                        </button>
                        <button onClick={() => router.push('/')} className="w-full py-4 bg-transparent text-stone-400 uppercase tracking-widest text-xs font-bold hover:text-[#0a1f1c] transition">
                            Continue Shopping
                        </button>
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
                <div className="lg:col-span-7 space-y-8">
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
    placeholder={isGift ? "Enter YOUR Email (Bill will be sent here)" : "Email Address"} // ✅ Placeholder update
    className="..."
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
/>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-stone-400 flex items-center gap-2">
    <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">2</span>
    {isGift ? "Recipient's Shipping Address" : "Shipping Address"} {/* ✅ Label Changed */}
</h3>
                                    {currentUser && (
                                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                                            Auto-Filled
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">
            {isGift ? "Recipient's First Name" : "First Name"} {/* ✅ Label */}
        </label>
        <input 
            placeholder={isGift ? "e.g. Priya" : "First Name"} 
            className="..." 
            value={formData.firstName} 
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
        />
    </div>
    <div>
        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">
            {isGift ? "Recipient's Last Name" : "Last Name"} {/* ✅ Label */}
        </label>
        <input 
            placeholder={isGift ? "e.g. Sharma" : "Last Name"} 
            className="..." 
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
                                    <div className="grid grid-cols-3 gap-4">
                                        <input placeholder="City" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                        <input placeholder="State" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                                        <input placeholder="PIN Code" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
                                    </div>
                                    <div>
    <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">
        {isGift ? "Recipient's Phone (For Delivery)" : "Phone Number"} {/* ✅ Label */}
    </label>
    <input 
        placeholder="Phone Number" 
        className="..." 
        value={formData.phone} 
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
    />
    {/* ✅ Extra Helper Text for Gift */}
    {isGift && <p className="text-[10px] text-amber-600 mt-1">Don't worry, we won't reveal your identity on call.</p>}
</div>
                                </div>
                            </div>
{/* --- ✅ SECRET GIFT MODE SECTION (Paste Here) --- */}
<div className={`p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden group mb-6 ${isGift ? 'bg-[#0a1f1c] border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white border-stone-200'}`}>
    
    {/* Background Animation (Active Mode) */}
    {isGift && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse"></div>
    )}

    <div className="flex items-start gap-4 relative z-10">
        {/* Icon Box */}
        <div className={`p-3 rounded-xl transition-colors duration-300 ${isGift ? 'bg-amber-600 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>
            {isGift ? <Lock className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
        </div>

        <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
                <div>
                    <h3 className={`font-serif text-lg tracking-wide flex items-center gap-2 ${isGift ? 'text-white' : 'text-stone-800'}`}>
                        Secret Gift Mode™ 
                        {isGift && <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                    </h3>
                </div>
                
                {/* Toggle Switch */}
                <div 
                    onClick={() => setIsGift(!isGift)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isGift ? 'bg-amber-600' : 'bg-stone-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isGift ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </div>
            
            <p className={`text-xs leading-relaxed mb-4 ${isGift ? 'text-white/60' : 'text-stone-500'}`}>
                Surprise them with luxury. We’ll hide your identity and the price tag.
            </p>

            {/* Hidden Message Box */}
            <AnimatePresence>
                {isGift && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Features Badges */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-[10px] text-amber-100/80 bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="p-1 bg-amber-500/20 rounded-full text-amber-500">🎁</span> Unbranded Box
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-amber-100/80 bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="p-1 bg-red-500/20 rounded-full text-red-400">🙈</span> No Invoice
                            </div>
                        </div>

                        {/* Message Input */}
                        <textarea
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            placeholder="Type your secret message here..."
                            className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 resize-none h-24 font-serif placeholder:text-white/20"
                        />
                        <p className="text-[10px] text-amber-500 mt-3 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> They’ll never know who sent it.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
</div>
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
                <div className="lg:col-span-5 space-y-6 h-fit sticky top-28">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
                        <h3 className="font-serif text-lg text-[#0a1f1c] mb-6 border-b border-stone-100 pb-4">Order Summary</h3>

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
                            {cart.map((item: any) => (
                                <div key={item.product.id} className="flex gap-4 relative bg-stone-50 p-2 rounded-xl group">
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
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="absolute top-2 right-2 text-stone-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-full"
                                        title="Remove Item"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* TOTALS */}
                        <div className="space-y-3 text-sm text-stone-500 pt-6 border-t border-stone-100">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-medium text-[#0a1f1c]">₹{subtotal.toLocaleString()}</span>
                            </div>
                           {/* --- GST BREAKDOWN (Informational Only) --- */}
                            <div className="pt-2 pb-2 space-y-1 border-b border-stone-100 mb-2">
                                <div className="flex justify-between text-[11px] text-stone-400">
                                    <span>Taxable Value (Base Price)</span>
                                    <span>₹{gstBreakdown.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-stone-400">
                                    <span>CGST ({(taxRate / 2).toFixed(1)}%)</span>
                                    <span>₹{gstBreakdown.cgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-stone-400">
                                    <span>SGST ({(taxRate / 2).toFixed(1)}%)</span>
                                    <span>₹{gstBreakdown.sgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="font-medium text-[#0a1f1c]">{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${shipping}`}</span>
                            </div>
{/* ✅ NEW: GIFT COST ROW */}
{isGift && (
    <div className="flex justify-between text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1">
        <span className="flex items-center gap-1 text-xs font-bold"><Gift className="w-3 h-3" /> Secret Gift Mode</span>
        <span className="font-bold text-xs">+ ₹{giftModeCost}</span>
    </div>
)}
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>Discount</span>
                                    <span>- ₹{discountAmount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-end pt-4 border-t border-dashed border-stone-200 mt-4">
                                <span className="text-lg text-[#0a1f1c] font-serif">Total</span>
                                <div className="text-right">
                                    <span className="text-[10px] text-stone-400 block mb-1 uppercase tracking-widest">Including Taxes</span>
                                    <span className="text-2xl font-serif text-amber-600">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-stone-400 bg-stone-50 p-3 rounded-lg">
                            <ShieldCheck className="w-3 h-3" />
                            Secure SSL Checkout powered by ZERIMI
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}