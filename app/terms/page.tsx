import React from 'react';

export default function TermsPage() {
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-stone-100">
        <h1 className="font-serif text-4xl text-[#0a1f1c] mb-2">Terms & Conditions</h1>
        <p className="text-stone-500 mb-8 text-sm">Last Updated: October 2025</p>

        <div className="space-y-8 text-stone-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">1. Introduction</h2>
            <p>
              Welcome to ZERIMI. These Terms and Conditions govern your use of our website and the purchase of products from our online store. 
              By accessing our site, you agree to be bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">2. Intellectual Property</h2>
            <p>
              All content on this website, including jewelry designs, images, logos, and text, is the property of ZERIMI and is protected by copyright laws. 
              Unauthorized use of our content is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">3. Product Accuracy</h2>
            <p>
              We have made every effort to display the colors and images of our products accurately. However, we cannot guarantee that your computer monitor's display of any color will be accurate. 
              All descriptions of products or product pricing are subject to change at anytime without notice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">4. Billing & Account Information</h2>
            <p>
              We reserve the right to refuse any order you place with us. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#0a1f1c] mb-3">5. Governing Law</h2>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}