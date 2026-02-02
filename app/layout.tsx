"use client";

import { Playfair_Display, Jost } from "next/font/google"; 
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
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ FIX: Default false rakha taaki Crawler/Lighthouse ko content turant dikhe
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Logic Same hai: Check karega agar pehli baar aaya hai toh Preloader chalayega
    const visited = sessionStorage.getItem("zerimi_visited");
    if (!visited) {
      setIsLoading(true);
      setIsFirstVisit(true);
    }
  }, []);

  const handleAnimationFinish = () => {
    setIsLoading(false);
    sessionStorage.setItem("zerimi_visited", "true");
  };

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <title>Zerimi Luxury | The Pinnacle of Premium Jewellery</title>
        <meta name="description" content="Premium luxury brand Zerimi offering exclusive perfumes and jewellery." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body 
        className={`${luxuryFont.variable} ${bodyFont.variable} font-sans bg-[#ffffff] text-[#1c1917] antialiased selection:bg-rose-200 selection:text-rose-900`}
      >
        <AnimatePresence mode="wait">
          {isLoading && <Preloader onFinish={handleAnimationFinish} />}
        </AnimatePresence>

        <motion.div 
          // Logic Same: Pehli visit par opacity 0 se start hoga
          initial={isFirstVisit ? { opacity: 0 } : { opacity: 1 }}
          animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          // ✅ CRITICAL FIX: 'h-0 overflow-hidden' hata diya. 
          // Ab page DOM mein exist karega (LCP fix) par visually hidden rahega (Opacity 0).
          className="min-h-screen relative"
        >
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: { 
                background: 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(10px)',
                color: '#be123c', 
                border: '1px solid #fecdd3', 
                borderRadius: '9999px', 
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                boxShadow: '0 4px 20px rgba(244, 63, 94, 0.15)' 
              },
              success: {
                iconTheme: {
                  primary: '#e11d48', 
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