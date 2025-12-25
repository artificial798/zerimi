import React from 'react';
import Image from 'next/image';
import { Gem, PenTool, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-stone-50 min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] bg-[#0a1f1c] flex items-center justify-center text-center px-6">
         <div className="absolute inset-0 opacity-30">
            {/* Add a background image here if available */}
         </div>
         <div className="relative z-10 max-w-3xl">
            <p className="text-amber-400 uppercase tracking-widest text-xs font-bold mb-4">Our Story</p>
            <h1 className="font-serif text-5xl md:text-6xl text-white mb-6">Crafting Elegance Since 2025</h1>
            <p className="text-white/80 text-lg leading-relaxed">
               ZERIMI was born from a desire to make luxury accessible. We bridge the gap between traditional artistry and modern aesthetics.
            </p>
         </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 py-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-6">
               <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-700">
                  <Gem className="w-8 h-8" />
               </div>
               <h3 className="font-serif text-2xl text-[#0a1f1c] mb-3">Ethically Sourced</h3>
               <p className="text-stone-600">We ensure every stone and metal used in our jewelry is sourced with the highest ethical standards.</p>
            </div>
            <div className="text-center p-6">
               <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-700">
                  <PenTool className="w-8 h-8" />
               </div>
               <h3 className="font-serif text-2xl text-[#0a1f1c] mb-3">Master Craftsmanship</h3>
               <p className="text-stone-600">Our pieces are handcrafted by artisans who have inherited their skills through generations.</p>
            </div>
            <div className="text-center p-6">
               <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-700">
                  <Heart className="w-8 h-8" />
               </div>
               <h3 className="font-serif text-2xl text-[#0a1f1c] mb-3">Customer First</h3>
               <p className="text-stone-600">From our lifetime warranty to our concierge service, your satisfaction is our obsession.</p>
            </div>
         </div>
      </section>

      {/* Founder Quote */}
      <section className="bg-[#fffcf5] py-20 px-6 text-center">
         <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-[#0a1f1c] leading-tight italic">
               "Jewelry is not just an accessory; it's a silent language of elegance that speaks who you are without saying a word."
            </h2>
            <p className="mt-8 font-bold text-amber-700 tracking-widest uppercase text-xs">— Founder, ZERIMI</p>
         </div>
      </section>
    </div>
  );
}