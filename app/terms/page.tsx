"use client";
import React from 'react';
import { Shield, Scale, FileText, Lock, AlertOctagon, Gavel } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="bg-[#0a1f1c] min-h-screen pt-32 pb-20 px-6 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-10">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 block">Legal Agreement</span>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4">Terms of Service</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">Last Updated: January 2026</p>
        </div>

        <div className="space-y-10 leading-relaxed text-white/80">
          
          {/* 1. OVERVIEW */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-4 flex items-center gap-3 group-hover:text-amber-500 transition">
              <FileText className="w-6 h-6 text-amber-500" /> 1. Overview
            </h2>
            <p className="text-sm text-white/60">
              This website is operated by <strong>ZERIMI</strong>. By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions. These Terms apply to all users of the site, including browsers, vendors, customers, merchants, and contributors of content.
            </p>
          </section>

          {/* 2. INTELLECTUAL PROPERTY */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-4 flex items-center gap-3 group-hover:text-amber-500 transition">
              <Lock className="w-6 h-6 text-amber-500" /> 2. Intellectual Property
            </h2>
            <p className="text-sm text-white/60 mb-3">
              All content on this website, including jewelry designs, images, logos, text, and graphics, is the exclusive property of <strong>ZERIMI</strong> and is protected by Indian and international copyright laws.
            </p>
            <div className="p-4 bg-red-500/10 border-l-2 border-red-500 rounded-r-xl">
              <p className="text-xs text-red-200">
                <strong>Strict Warning:</strong> Unauthorized use, reproduction, or distribution of our content is strictly prohibited and will result in immediate legal action.
              </p>
            </div>
          </section>

          {/* 3. PRODUCTS & PRICING */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-4 flex items-center gap-3 group-hover:text-amber-500 transition">
              <AlertOctagon className="w-6 h-6 text-amber-500" /> 3. Accuracy & Modifications
            </h2>
            <ul className="space-y-3 text-sm text-white/60">
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                    <span>We strive to display product colors and images accurately. However, we cannot guarantee that your monitor's display will be 100% accurate.</span>
                </li>
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                    <span>Prices for our products are subject to change without notice. We reserve the right to modify or discontinue any product at any time.</span>
                </li>
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                    <span>We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we may attempt to notify you via email/phone.</span>
                </li>
            </ul>
          </section>

          {/* 4. LIMITATION OF LIABILITY */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-4 flex items-center gap-3 group-hover:text-amber-500 transition">
              <Shield className="w-6 h-6 text-amber-500" /> 4. Limitation of Liability
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              In no case shall ZERIMI, our directors, officers, employees, affiliates, agents, contractors, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, strictly to the extent permitted by law.
            </p>
          </section>

          {/* 5. GOVERNING LAW (JURISDICTION) - CRITICAL */}
          <section className="bg-gradient-to-br from-amber-900/20 to-black p-8 rounded-3xl border border-amber-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            <h2 className="font-serif text-2xl text-white mb-4 flex items-center gap-3 relative z-10">
               <Gavel className="w-6 h-6 text-amber-500" /> 5. Governing Law & Jurisdiction
            </h2>
            
            <div className="space-y-4 text-sm text-white/80 relative z-10">
                <p>
                  These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of <strong>India</strong>.
                </p>
                <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                    <p className="italic text-amber-100">
                        "Any dispute or claim arising out of or in connection with this website, products, or services shall be subject to the <strong>exclusive jurisdiction of the courts located in Baghpat, Uttar Pradesh</strong>."
                    </p>
                </div>
            </div>
          </section>

          {/* Contact Footer */}
          <div className="pt-10 border-t border-white/10 text-center">
            <p className="text-sm text-white/40 mb-2">Questions about the Terms of Service should be sent to us at:</p>
            <a href="mailto:legal@zerimi.com" className="text-lg font-serif text-amber-500 hover:text-white transition">legal@zerimi.com</a>
          </div>

        </div>
      </div>
    </div>
  );
}