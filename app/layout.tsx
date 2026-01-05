"use client";

import { Playfair_Display, Jost } from "next/font/google"; // ✅ New Luxury Fonts
import "./globals.css";
import GlobalLayout from "@/components/GlobalLayout";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion"; 
import Preloader from "@/components/Preloader";

// ✅ 1. FEMALE CENTRIC SERIF FONT (Headings)
const luxuryFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ✅ 2. CLEAN SANS FONT (Body Text)
const bodyFont = Jost({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"], // 500/600 added for bold accents
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("zerimi_visited")) {
      setIsFirstVisit(false);
    }
  }, []);

  const handleAnimationFinish = () => {
    setIsLoading(false);
    sessionStorage.setItem("zerimi_visited", "true");
  };

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body 
        // ✅ CHANGED: Selection color to Rose-200 and Text Rose-900
        className={`${luxuryFont.variable} ${bodyFont.variable} font-sans bg-[#ffffff] text-[#1c1917] antialiased selection:bg-rose-200 selection:text-rose-900`}
      >
        <AnimatePresence mode="wait">
          {isLoading && <Preloader onFinish={handleAnimationFinish} />}
        </AnimatePresence>

        <motion.div 
          initial={isFirstVisit ? { opacity: 0 } : { opacity: 1 }}
          animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className={isLoading ? "h-0 overflow-hidden" : "min-h-screen"}
        >
          {/* ✅ UPDATED: Toaster to Rose Gold Theme */}
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: { 
                background: 'rgba(255, 255, 255, 0.9)', // Glass effect
                backdropFilter: 'blur(10px)',
                color: '#be123c', // Deep Rose text
                border: '1px solid #fecdd3', // Soft Pink Border
                borderRadius: '9999px', // Fully Rounded (Pill shape) is more feminine
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                boxShadow: '0 4px 20px rgba(244, 63, 94, 0.15)' // Pink Glow
              },
              success: {
                iconTheme: {
                  primary: '#e11d48', // Rose icon
                  secondary: '#fff',
                },
              },
            }}
          />

          <GlobalLayout>
            <main className="relative overflow-x-hidden">
              {children}
            </main>
          </GlobalLayout>

        </motion.div>
      </body>
    </html>
  );
}