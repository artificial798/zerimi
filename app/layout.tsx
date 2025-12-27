import type { Metadata } from "next";
// ✅ 1. Import "Bodoni Moda" (High Fashion) and "Lato"
import { Bodoni_Moda, Lato } from "next/font/google";
import "./globals.css";
import GlobalLayout from "@/components/GlobalLayout";
import { Toaster } from "react-hot-toast";

// ✅ 2. Setup "Bodoni Moda" (Vogue/Gucci Style Headings)
// Iska variable name '--font-serif' hi rakhenge
const luxuryFont = Bodoni_Moda({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"], 
  display: "swap",
});

// ✅ 3. Setup "Lato" (Clean & Premium Body Text)
// Iska variable name '--font-sans' hi rakhenge
const bodyFont = Lato({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZERIMI | Premium Jewelry",
  description: "Luxury artificial jewelry store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${luxuryFont.variable} ${bodyFont.variable} font-sans bg-[#fcfbf9]`}>
        
       <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 3000, // 3 second mein auto-close
            style: {
              background: '#333',
              color: '#fff',
            },
            // Mobile fix: Touch karne par timer rukna nahi chahiye
            className: '',
          }}
        />

        <GlobalLayout>
          {children}
        </GlobalLayout>
      </body>
    </html>
  );
}