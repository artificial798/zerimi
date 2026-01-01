"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Preloader({ onFinish }: { onFinish: () => void }) {
  const brandName = "ZERIMI".split("");
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Smart Check
    const hasVisited = sessionStorage.getItem("zerimi_visited");

    if (hasVisited) {
      setShouldRender(false);
      onFinish(); 
    } else {
      sessionStorage.setItem("zerimi_visited", "true");
      const exitTimer = setTimeout(() => {
        onFinish();
      }, 2500);
      return () => clearTimeout(exitTimer);
    }
  }, []);

  if (!shouldRender) return null;

  // --- Fixed Variants (Type Errors Removed) ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
    exit: {
      y: "-100%", 
      // 👇 FIX: 'as any' lagaya taaki TS error na de
      transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] as any }, 
    },
  };

  const letterVariants = {
    hidden: { y: 20, opacity: 0, filter: "blur(5px)" },
    show: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      // 👇 FIX: 'as any' lagaya
      transition: { duration: 0.8, ease: "easeOut" as any },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#051614] text-white"
    >
      <div className="absolute w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="flex overflow-hidden relative z-10">
        {brandName.map((letter, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 px-1"
          >
            {letter}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-4 text-[10px] md:text-xs text-amber-500/60 uppercase tracking-[0.4em] font-light"
      >
        Timeless Elegance
      </motion.p>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <motion.div
          className="h-full bg-amber-500 box-shadow-[0_0_15px_#f59e0b]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}