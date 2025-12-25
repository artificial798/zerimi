"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export default function ProductGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Auto-Scroll Logic (Har 4 second mein change hoga, agar mouse upar nahi hai)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, isHovered]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full space-y-4" 
         onMouseEnter={() => setIsHovered(true)} 
         onMouseLeave={() => setIsHovered(false)}>
      
      {/* --- MAIN IMAGE DISPLAY --- */}
      <div className="relative aspect-square md:aspect-[4/5] bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 group">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full relative"
          >
             {/* ✅ ZOOM EFFECT ON HOVER */}
             <div className="w-full h-full overflow-hidden cursor-zoom-in">
                <Image 
                  src={images[currentIndex]} 
                  alt="Product Image" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-125"
                />
             </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (Visible on Hover) */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-white shadow-lg">
           <ChevronLeft className="w-5 h-5 text-[#0a1f1c]" />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-white shadow-lg">
           <ChevronRight className="w-5 h-5 text-[#0a1f1c]" />
        </button>

        {/* Image Counter Badge */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">
           {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* --- THUMBNAILS --- */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
              currentIndex === idx ? "border-[#0a1f1c] opacity-100 scale-105" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image src={img} alt="Thumbnail" fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}