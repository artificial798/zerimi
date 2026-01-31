"use client";
import React from 'react';
import { AlertTriangle, CheckCircle, Truck, RefreshCcw, Video, XCircle, FileText } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="bg-[#0a1f1c] min-h-screen pt-32 pb-20 px-6 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16 border-b border-white/10 pb-10">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 block">Legal & Compliance</span>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4">Refund & Return Policy</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">Last Updated: January 2026</p>
        </div>

        <div className="space-y-12 leading-relaxed text-white/80">
          
          {/* 🚨 CRITICAL ALERT: 3-DAY RULE */}
          <div className="bg-red-500/10 border border-red-500/30 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start animate-fade-in-up">
            <div className="p-4 bg-red-500/20 rounded-xl shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-red-400 font-bold mb-2">Strict 3-Day Return Window</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                To maintain the exclusivity of our jewelry, ZERIMI enforces a strict return window. You must raise a return request within <strong>3 days (72 hours)</strong> of delivery. Requests made after this period will be <span className="text-red-400 underline decoration-red-500/30">automatically rejected</span> by our system.
              </p>
            </div>
          </div>

          {/* 1. ELIGIBILITY */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3 group-hover:text-amber-500 transition">
              <RefreshCcw className="w-6 h-6 text-amber-500" /> 1. Eligibility for Returns
            </h2>
            <p className="mb-4 text-white/60">
              We curate luxury with precision. Returns are accepted only under the following strict conditions:
            </p>
            <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">The item must be unused, unworn, and in the exact condition received.</span>
                </li>
                <li className="flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Must include original packaging, tags, certificates, and warranty cards intact.</span>
                </li>
                <li className="flex gap-3 items-start p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Video className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-200">
                        <strong>Mandatory Unboxing Video:</strong> To claim a return for damage, missing items, or wrong product, you MUST provide a 360-degree unboxing video without cuts or edits. Without this evidence, no claims will be entertained.
                    </span>
                </li>
            </ul>
          </section>

          {/* 2. SHIPPING COSTS (CUSTOMER PAYS) */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3 group-hover:text-amber-500 transition">
              <Truck className="w-6 h-6 text-amber-500" /> 2. Shipping Costs & Deductions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-wide">Forward Shipping</h4>
                    <p className="text-xs text-white/50">
                        The shipping cost paid during the initial order is <strong>non-refundable</strong>. Only the product value will be considered for refund.
                    </p>
                </div>
                <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-wide">Return Shipping</h4>
                    <p className="text-xs text-white/50">
                        Return shipping charges are to be borne by the customer. If ZERIMI arranges the reverse pickup, a deduction of <strong>₹150 - ₹250</strong> (depending on weight/location) will be made from the final refund amount.
                    </p>
                </div>
            </div>
          </section>

          {/* 3. NON-RETURNABLE ITEMS */}
          <section className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/30 transition duration-500 group">
            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3 group-hover:text-amber-500 transition">
              <XCircle className="w-6 h-6 text-amber-500" /> 3. Non-Returnable Items
            </h2>
            <p className="mb-4 text-white/60">The following categories are "Final Sale" and cannot be returned:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-white/70 marker:text-amber-500">
                <li>Customized, personalized, or engraved jewelry.</li>
                <li>Items purchased during a "Clearance Sale", "Flash Sale" or using special coupons.</li>
                <li>Nose pins (for hygiene reasons).</li>
                <li>Gift cards and vouchers.</li>
            </ul>
          </section>

          {/* 4. REFUND TIMELINE & LEGAL */}
          <section>
            <h2 className="font-serif text-2xl text-white mb-6">4. Refund Process & Jurisdiction</h2>
            <div className="space-y-4 text-sm text-white/60">
                <p>
                    Once your return reaches our warehouse (Baraut, UP), it undergoes a quality check (approx. 48 hours). If approved, the refund will be processed to your original payment method within <strong>7-10 business days</strong>.
                </p>
                <div className="p-4 border-l-2 border-amber-500 bg-amber-500/5 mt-4">
                    <p className="text-white/80 italic">
                        <strong>Legal Jurisdiction:</strong> Any dispute or claim arising out of or in connection with this website shall be subject to the exclusive jurisdiction of the courts located in <strong>Baghpat, Uttar Pradesh</strong>.
                    </p>
                </div>
            </div>
          </section>

          {/* Footer Contact */}
          <div className="pt-10 border-t border-white/10 text-center">
            <p className="text-sm text-white/40">Need help? Email us at <a href="mailto:support@zerimi.in" className="text-amber-500 hover:text-amber-400 transition">support@zerimi.in</a></p>
          </div>

        </div>
      </div>
    </div>
  );
}