"use client";
import React from 'react';
import Link from 'next/link';
import { Gem, Crown, Globe, ArrowRight, Star, TrendingUp, Instagram, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-[#051614] min-h-screen pt-24 font-sans text-white overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      {/* 🌟 1. HERO SECTION (The Visionary Start) */}
      <section className="relative min-h-[75vh] flex items-center justify-center text-center px-6 overflow-hidden">
         {/* Moving Spotlight Effect */}
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-600/10 blur-[150px] rounded-full animate-pulse-slow pointer-events-none"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none"></div>

         <div className="relative z-10 max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-md mb-8 animate-fade-in-up">
               <Crown className="w-3 h-3 text-amber-400" />
               <span className="text-amber-300 text-[10px] font-bold uppercase tracking-[0.3em]">The Future of Luxury • Est. 2026</span>
            </div>
            
            <h1 className="font-serif text-6xl md:text-9xl text-white mb-8 leading-[0.9] tracking-tight">
               Own The <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-600">Future Legacy.</span>
            </h1>
            
            <p className="text-white/60 text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto font-light mb-10">
               ZERIMI isn't just a jewelry brand; it's a <strong>global movement</strong> starting from India. Buying ZERIMI today is like buying a piece of history before the world catches on.
            </p>
            
            <div className="flex flex-col md:flex-row gap-5 justify-center">
                <Link href="/category/all" className="bg-gradient-to-r from-amber-200 to-amber-500 text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center gap-3">
                    Join The Revolution <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
         </div>
      </section>

      {/* 🚀 2. THE "EARLY ADOPTER" PRIDE (Why Buy Now?) */}
      <section className="py-24 px-6 bg-[#0a1f1c] relative">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="font-serif text-3xl md:text-5xl text-white mb-4">Why the World is Watching ZERIMI</h2>
               <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white/5 p-10 rounded-[2rem] border border-white/5 hover:border-amber-500/30 transition duration-500 group hover:-translate-y-2">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition"><TrendingUp className="w-7 h-7" /></div>
                    <h3 className="text-2xl font-serif text-white mb-3">The Next Big Thing</h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                        We are building the <strong>first Global Luxury House from India</strong>. When you wear ZERIMI, you are an early adopter of a brand that will soon be on billboards in Paris and New York.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="bg-white/5 p-10 rounded-[2rem] border border-white/5 hover:border-emerald-500/30 transition duration-500 group hover:-translate-y-2">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition"><Globe className="w-7 h-7" /></div>
                    <h3 className="text-2xl font-serif text-white mb-3">World-Class Quality</h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Crafted with the same precision as Italian ateliers. Our **18K Gold Micro-Plating** is designed to outshine and outlast anything else in the market.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="bg-white/5 p-10 rounded-[2rem] border border-white/5 hover:border-purple-500/30 transition duration-500 group hover:-translate-y-2">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition"><ShieldCheck className="w-7 h-7" /></div>
                    <h3 className="text-2xl font-serif text-white mb-3">Unmatched Warranty</h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                        We don't just promise; we guarantee. Enjoy a <strong>6-Month Warranty</strong> on all pieces. It's not just jewelry; it's a promise of excellence.
                    </p>
                </div>
            </div>
         </div>
      </section>

      {/* 👑 3. THE ELITE CIRCLE (Community & Sharing) */}
      <section className="py-24 px-6 relative overflow-hidden">
         {/* Background Image Effect */}
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm mix-blend-overlay"></div>
         
         <div className="max-w-5xl mx-auto bg-black/40 backdrop-blur-xl rounded-[3rem] p-8 md:p-20 border border-white/10 text-center relative z-10">
            <Star className="w-12 h-12 text-amber-400 mx-auto mb-6 animate-spin-slow" />
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-6">Welcome to The Elite.</h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
               Wearing ZERIMI sets you apart. It signals that you value quality, vision, and exclusivity. 
               <br/><br/>
               <span className="text-amber-200 italic">"Don't just wear it. Flaunt it."</span>
            </p>
            
            <div className="inline-flex flex-col md:flex-row gap-6 items-center bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-amber-500/50 transition duration-300">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Instagram className="w-8 h-8" />
                </div>
                <div className="text-left">
                    <h4 className="text-white font-bold text-lg">Tag us @ZERIMI.Official</h4>
                    <p className="text-white/50 text-sm">Join the league of trendsetters. Get featured on our global page.</p>
                </div>
                <Link href="https://instagram.com" className="px-6 py-2 bg-white text-black text-xs font-bold uppercase rounded-full hover:bg-amber-400 transition">
                    Visit Instagram
                </Link>
            </div>
         </div>
      </section>

      {/* 📜 4. THE ORIGIN (Ashutosh's Vision) */}
      <section className="py-24 px-6 bg-gradient-to-t from-black to-[#0a1f1c]">
         <div className="max-w-4xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
                   From <span className="text-amber-500">Baghpat</span> to the World.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-6">
                   "In 2026, I started ZERIMI with a single goal: <strong>To put Indian Craftsmanship on the Global Luxury Map.</strong> We are not here to compete; we are here to dominate the affordable luxury space."
                </p>
                <div className="mt-8 border-l-4 border-amber-500 pl-6">
                    <p className="text-white text-xl font-serif italic">"When you buy ZERIMI today, remember—you aren't just a customer. You are a founding member of a legacy."</p>
                    <div className="mt-4">
                        <p className="text-white font-bold tracking-widest uppercase text-sm">Ashutosh</p>
                        <p className="text-amber-500 text-[10px] uppercase tracking-widest mt-1">Founder • ZERIMI Jewels</p>
                    </div>
                </div>
            </div>
            
            {/* Visual Element */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
                <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-4 border border-white/20 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <span className="block text-8xl font-serif text-white font-bold tracking-tighter">Z</span>
                        <span className="block text-[10px] uppercase tracking-[0.4em] text-amber-500 mt-2">Est. 2026</span>
                    </div>
                </div>
            </div>
         </div>
      </section>

    </div>
  );
}