"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store';

export default function PopupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { siteText } = useStore() as any;

  // Logic: 100% Same as before
  useEffect(() => {
    if (!siteText) return;

    if (siteText.isPopupActive === true) {
      const hasSeenPopup = sessionStorage.getItem('zerimi_popup_seen');
      
      if (!hasSeenPopup) {
        setIsLoaded(true);
        // Premium Delay: 5 seconds for better UX
        const timer = setTimeout(() => setIsOpen(true), 5000); 
        return () => clearTimeout(timer);
      }
    }
  }, [siteText]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('zerimi_popup_seen', 'true');
  };

  const copyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded || !isOpen || !siteText) return null;

  const { popupImage, popupTitle, popupSub, popupCode } = siteText;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 md:p-6"
        >
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

          {/* Compact Luxury Card */}
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[400px] md:max-w-3xl bg-[#050505] rounded-[2rem] md:rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col md:flex-row"
          >
            {/* Close Trigger */}
            <button 
              onClick={handleClose} 
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white/40 hover:text-[#d4af37] transition-all border border-white/5"
            >
              <X size={18} />
            </button>

            {/* Visual Part (Smaller on Mobile) */}
            <div className="relative w-full h-[150px] md:h-auto md:w-[42%] shrink-0">
               {popupImage ? (
                 <Image src={popupImage} alt="Zerimi Offer" fill className="object-cover" priority />
               ) : (
                 <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
                    <span className="font-serif text-xl text-[#d4af37]/20 tracking-widest">ZERIMI</span>
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#050505]" />
            </div>

            {/* Messaging Part */}
            <div className="p-7 md:p-12 flex flex-col justify-center flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[1px] w-5 bg-[#d4af37]"></div>
                <span className="text-[9px] font-bold tracking-[0.3em] text-[#d4af37] uppercase">Privilege Access</span>
              </div>

              <h2 className="text-2xl md:text-4xl font-serif text-white mb-2 tracking-tight">
                {popupTitle || "A Token of Luxury"}
              </h2>

              <p className="text-stone-400 text-xs md:text-sm mb-6 font-light leading-relaxed">
                {popupSub || "Join the world of Zerimi and discover unparalleled craftsmanship."}
              </p>

              {/* Code Box */}
              {popupCode && (
                <div 
                  onClick={() => copyCode(popupCode)}
                  className="group flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg p-3.5 mb-6 cursor-pointer hover:border-[#d4af37]/40 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[8px] text-stone-500 uppercase tracking-widest mb-0.5">Click to copy code</span>
                    <span className="font-mono text-lg text-[#d4af37] tracking-wider">{popupCode}</span>
                  </div>
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={16} className="text-stone-600 group-hover:text-[#d4af37]" />}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Link 
                  href="/category/all" 
                  onClick={handleClose}
                  className="w-full bg-[#d4af37] text-black text-[11px] font-bold uppercase tracking-[0.2em] py-4 rounded-sm text-center flex items-center justify-center gap-2 hover:bg-[#e5c158] transition-all active:scale-[0.98]"
                >
                  Shop Collection <ArrowRight size={14} />
                </Link>
                <button onClick={handleClose} className="text-[9px] text-stone-600 hover:text-stone-300 uppercase tracking-widest pt-1 transition-colors">
                  Continue Browsing
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}