import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-stone-100">
        <h1 className="font-serif text-4xl text-[#0a1f1c] mb-2">Privacy Policy</h1>
        <p className="text-stone-500 mb-8 text-sm">Your privacy is critically important to us.</p>

        <div className="space-y-8 text-stone-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, make a purchase, or sign up for our newsletter. This includes your name, email address, shipping address, and payment information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
                <li>To process and fulfill your orders.</li>
                <li>To communicate with you about your order status.</li>
                <li>To send you marketing communications (if you opted in).</li>
                <li>To improve and optimize our website experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">3. Data Security</h2>
            <p>
              We implement a variety of security measures to maintain the safety of your personal information. Your payment information is encrypted using secure socket layer technology (SSL) and stored with a AES-256 encryption.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">4. Cookies</h2>
            <p>
              We use cookies to help us remember and process the items in your shopping cart and understand your preferences based on previous or current site activity.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}