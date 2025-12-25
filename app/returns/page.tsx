import React from 'react';
import { ShieldCheck, Video, Clock } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-stone-100">
        <h1 className="font-serif text-4xl text-[#0a1f1c] mb-6">Return & Refund Policy</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-stone-50 p-4 rounded-xl text-center">
                <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="font-bold text-[#0a1f1c]">7-Day Policy</h3>
                <p className="text-xs text-stone-500">Easy returns within 7 days of delivery.</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl text-center">
                <Video className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="font-bold text-[#0a1f1c]">Unboxing Video</h3>
                <p className="text-xs text-stone-500">Mandatory for damage claims.</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl text-center">
                <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="font-bold text-[#0a1f1c]">Original Condition</h3>
                <p className="text-xs text-stone-500">Tags must be intact.</p>
            </div>
        </div>

        <div className="space-y-8 text-stone-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">Eligibility for Returns</h2>
            <p>
              To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging with all tags intact.
              Customized or personalized jewelry items are not eligible for return unless defective.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">The Refund Process</h2>
            <ol className="list-decimal pl-5 space-y-2">
                <li>Initiate a return from your Dashboard under "My Orders".</li>
                <li>Our courier partner will pick up the product within 2-3 business days.</li>
                <li>Once received, our quality team will inspect the item (usually takes 48 hours).</li>
                <li>If approved, the refund will be processed to your original payment method within 5-7 business days.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">Damaged or Defective Items</h2>
            <p>
              If you receive a damaged product, please report it within 24 hours of delivery. An <strong>unboxing video</strong> is mandatory to process claims for missing or damaged items to ensure authenticity.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}