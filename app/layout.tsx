import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import GlobalLayout from "@/components/GlobalLayout";
import { Toaster } from "react-hot-toast";

// Fonts Setup
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
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
    // 'suppressHydrationWarning' zaroori hai extensions error rokne ke liye
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} font-sans bg-[#fcfbf9]`}>
        
        {/* ✅ Toast Notifications System */}
        <Toaster position="top-center" reverseOrder={false} />

        {/* ✅ Global Layout (Navbar + Footer) */}
        {/* Yahan currentUser pass nahi karna hai, GlobalLayout khud handle karega */}
        <GlobalLayout>
          {children}
        </GlobalLayout>
      </body>
    </html>
  );
}