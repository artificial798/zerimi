"use client";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

export default function Preloader({ onFinish }: { onFinish: () => void }) {
  const brandName = "ZERIMI".split("");
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("zerimi_visited");

    if (hasVisited) {
      setShouldRender(false);
      onFinish();
    } else {
      sessionStorage.setItem("zerimi_visited", "true");
      // थोड़ा जल्दी खत्म करेंगे ताकि यूजर बोर न हो
      const exitTimer = setTimeout(() => {
        onFinish();
      }, 2000); 
      return () => clearTimeout(exitTimer);
    }
  }, []);

  if (!shouldRender) return null;

  // --- Ultra Smooth Easing (Bezier Curve) ---
  // यह curve एनीमेशन को बहुत ही नेचुरल और प्रीमियम फील देता है
  const smoothEase = [0.43, 0.13, 0.23, 0.96]; 

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08, // थोड़ा तेज किया ताकि स्नैपी लगे
        delayChildren: 0.1 
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1, // जाते समय थोड़ा बड़ा होगा (Cinematic fade out)
      filter: "blur(10px)",
      transition: { 
        duration: 0.8, 
        ease: "easeInOut" as any 
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { 
      y: 40, // नीचे से ऊपर आएगा
      opacity: 0, 
      rotateX: -90 // 3D Flip effect (Optional: हटा सकते हैं अगर भारी लगे)
    },
    show: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: { 
        duration: 0.8, 
        ease: smoothEase as any 
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#051614] text-white overflow-hidden"
    >
      {/* Background Glow - Static (No Animation to save GPU) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-600/20 rounded-full blur-[100px] pointer-events-none opacity-60"></div>

      {/* Brand Name */}
      <div className="flex relative z-10 perspective-1000"> 
        {brandName.map((letter, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            // `will-change-transform` browser ko ready rakhta hai
            className="text-5xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600 px-1 will-change-transform"
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
        className="mt-6 text-[10px] md:text-sm text-amber-500/80 uppercase tracking-[0.5em] font-light"
      >
        Timeless Elegance
      </motion.p>

      {/* Progress Line - GPU Optimized (ScaleX instead of Width) */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <motion.div
          className="h-full bg-amber-500 box-shadow-[0_0_20px_#f59e0b]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.0, ease: "easeInOut" }}
          style={{ transformOrigin: "left" }} // Left se right fill hoga
        />
      </div>
    </motion.div>
  );
}