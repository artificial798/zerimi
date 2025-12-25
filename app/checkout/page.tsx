"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Truck, CreditCard, ArrowRight, MapPin, 
  Ticket, Check, AlertCircle, ShoppingBag, Lock, ChevronLeft, Loader2, X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM TOAST COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: 20 }}
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-md border ${
      type === 'success' 
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

export default function CheckoutPage() {
  const router = useRouter();
  // Using 'any' cast to avoid strict type checks during dev, but placeOrder is the correct name now
  const store = useStore() as any; 
 // 1. systemSettings aur removeFromCart nikalein
  const { 
  cart, 
  currentUser, 
  coupons, 
  placeOrder, 
  clearCart, 
  systemSettings, 
  removeFromCart,
  addToCart // <--- YE ZAROORI HAI (+/- buttons ke liye)
} = store;// UPDATED: addOrder -> placeOrder
  
  // --- STATE ---
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  
  // Form State
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

  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // --- CALCULATIONS ---
  // --- MAINTENANCE CHECK ---
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
  
  // Admin Settings se values lein (Fallback: Default values)
  const taxRate = Number(systemSettings?.taxRate) || 0;
  const shippingThreshold = Number(systemSettings?.shippingThreshold) || 5000;
  const baseShipping = Number(systemSettings?.shippingCost) || 150;
  
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const isFreeShipping = subtotal >= shippingThreshold;
  const shipping = isFreeShipping ? 0 : baseShipping;
  
  const total = subtotal + taxAmount + shipping - discount;

  // --- HELPERS ---
  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 4000);
  };

  // --- EFFECTS ---
  
  // 1. Redirect if Cart Empty
  useEffect(() => {
      if (cart.length === 0 && step !== 3) {
          const timer = setTimeout(() => router.push('/'), 3000);
          return () => clearTimeout(timer);
      }
  }, [cart, router, step]);

  // 2. Sync User Data (Auto-Fill)
  useEffect(() => {
      if (currentUser) {
          // If user has saved addresses, pick the default or first one
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
              // Auto-fill from saved address or fallback
              address: savedAddr.text ? savedAddr.text.split(',')[0] : '', 
              city: 'Mumbai', // Placeholder as city isn't in simple address obj
              state: 'Maharashtra', // Placeholder
              pincode: savedAddr.pin || ''
          }));
      }
  }, [currentUser]);
// --- NEW: Quantity Handler ---
  const handleQuantityChange = (item: any, change: number) => {
      // Agar Qty 1 hai aur user '-' daba raha hai, to delete confirm karo
      if (item.qty === 1 && change === -1) {
          // Confirm aur remove
          if (confirm("Remove this item from cart?")) {
              removeFromCart(item.product.id);
          }
          return;
      }
      // Warna quantity update karo (+1 ya -1)
      addToCart(item.product, change);
  };
  // --- HANDLERS ---
  const handleApplyCoupon = () => {
      const coupon = coupons.find((c: any) => c.code === couponCode.toUpperCase());
      
      if (!coupon) {
          showToast('Invalid coupon code', 'error');
          return;
      }
      
      if (subtotal < coupon.minOrderValue) {
          showToast(`Minimum order value of ₹${coupon.minOrderValue} required`, 'error');
          return;
      }

      // Calculate Discount
      let discAmount = 0;
      if (coupon.type === 'percent') {
          discAmount = (subtotal * coupon.discount) / 100;
      } else {
          discAmount = coupon.discount;
      }

      setDiscount(discAmount);
      setAppliedCoupon(coupon.code);
      showToast(`Coupon '${coupon.code}' applied!`, 'success');
  };

  const handlePlaceOrder = async () => {
      // 1. Validation
      const finalEmail = formData.email?.trim().toLowerCase() || currentUser?.email?.trim().toLowerCase();
      
      if (!finalEmail) {
          showToast("Email address is required.", 'error');
          setStep(1);
          return;
      }
      if (!formData.firstName || !formData.address || !formData.pincode || !formData.phone) {
          showToast("Please fill all delivery details.", 'error');
          setStep(1);
          return;
      }

      // 2. Check for Store Function (Safe Check)
      // Note: We use 'placeOrder' now based on previous store updates
      const action = placeOrder || store.addOrder; 
      
      if (typeof action !== 'function') {
          console.error("Store action missing. Available:", Object.keys(store));
          showToast("System Error: Order function missing.", 'error');
          return;
      }

      setLoading(true);
      
      // Simulate Processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const orderDetails = {
          name: `${formData.firstName} ${formData.lastName}`,
          email: finalEmail,
          address: {
              street: formData.address,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              phone: formData.phone
          }
          // Note: Total, items etc are handled inside the store's placeOrder function based on cart state
      };

      try {
          // This calls the store function which saves to Firebase
          await action(orderDetails); 
          
          if (typeof clearCart === 'function') clearCart();
          
          setLoading(false);
          setStep(3); // Show Success
      } catch (error) {
          console.error("Order Failed:", error);
          showToast("Failed to place order. Try again.", 'error');
          setLoading(false);
      }
  };

  // --- RENDER EMPTY CART ---
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

  // --- RENDER SUCCESS ---
  if (step === 3) {
      return (
          <div className="min-h-screen bg-[#0a1f1c] flex items-center justify-center p-4 font-sans relative overflow-hidden">
              {/* Confetti / bg effect */}
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
        
        {/* Toast Notification */}
        <AnimatePresence>
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: FORMS */}
            <div className="lg:col-span-7 space-y-8">
                {/* Breadcrumb */}
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
                        
                        {/* Contact Info */}
                        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition duration-300">
                            <h3 className="font-bold text-sm uppercase tracking-widest mb-6 text-stone-400 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">1</span> 
                                Contact Info
                            </h3>
                            <div className="space-y-4">
                                <input 
                                    type="email" 
                                    placeholder="Email Address" 
                                    className="w-full p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id="newsletter" 
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-stone-300 bg-stone-100 transition-all checked:border-amber-500 checked:bg-amber-500 hover:bg-stone-200"
                                        />
                                        <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                                    </div>
                                    <label htmlFor="newsletter" className="text-sm text-stone-500 cursor-pointer select-none">Keep me updated on news and exclusive offers</label>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">2</span> 
                                    Shipping Address
                                </h3>
                                {currentUser && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                                        Auto-Filled
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input placeholder="First Name" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                                <input placeholder="Last Name" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-stone-300" />
                                    <input placeholder="Address (House No, Street, Area)" className="w-full p-4 pl-12 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <input placeholder="City" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                                    <input placeholder="State" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                                    <input placeholder="PIN Code" className="p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
                                </div>
                                <input placeholder="Phone Number (Important for Delivery)" className="w-full p-4 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-stone-400" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setStep(2)} className="bg-[#0a1f1c] text-white px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-amber-700 transition flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                                Continue to Payment <ArrowRight className="w-4 h-4"/>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* --- STEP 2: PAYMENT --- */}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        
                        {/* Review Block */}
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

                        {/* Payment Method */}
                        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center text-[10px]">3</span> 
                                    Select Payment
                                </h3>
                                <p className="text-xs text-stone-400 mt-2 ml-8 flex items-center gap-1"><Lock className="w-3 h-3"/> All transactions are secure and encrypted.</p>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {/* Razorpay Option */}
                                <label className={`relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'razorpay' ? 'border-amber-500 bg-amber-50/30' : 'border-stone-100 hover:border-stone-200'}`}>
                                    <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-amber-600 w-5 h-5" />
                                    <div className="flex-1">
                                        <p className="font-serif font-bold text-[#0a1f1c] text-lg">Online Payment</p>
                                        <p className="text-xs text-stone-500 mt-1">Razorpay / UPI / Credit & Debit Cards</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                    </div>
                                    {paymentMethod === 'razorpay' && <div className="absolute right-0 top-0 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase">Recommended</div>}
                                </label>

                                {/* COD Option */}
                                <label className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-50/30' : 'border-stone-100 hover:border-stone-200'}`}>
                                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-amber-600 w-5 h-5" />
                                    <div className="flex-1">
                                        <p className="font-serif font-bold text-[#0a1f1c] text-lg">Cash on Delivery (COD)</p>
                                        <p className="text-xs text-stone-500 mt-1">Pay physically when you receive your order.</p>
                                    </div>
                                    <Truck className="w-6 h-6 text-stone-300" />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <button onClick={() => setStep(1)} className="text-stone-400 hover:text-[#0a1f1c] flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition">
                                <ChevronLeft className="w-4 h-4"/> Back
                            </button>
                            <button 
                                onClick={handlePlaceOrder} 
                                disabled={loading} 
                                className="bg-[#0a1f1c] text-white px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-amber-700 transition flex items-center gap-3 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Processing...</> : `Pay ₹${total.toLocaleString()}`}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY (Sticky) */}
            <div className="lg:col-span-5">
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-2xl sticky top-32">
                    <h3 className="font-serif text-2xl mb-8 text-[#0a1f1c] border-b border-stone-100 pb-4">Order Summary</h3>
                    
                    {/* Items List (Updated with + / - Controls) */}
<div className="space-y-4 mb-8 max-h-80 overflow-y-auto custom-scrollbar pr-2">
    {cart.map((item: any) => (
        <div key={item.product.id} className="flex gap-4 group relative bg-stone-50 p-2 rounded-xl border border-transparent hover:border-amber-200 transition-all">
            
            {/* Delete Button (Hidden, shows on hover) */}
            <button 
                onClick={() => removeFromCart(item.product.id)}
                className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md z-20 hover:scale-110"
                title="Remove"
            >
                <X className="w-3 h-3" />
            </button>

            {/* Image */}
            <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
            </div>

            {/* Details & Controls */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="font-serif text-sm text-[#0a1f1c] leading-tight truncate pr-4">{item.product.name}</h4>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wide">{item.product.category}</p>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center bg-white border border-stone-200 rounded-md overflow-hidden h-6">
                        <button 
                            onClick={() => handleQuantityChange(item, -1)}
                            className="w-6 flex items-center justify-center hover:bg-stone-100 text-stone-500 text-xs font-bold"
                        >-</button>
                        <span className="w-6 text-center text-xs font-bold text-[#0a1f1c] bg-stone-50 h-full flex items-center justify-center">{item.qty}</span>
                        <button 
                            onClick={() => handleQuantityChange(item, 1)}
                            className="w-6 flex items-center justify-center hover:bg-stone-100 text-stone-500 text-xs font-bold"
                        >+</button>
                    </div>
                    <span className="text-[10px] text-stone-400">× ₹{item.product.price.toLocaleString()}</span>
                </div>
            </div>

            {/* Total Price */}
            <div className="flex flex-col justify-center text-right">
                <p className="font-bold text-sm text-amber-600">₹{(item.product.price * item.qty).toLocaleString()}</p>
            </div>
        </div>
    ))}
</div>

                    {/* Coupon Input */}
                    <div className="flex gap-2 mb-8">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="GIFT CARD OR CODE" 
                                className={`w-full p-4 bg-stone-50 border ${!appliedCoupon ? 'border-stone-200 focus:border-amber-500' : 'border-green-500'} rounded-xl outline-none uppercase font-bold text-xs tracking-widest transition`}
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon}
                            />
                            {appliedCoupon && <Check className="w-4 h-4 text-green-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                        </div>
                        <button 
                            onClick={handleApplyCoupon} 
                            disabled={!!appliedCoupon || !couponCode}
                            className={`px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition ${appliedCoupon ? 'bg-green-100 text-green-800' : 'bg-stone-800 text-white hover:bg-[#0a1f1c]'}`}
                        >
                            {appliedCoupon ? 'Applied' : 'Apply'}
                        </button>
                    </div>
                    {/* AVAILABLE COUPONS LIST */}
{coupons && coupons.length > 0 && !appliedCoupon && (
    <div className="mt-4 pt-4 border-t border-stone-100">
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 font-bold">Available Offers:</p>
        <div className="flex flex-wrap gap-2">
            {coupons.map((c: any) => (
                <button 
                    key={c.id} 
                    onClick={() => setCouponCode(c.code)}
                    className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-md font-bold uppercase hover:bg-amber-100 transition border-dashed"
                >
                    {c.code}
                </button>
            ))}
        </div>
    </div>
)}
                    {/* Totals */}
                    <div className="space-y-3 text-sm text-stone-500 pb-6 border-b border-stone-100">
    <div className="flex justify-between">
        <span>Subtotal</span>
        <span className="font-medium text-[#0a1f1c]">₹{subtotal.toLocaleString()}</span>
    </div>
    
    {/* TAX ROW ADDED */}
    {taxAmount > 0 && (
        <div className="flex justify-between">
            <span>Tax ({taxRate}%)</span>
            <span className="font-medium text-[#0a1f1c]">₹{taxAmount.toLocaleString()}</span>
        </div>
    )}

    <div className="flex justify-between">
        <span>Shipping</span>
        {/* ... baaki same ... */}
                            <span className="font-medium text-[#0a1f1c]">{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${shipping}`}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded-lg">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Ticket className="w-3 h-3"/> {appliedCoupon}</span>
                                <span className="font-bold">- ₹{discount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-end pt-6">
                        <span className="text-lg text-[#0a1f1c] font-serif">Total</span>
                        <div className="text-right">
                            <span className="text-[10px] text-stone-400 block mb-1 uppercase tracking-widest">Including Taxes</span>
                            <span className="text-3xl font-serif text-amber-600">₹{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-stone-400 bg-stone-50 p-3 rounded-lg">
                        <ShieldCheck className="w-3 h-3" />
                        Secure SSL Checkout powered by ZERIMI
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}