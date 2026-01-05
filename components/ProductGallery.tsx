"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Auto-Scroll Logic (Sirf Mobile Slider ke liye kaam karega)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      // Mobile view me hi auto scroll visible hoga
      if (window.innerWidth < 768) {
        nextSlide();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, isHovered]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="w-full">
      
      {/* =========================================================
          📱 MOBILE VIEW: SLIDER + THUMBNAILS (Visible only on Mobile)
          (Logic wahi purana hai, bas md:hidden laga diya)
      ========================================================== */}
      <div 
        className="md:hidden flex flex-col gap-3"
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
          {/* Main Slider Image */}
          <div className="relative aspect-[4/5] bg-stone-50 rounded-lg overflow-hidden border border-stone-100 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full relative"
              >
                 <Image 
                   src={images[currentIndex]} 
                   alt="Product Image" 
                   fill 
                   className="object-cover"
                 />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
               <ChevronLeft className="w-4 h-4 text-[#0a1f1c]" />
            </button>
            <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
               <ChevronRight className="w-4 h-4 text-[#0a1f1c]" />
            </button>

            {/* Counter Badge */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
               {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails (Horizontal Scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border transition-all ${
                  currentIndex === idx ? "border-[#0a1f1c] opacity-100" : "border-transparent opacity-60"
                }`}
              >
                <Image src={img} alt="thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
      </div>


      {/* =========================================================
          💻 DESKTOP VIEW: NIKE STYLE GRID (Visible only on PC/Laptop)
          (Saari photos open rahengi 2-Column Grid mein)
      ========================================================== */}
      <div className="hidden md:grid grid-cols-2 gap-2 w-full">
          {images.map((img, idx) => (
             <div 
               key={idx}
               // Logic: Har 3rd image ko hum bada (full width) dikha sakte hain for 'Luxury Magazine' feel
               // ya simple rakhne ke liye sabko barabar. Yahan maine standard grid rakha hai taaki pixel na fate.
               className={`relative bg-stone-50 cursor-zoom-in group overflow-hidden rounded-lg border border-stone-100 ${
                  /* Agar last image hai aur odd number hai, to usse center/full span karo */
                  (idx === images.length - 1 && images.length % 2 !== 0) ? 'col-span-2 aspect-[16/10]' : 'col-span-1 aspect-[4/5]'
               }`} 
             >
                <Image 
                    src={img} 
                    alt={`Product View ${idx + 1}`} 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                
                {/* Optional: Hover par number dikhana */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-sm">
                    View {idx + 1}
                </div>
             </div>
          ))}
      </div>

    </div>
  );
}