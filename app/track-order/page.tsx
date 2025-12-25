"use client";
import { useState } from 'react';
import { useStore, Order } from '@/lib/store';
import { Search, Package, CheckCircle, Clock, Truck, XCircle, ArrowRight, MapPin, Phone, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackOrderPage() {
  const { orders } = useStore();
  const [orderId, setOrderId] = useState('');
  const [searchResult, setSearchResult] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setHasSearched(false);
    setSearchResult(null);
    setError('');

    // Simulate Premium Loading Delay
    setTimeout(() => {
      const foundOrder = orders.find(
        (o) => o.id.toLowerCase() === orderId.toLowerCase()
      );

      if (foundOrder) {
        setSearchResult(foundOrder);
      } else {
        setError("We couldn't locate this order. Please check your Order ID.");
      }
      
      setHasSearched(true);
      setLoading(false);
    }, 1500);
  };

  // Status Logic
  const getStatusStep = (status: string) => {
    const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    if (status === 'Cancelled') return -1;
    if (status.includes('Return')) return 5;
    return steps.indexOf(status);
  };

  const currentStep = searchResult ? getStatusStep(searchResult.status) : 0;

  return (
    <div className="min-h-screen bg-[#fcfbf9] pt-32 pb-20 relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0a1f1c]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* HEADER */}
        <div className="text-center mb-16 animate-fade-in-up">
           <span className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Client Services</span>
           <h1 className="font-serif text-4xl md:text-5xl text-[#0a1f1c] mb-6">Track Your Treasure</h1>
           <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
             Enter your Order ID found in your confirmation email to follow your ZERIMI piece's journey to you.
           </p>
        </div>

        {/* SEARCH BOX (Elevated Design) */}
        <div className="bg-white p-2 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-stone-100 mb-12 max-w-2xl mx-auto relative z-10">
           <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-600 transition">
                    <Package className="w-5 h-5" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Enter Order ID (e.g. ORD-123456)" 
                   className="w-full h-14 pl-14 pr-4 bg-transparent rounded-xl outline-none text-[#0a1f1c] placeholder:text-stone-400 font-medium transition"
                   value={orderId}
                   onChange={(e) => setOrderId(e.target.value)}
                 />
              </div>
              <button 
                type="submit" 
                disabled={loading || !orderId}
                className="h-14 px-8 bg-[#0a1f1c] text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-amber-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                 {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : (
                    <>Track Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></>
                 )}
              </button>
           </form>
        </div>

        {/* RESULTS AREA */}
        <AnimatePresence mode='wait'>
            
            {/* ERROR STATE */}
            {hasSearched && error && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                 className="max-w-xl mx-auto text-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm"
               >
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
                      <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-serif text-[#0a1f1c] mb-2">Order Not Found</h3>
                  <p className="text-stone-500 text-sm px-8">{error}</p>
               </motion.div>
            )}

            {/* SUCCESS STATE */}
            {searchResult && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-stone-100"
               >
                  
                  {/* TOP BANNER */}
                  <div className="bg-[#0a1f1c] p-8 md:p-10 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
                     
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                               <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest border border-white/10">
                                  Order #{searchResult.id}
                               </span>
                               <span className="text-white/40 text-xs">Placed on {searchResult.date}</span>
                           </div>
                           <h2 className="text-3xl font-serif text-amber-50">
                              {searchResult.status === 'Delivered' ? 'Arrived & Completed' : `Current Status: ${searchResult.status}`}
                           </h2>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Estimated Arrival</p>
                            <p className="text-lg font-bold">
                                {searchResult.status === 'Delivered' ? 'Delivered' : 'Within 3-5 Business Days'}
                            </p>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 md:p-10">
                     
                     {/* PROGRESS TIMELINE */}
                     {currentStep >= 0 && currentStep < 5 && (
                        <div className="mb-12 relative">
                           <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-100 -translate-y-1/2 rounded-full"></div>
                           <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${(currentStep / 3) * 100}%` }} 
                                transition={{ duration: 1, delay: 0.2 }}
                                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#0a1f1c] to-amber-600 -translate-y-1/2 rounded-full"
                           ></motion.div>

                           <div className="relative flex justify-between">
                              {['Ordered', 'Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                                 const isCompleted = idx <= currentStep;
                                 return (
                                    <div key={step} className="flex flex-col items-center gap-3 relative">
                                       <motion.div 
                                          initial={{ scale: 0.8, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          transition={{ delay: idx * 0.2 }}
                                          className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 bg-white z-10 ${
                                             isCompleted ? 'border-amber-600 text-amber-600 shadow-lg' : 'border-stone-200 text-stone-300'
                                          }`}
                                       >
                                          {idx === 0 ? <Package className="w-4 h-4"/> : 
                                           idx === 1 ? <Clock className="w-4 h-4"/> : 
                                           idx === 2 ? <Truck className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                                       </motion.div>
                                       <span className={`absolute top-12 text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-[#0a1f1c]' : 'text-stone-300'}`}>
                                          {step}
                                       </span>
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     )}

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-stone-100 pt-10">
                        
                        {/* LEFT: ITEMS */}
                        <div className="lg:col-span-2">
                           <h3 className="font-serif text-xl text-[#0a1f1c] mb-6">Package Contents</h3>
                           <div className="space-y-6">
                              {searchResult.items.map((item, idx) => (
                                 <div key={idx} className="flex gap-6 group">
                                    <div className="w-20 h-24 bg-stone-50 rounded-lg overflow-hidden relative border border-stone-100 group-hover:border-amber-200 transition">
                                       <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 py-1">
                                       <h4 className="font-serif text-lg text-[#0a1f1c]">{item.name}</h4>
                                       <p className="text-xs text-stone-500 mt-1 uppercase tracking-wide">
                                           Size: {item.size || 'Standard'} • Qty: {item.qty}
                                       </p>
                                       <p className="text-sm font-bold text-amber-600 mt-2">₹{item.price.toLocaleString()}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* RIGHT: DETAILS */}
                        <div className="space-y-8">
                           <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                               <h4 className="text-xs font-bold text-[#0a1f1c] uppercase mb-4 flex items-center gap-2">
                                   <MapPin className="w-4 h-4 text-amber-600"/> Shipping Address
                               </h4>
                               <p className="text-sm text-stone-600 leading-relaxed">
                                   {searchResult.address.street}<br/>
                                   {searchResult.address.city}, {searchResult.address.state}<br/>
                                   {searchResult.address.pincode}<br/>
                                   IN
                               </p>
                           </div>

                           <div className="bg-[#0a1f1c]/5 p-6 rounded-2xl border border-[#0a1f1c]/10">
                               <h4 className="text-xs font-bold text-[#0a1f1c] uppercase mb-4">Payment Summary</h4>
                               <div className="flex justify-between text-sm mb-2 text-stone-600">
                                   <span>Subtotal</span>
                                   <span>₹{searchResult.subtotal.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between text-sm mb-4 text-stone-600">
                                   <span>Tax & Shipping</span>
                                   <span>₹{searchResult.tax.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between text-lg font-serif text-[#0a1f1c] pt-4 border-t border-stone-200">
                                   <span>Total Paid</span>
                                   <span>₹{searchResult.total.toLocaleString()}</span>
                               </div>
                           </div>
                        </div>

                     </div>

                  </div>
               </motion.div>
            )}

            {/* CONTACT HELP */}
            <div className="mt-16 text-center border-t border-stone-200 pt-10">
               <p className="text-stone-500 text-sm mb-4">Having trouble with your order?</p>
               <div className="flex justify-center gap-6">
                   <a href="mailto:support@zerimi.com" className="flex items-center gap-2 text-xs font-bold uppercase text-[#0a1f1c] hover:text-amber-600 transition">
                       <Mail className="w-4 h-4"/> Email Concierge
                   </a>
                   <a href="/contact" className="flex items-center gap-2 text-xs font-bold uppercase text-[#0a1f1c] hover:text-amber-600 transition">
                       <Phone className="w-4 h-4"/> Contact Support
                   </a>
               </div>
            </div>

        </AnimatePresence>

      </div>
    </div>
  );
}