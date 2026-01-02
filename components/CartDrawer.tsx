"use client";
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import {
    X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck,
    Gift, Clock, CreditCard, ShieldCheck, FileText, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // ✅ Alert ke liye

export default function CartDrawer() {
    const router = useRouter();

    // ✅ Store se currentUser le rahe hain security ke liye
    const {
        cart,
        isCartOpen,
        toggleCart,
        removeFromCart,
        addToCart,
        systemSettings,
        currentUser
    } = useStore() as any;

    // --- PREMIUM FEATURES STATES ---
    const [giftWrap, setGiftWrap] = useState(false);
    const [orderNote, setOrderNote] = useState('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 Minutes Timer

    // Prevent background scroll
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
            setTimeLeft(600); // Reset timer on open
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isCartOpen]);

    // Countdown Timer Logic
    useEffect(() => {
        if (!isCartOpen || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isCartOpen]);

    // Format Time (MM:SS)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Calculations
    const subtotal = cart.reduce((sum: number, item: any) => sum + (item.product.price * item.qty), 0);
    const giftWrapCost = giftWrap ? 50 : 0;
    const finalTotal = subtotal + giftWrapCost;

    const shippingThreshold = Number(systemSettings?.shippingThreshold) || 5000;
    const remainingForFreeShip = shippingThreshold - subtotal;
    const progressPercent = Math.min(100, (subtotal / shippingThreshold) * 100);

    // Qty Handler
    const handleQty = (item: any, change: number) => {
        if (item.qty === 1 && change === -1) {
            if (confirm("Remove this item from your collection?")) {
                removeFromCart(item.product.id);
            }
        } else {
            // Pass selectedSize too
            addToCart(item.product, change, item.selectedSize);
        }
    };

    // ✅ CHECKOUT SECURITY LOGIC
    const handleCheckout = () => {
        // 1. Agar User Login NAHI hai
        if (!currentUser) {
            toast.error("🔒 Login Required! Please sign in to secure your order.", {
                style: { border: '1px solid #ef4444', color: '#7f1d1d' },
                iconTheme: { primary: '#ef4444', secondary: '#FFFAEE' },
            });

            toggleCart(false);
            router.push('/login');
            return;
        }

        // 2. Agar Login hai
        toast.loading("Securing your items...", { duration: 2000 });
        toggleCart(false);
        router.push('/checkout');
    };

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">

            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-[#0a1f1c]/40 backdrop-blur-md transition-opacity duration-500"
                onClick={() => toggleCart(false)}
            ></div>

            {/* Main Drawer */}
            <div className="relative w-full max-w-md bg-[#ffffff] h-full shadow-2xl flex flex-col animate-slide-in-right transform transition-transform duration-500">

                {/* --- 1. PREMIUM HEADER --- */}
                <div className="p-6 border-b border-stone-100 bg-white relative z-20">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-serif text-2xl text-[#0a1f1c] tracking-wide">
                            Your Selection
                        </h2>
                        <button
                            onClick={() => toggleCart(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition duration-300"
                        >
                            <X className="w-5 h-5 text-stone-500" />
                        </button>
                    </div>
                    {/* Urgency Timer */}
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md inline-block">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>Items reserved for <span className="font-bold font-mono text-sm">{formatTime(timeLeft)}</span></span>
                    </div>
                </div>

                {/* --- 2. PROGRESS BAR (Gradient) --- */}
                <div className="bg-gradient-to-r from-stone-50 to-white px-6 py-4 border-b border-stone-100 shadow-inner">
                    <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="text-stone-500 font-medium uppercase tracking-widest">Free Delivery Status</span>
                        <span className="text-[#0a1f1c] font-bold">{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#0a1f1c] to-amber-500 transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2 text-right">
                        {remainingForFreeShip > 0
                            ? `Add ₹${remainingForFreeShip.toLocaleString()} for complimentary shipping`
                            : "✨ You have unlocked Complimentary Shipping"}
                    </p>
                </div>

                {/* --- 3. ITEMS LIST --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#FAFAFA]">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-stone-300" />
                            </div>
                            <div>
                                <p className="text-lg font-serif text-[#0a1f1c] mb-1">Your bag is empty</p>
                                <p className="text-xs text-stone-400 max-w-[200px] mx-auto">Luxury awaits. Explore our collection to find your perfect piece.</p>
                            </div>
                            <button
                                onClick={() => {
                                    toggleCart(false); // Cart band karega
                                    router.push('/category/all'); // ✅ All Category par le jayega
                                }}
                                className="px-8 py-3 bg-[#0a1f1c] text-white text-xs uppercase tracking-widest hover:bg-amber-600 transition shadow-lg"
                            >
                                Explore Collection
                            </button>
                        </div>
                    ) : (
                        cart.map((item: any) => (
                            <div key={`${item.product.id}-${item.selectedSize}`} className="group relative flex gap-4 bg-white p-3 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300">

                                {/* Product Image */}
                                <div className="relative w-24 h-28 bg-stone-50 rounded-lg overflow-hidden border border-stone-50">
                                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover group-hover:scale-105 transition duration-700" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-serif text-sm text-[#0a1f1c] leading-tight pr-4">{item.product.name}</h4>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-stone-300 hover:text-red-500 transition p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-medium">{item.product.category}</p>
                                        {item.selectedSize && (
                                            <span className="inline-block mt-2 text-[10px] border border-stone-200 px-2 py-0.5 rounded text-stone-500">
                                                Size: {item.selectedSize}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        {/* Elegant Qty Control */}
                                        <div className="flex items-center bg-stone-50 rounded-lg p-1 border border-stone-100">
                                            <button onClick={() => handleQty(item, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-stone-100 text-stone-600 transition"><Minus className="w-3 h-3" /></button>
                                            <span className="w-8 text-center text-xs font-bold text-[#0a1f1c]">{item.qty}</span>
                                            <button onClick={() => handleQty(item, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-stone-100 text-stone-600 transition"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <p className="text-sm font-bold text-[#0a1f1c]">₹{(item.product.price * item.qty).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* --- UPSELL: GIFT WRAP & NOTE --- */}
                    {cart.length > 0 && (
                        <div className="space-y-4 pt-2">
                            {/* ✨ SECRET GIFT MODE TEASER (Marketing Banner) */}
<div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-[#fff8f0] border border-amber-200 relative overflow-hidden group">
    
    {/* Shine Animation */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

    <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-amber-100 text-amber-600">
            <Gift className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
            <h4 className="text-sm font-serif font-bold text-amber-900 flex items-center gap-2">
                Sending a Surprise? 
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            </h4>
            <p className="text-[11px] text-amber-800/70 mt-1 leading-relaxed">
                Unlock <strong>Secret Gift Mode™</strong> at Checkout. We’ll hide the price tag & send it anonymously.
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-white/50 px-2 py-1 rounded border border-amber-200/50">
                <span>Select option at next step</span>
            </div>
        </div>
    </div>
</div>

                            {/* Order Note */}
                            <div className="relative">
                                <FileText className="absolute top-3 left-3 w-4 h-4 text-stone-400" />
                                <textarea
                                    value={orderNote}
                                    onChange={(e) => setOrderNote(e.target.value)}
                                    placeholder="Add a note to your order (optional)..."
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none h-20"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 4. STICKY FOOTER --- */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-stone-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 relative">

                        {/* Price Breakdown */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs text-stone-500">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            {giftWrap && (
                                <div className="flex justify-between text-xs text-amber-600 animate-fade-in">
                                    <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Gift Wrap</span>
                                    <span>+₹50</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end border-t border-dashed border-stone-200 pt-3 mt-2">
                                <span className="text-sm font-serif text-[#0a1f1c]">Total</span>
                                <span className="text-xl font-serif font-bold text-[#0a1f1c]">₹{finalTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Secure Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-[#0a1f1c] text-white py-4 rounded-xl uppercase tracking-[0.2em] text-xs font-bold hover:bg-amber-600 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">Secure Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></span>
                        </button>

                        {/* Trust Icons */}
                        <div className="flex justify-center items-center gap-4 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Visa</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Mastercard</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">UPI</span>
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}