"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store'; // ✅ Store connect kiya

export default function PopupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { siteText } = useStore() as any; // ✅ Admin Data fetch kiya

  useEffect(() => {
    // 1. Agar Admin ne Popup OFF kar rakha hai, to mat dikhao
    // (Agar siteText abhi load nahi hua hai to wait karega)
    if (siteText && siteText.isPopupActive === false) return;

    // 2. Check karein user pehle dekh chuka hai ya nahi
    const hasSeenPopup = sessionStorage.getItem('zerimi_popup_seen');
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // 5 Second delay
      return () => clearTimeout(timer);
    }
  }, [siteText]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('zerimi_popup_seen', 'true');
  };

  // Agar Data load nahi hua ya Admin ne OFF kiya hai, to return null
  if (siteText?.isPopupActive === false) return null;

  // ✅ Fallback Values (Agar Admin mein data nahi dala to ye dikhega)
  // IMPORTANT: Yahan wo data aayega jo aapne Admin me dala hai
  const popupImage = siteText?.popupImage || "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1000&auto=format&fit=crop";
  const title = siteText?.popupTitle || "10% OFF";
  const subText = siteText?.popupSub || "Join the ZERIMI Privilege List and get a special discount.";
  const code = siteText?.popupCode || "WELCOME10";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 shadow-2xl overflow-hidden relative rounded-xl"
          >
            {/* Close Button */}
            <button 
              onClick={handleClose} 
              className="absolute top-3 right-3 z-20 bg-white/80 p-1 rounded-full text-stone-800 hover:bg-black hover:text-white transition"
            >
              <X size={20} />
            </button>

            {/* Left Side: Dynamic Image */}
            <div className="relative h-48 md:h-full w-full bg-stone-100">
               <Image 
                 src={popupImage}
                 alt="Exclusive Offer"
                 fill
                 className="object-cover"
               />
            </div>

            {/* Right Side: Dynamic Content */}
            <div className="p-8 md:p-12 flex flex-col justify-center text-center items-center bg-[#fffcf5]">
              <div className="mb-4 text-amber-600">
                <Gift size={32} />
              </div>
              <p className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">Exclusive Offer</p>
              
              {/* ✅ Dynamic Title from Admin */}
              <h2 className="text-3xl font-serif text-[#0a1f1c] mb-3">{title}</h2>
              
              {/* ✅ Dynamic Subtext */}
              <p className="text-stone-600 text-sm mb-6 leading-relaxed">
                {subText}
              </p>
              
              {/* ✅ Dynamic Coupon Code */}
              {code && (
                  <div className="bg-white border border-dashed border-amber-400 px-6 py-2 mb-6 font-mono text-lg font-bold text-[#0a1f1c] tracking-widest cursor-text select-all">
                    {code}
                  </div>
              )}

              <div className="flex flex-col w-full gap-3">
                <Link 
                  href="/category/all" 
                  onClick={handleClose}
                  className="w-full bg-[#0a1f1c] text-white py-3 text-xs uppercase font-bold tracking-widest hover:bg-amber-700 transition"
                >
                  Shop Now
                </Link>
                <button 
                  onClick={handleClose}
                  className="text-xs text-stone-400 hover:text-[#0a1f1c] underline"
                >
                  No thanks, I prefer full price
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}