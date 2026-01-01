"use client";

import { Bodoni_Moda, Lato } from "next/font/google";
import "./globals.css";
import GlobalLayout from "@/components/GlobalLayout";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Preloader from "@/components/Preloader";

const luxuryFont = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const bodyFont = Lato({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // ✅ CHECK: Refresh hai ya First Visit?
  useEffect(() => {
    if (sessionStorage.getItem("zerimi_visited")) {
      setIsFirstVisit(false); // Agar visited hai, toh Instant show karenge
      // Note: isLoading ko false hum Preloader ke callback se karenge
    }
  }, []);

  const handleAnimationFinish = () => {
    setIsLoading(false);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${luxuryFont.variable} ${bodyFont.variable} font-sans bg-[#fcfbf9]`}>
        
        {/* Preloader Component */}
        <AnimatePresence mode="wait">
          {isLoading && <Preloader onFinish={handleAnimationFinish} />}
        </AnimatePresence>

        {/* ✅ CONTENT VISIBILITY LOGIC */}
        <div 
          className={
            isLoading 
              ? "opacity-0 h-0 overflow-hidden" // Loading ke waqt hide
              : isFirstVisit 
                  ? "opacity-100 transition-opacity duration-1000" // First Time: Smooth Fade In
                  : "opacity-100" // Refresh: INSTANT SHOW (No Animation)
          }
        >
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
              style: { background: '#333', color: '#fff' },
            }}
          />

          <GlobalLayout>
            {children}
          </GlobalLayout>
        </div>

      </body>
    </html>
  );
}