"use client";
import React from 'react';
import { useStore } from '@/lib/store';
import { Sparkles } from 'lucide-react';

export default function PremiumMarquee() {
  const { systemSettings } = useStore() as any;

  if (!systemSettings?.showNoticeBanner) return null;

  const text = (systemSettings.noticeBannerText || "Zerimi • The Art of Fine Jewelry").toUpperCase();

  const marqueeItem = (
    <div className="flex items-center shrink-0">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center mx-12 md:mx-20">
          
          {/* Subtle Champagne Dot */}
          <div className="w-[3px] h-[3px] rounded-full bg-[#E6BE8A]/60 shadow-[0_0_8px_#E6BE8A] mr-10"></div>
          
          {/* ✅ CHAMPAGNE GOLD TEXT: Pure Luxury */}
          <span className="text-[10px] md:text-[11px] font-medium tracking-[0.8em] text-[#E6BE8A] drop-shadow-sm leading-none">
            {text}
          </span>
          
          {/* Divider */}
          <div className="flex items-center ml-12 md:mx-20 opacity-30">
             <div className="h-[0.5px] w-12 bg-gradient-to-r from-transparent via-[#E6BE8A]/40 to-transparent"></div>
             <Sparkles className="w-3 h-3 text-[#E6BE8A] mx-4 animate-pulse" />
             <div className="h-[0.5px] w-12 bg-gradient-to-r from-transparent via-[#E6BE8A]/40 to-transparent"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full flex justify-center py-6 bg-transparent relative z-30">
      
      {/* ✅ BAR COLOR: Deep Obsidian with Glass Edge */}
      <div className="w-[96%] md:w-[85%] max-w-5xl h-10 md:h-11 relative overflow-hidden bg-[#0a0a0a] rounded-full border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center">
        
        {/* Subtle Inner Glow (Top Edge) */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6BE8A]/20 to-transparent"></div>
        
        {/* Cinematic Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>

        {/* Side Fade Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10 pointer-events-none"></div>

        <div className="flex flex-nowrap w-max overflow-hidden">
          <style jsx>{`
            @keyframes marquee-final {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .scroll-logic {
              display: flex;
              animation: marquee-final 55s linear infinite;
            }
          `}</style>

          <div className="scroll-logic">
            {marqueeItem}
            {marqueeItem}
          </div>
        </div>
      </div>
    </div>
  );
}