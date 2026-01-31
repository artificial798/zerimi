"use client";
import React from 'react';
import { Lock, Eye, Server, ShieldCheck, Globe, Database, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="bg-[#0a1f1c] min-h-screen pt-32 pb-20 px-6 font-sans text-white">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-10">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 block">Data Protection</span>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4">Privacy Policy</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">Last Updated: January 2026</p>
        </div>

        <div className="space-y-10 leading-relaxed text-white/80">

          {/* 1. INFO COLLECTION */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3 group-hover:text-amber-500 transition">
              <Database className="w-6 h-6 text-amber-500" /> 1. Information We Collect
            </h2>
            <p className="text-sm text-white/60 mb-4">
              When you visit ZERIMI, we automatically collect certain information about your device. Additionally, when you make a purchase, we collect specific personal data to fulfill your order:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <h4 className="text-white font-bold text-xs uppercase mb-2">Personal Identifiers</h4>
                    <p className="text-xs text-white/50">Full Name, Email Address, Phone Number.</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <h4 className="text-white font-bold text-xs uppercase mb-2">Transactional Data</h4>
                    <p className="text-xs text-white/50">Billing Address, Shipping Address, Payment Confirmation (We do not store raw card details).</p>
                </div>
            </div>
          </section>

          {/* 2. USAGE */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3 group-hover:text-amber-500 transition">
              <Server className="w-6 h-6 text-amber-500" /> 2. How We Use Your Data
            </h2>
            <ul className="space-y-3 text-sm text-white/60">
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                    <span>To process and fulfill your orders, including sending emails/invoices.</span>
                </li>
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                    <span>To screen our orders for potential risk or fraud.</span>
                </li>
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                    <span>To provide you with information or advertising relating to our products (only if opted in).</span>
                </li>
            </ul>
          </section>

          {/* 3. SECURITY */}
          <section className="bg-gradient-to-br from-green-900/20 to-black p-8 rounded-3xl border border-green-500/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <h2 className="font-serif text-2xl text-white mb-4 flex items-center gap-3 relative z-10">
              <ShieldCheck className="w-6 h-6 text-green-400" /> 3. Data Security
            </h2>
            <p className="text-sm text-white/70 relative z-10 leading-relaxed">
              We implement industry-standard security measures. Your payment information is encrypted using <strong>Secure Socket Layer technology (SSL)</strong> and stored with AES-256 encryption. We partner with top-tier gateways (Razorpay/PayU) to ensure your financial data never touches our servers directly.
            </p>
          </section>

          {/* 4. THIRD PARTY */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3 group-hover:text-amber-500 transition">
              <Globe className="w-6 h-6 text-amber-500" /> 4. Third-Party Disclosure
            </h2>
            <p className="text-sm text-white/60 mb-4">
              We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or serving our users:
            </p>
            <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70 border border-white/10">Logistics Partners (Shiprocket)</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70 border border-white/10">Payment Gateways</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70 border border-white/10">Google Analytics</span>
            </div>
          </section>

          {/* Footer Contact */}
          <div className="pt-10 border-t border-white/10 text-center">
            <p className="text-sm text-white/40 mb-2">For privacy-related concerns, please contact our Data Protection Officer at:</p>
            <a href="mailto:privacy@zerimi.com" className="text-lg font-serif text-amber-500 hover:text-white transition">support@zerimi.in</a>
          </div>

        </div>
      </div>
    </div>
  );
}