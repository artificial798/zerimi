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

  // ESC key to close logic
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  }, []);

  useEffect(() => {
    if (!siteText) return;
    if (siteText.isPopupActive === true) {
      const hasSeenPopup = sessionStorage.getItem('zerimi_popup_seen');
      if (!hasSeenPopup) {
        setIsLoaded(true);
        // Premium Delay: 4.5 seconds
        const timer = setTimeout(() => {
          setIsOpen(true);
          window.addEventListener('keydown', handleKeyDown);
        }, 4500); 
        return () => {
          clearTimeout(timer);
          window.removeEventListener('keydown', handleKeyDown);
        };
      }
    }
  }, [siteText, handleKeyDown]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('zerimi_popup_seen', 'true');
    window.removeEventListener('keydown', handleKeyDown);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          {/* Backdrop with Blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Compact Modal Card */}
          <motion.div 
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-[400px] md:max-w-3xl bg-[#080808] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row"
          >
            {/* Close Icon */}
            <button 
              onClick={handleClose} 
              className="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-black/50 text-white/50 hover:text-white transition-colors border border-white/5"
            >
              <X size={18} />
            </button>

            {/* Image: Mobile par horizontal ya chhota rakha hai */}
            <div className="relative w-full h-[120px] md:h-auto md:w-[40%] shrink-0">
              {popupImage ? (
                <Image 
                  src={popupImage} 
                  alt="Special Offer" 
                  fill 
                  className="object-cover" 
                  priority 
                />
              ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center text-[#d4af37]/10 font-serif tracking-widest">ZERIMI</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-10 flex flex-col justify-center flex-1 min-w-0">
              <div className="space-y-4">
                <header>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-[1px] w-5 bg-[#d4af37]"></span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Royal Privilege</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-serif text-white leading-tight truncate">
                    {popupTitle || "Exclusive Gift"}
                  </h2>
                  <p className="text-stone-400 text-[11px] md:text-sm font-light mt-1 leading-relaxed line-clamp-2">
                    {popupSub || "Be the part of Zerimi World and unlock luxury."}
                  </p>
                </header>

                {/* Coupon Code: Compact Layout */}
                {popupCode && (
                  <div 
                    onClick={() => copyToClipboard(popupCode)}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-white/[0.06] transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-[7px] uppercase text-stone-500 tracking-widest">Tap to copy</span>
                      <span className="font-mono text-base md:text-lg text-[#d4af37] leading-none mt-1">{popupCode}</span>
                    </div>
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className="text-stone-600 group-hover:text-[#d4af37]" />
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2.5">
                  <Link 
                    href="/category/all" 
                    onClick={handleClose}
                    className="w-full bg-[#d4af37] text-black text-[11px] font-bold uppercase tracking-[0.2em] py-3.5 rounded-sm text-center flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Claim Offer <ArrowRight size={14} />
                  </Link>
                  <button 
                    onClick={handleClose} 
                    className="text-[9px] text-stone-600 hover:text-stone-400 uppercase tracking-[0.2em] transition-colors"
                  >
                    No thanks, I'll pay full price
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}