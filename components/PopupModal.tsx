"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store';

export default function PopupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { siteText } = useStore() as any;

  useEffect(() => {
    if (siteText && siteText.isPopupActive === false) return;
    const hasSeenPopup = sessionStorage.getItem('zerimi_popup_seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => setIsOpen(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [siteText]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('zerimi_popup_seen', 'true');
  };

  if (siteText?.isPopupActive === false) return null;

  const popupImage = siteText?.popupImage;
  const title = siteText?.popupTitle;
  const subText = siteText?.popupSub;
  const code = siteText?.popupCode;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-0"
        >
          {/* Dark Backdrop with Blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

          <motion.div 
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-[#050f0d] overflow-hidden shadow-2xl rounded-sm border border-[#d4af37]/30 flex flex-col md:flex-row max-h-[85vh] md:max-h-[600px]"
          >
            {/* Close Button (Floating) */}
            <button 
              onClick={handleClose} 
              className="absolute top-4 right-4 z-30 text-white/50 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-md border border-white/10"
            >
              <X size={20} />
            </button>

            {/* Left Side: Image (Mobile: Top Banner with Gradient Fade) */}
            <div className="relative w-full h-[40vh] md:h-auto md:w-1/2 shrink-0">
               {popupImage ? (
                 <>
                   <Image 
                     src={popupImage}
                     alt="Exclusive"
                     fill
                     className="object-cover"
                   />
                   {/* Gradient Overlay for Text Readability on Mobile & Style on Desktop */}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#050f0d] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#050f0d]/90" />
                 </>
               ) : (
                 <div className="w-full h-full bg-[#0a1f1c] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-64 h-64 bg-[#d4af37]/10 rounded-full blur-[100px]" />
                    <h2 className="font-serif text-4xl text-[#d4af37] z-10 tracking-[0.3em]">ZERIMI</h2>
                 </div>
               )}
            </div>

            {/* Right Side: Content */}
            <div className="relative w-full md:w-1/2 flex flex-col justify-center items-center text-center p-8 md:p-12 text-[#fffcf5]">
              
              {/* Background Glow Effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[80px] pointer-events-none" />

              {/* Top Tag */}
              <div className="flex items-center gap-2 mb-6">
                <div className="h-[1px] w-8 bg-[#d4af37]/50"></div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-[#d4af37] uppercase">
                  Royal Privilege
                </span>
                <div className="h-[1px] w-8 bg-[#d4af37]/50"></div>
              </div>
              
              {/* Title */}
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-4 leading-tight drop-shadow-lg">
                {title || <span className="italic font-light">Welcome</span>}
              </h2>
              
              {/* Subtext */}
              <p className="text-stone-300 text-xs md:text-sm mb-8 leading-6 tracking-wide font-light max-w-xs mx-auto">
                {subText || "Indulge in the finest craftsmanship. Join our exclusive circle for early access and rewards."}
              </p>
              
              {/* Coupon Code Section */}
              {code && (
                  <div className="relative group cursor-pointer mb-8 w-full max-w-[280px]">
                    {/* Fancy Border Box */}
                    <div className="absolute inset-0 border border-[#d4af37]/30 transform translate-x-1 translate-y-1 transition-transform group-hover:translate-x-0 group-hover:translate-y-0" />
                    <div className="relative bg-[#0a1f1c] border border-[#d4af37] py-3 px-6 flex items-center justify-center gap-3 shadow-lg">
                      <Sparkles size={16} className="text-[#d4af37]" />
                      <span className="font-mono text-xl tracking-[0.15em] text-[#fffcf5]">
                        {code}
                      </span>
                    </div>
                  </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col w-full gap-3 max-w-[280px]">
                <Link 
                  href="/category/all" 
                  onClick={handleClose}
                  className="bg-[#d4af37] text-[#050f0d] py-3.5 text-xs uppercase font-bold tracking-[0.2em] hover:bg-white transition duration-500 shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center"
                >
                  Claim Offer
                </Link>
                
                <button 
                  onClick={handleClose}
                  className="text-[10px] text-stone-500 hover:text-[#d4af37] transition-colors uppercase tracking-widest mt-2"
                >
                  No, I'll pay full price
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}