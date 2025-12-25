"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Truck, RefreshCcw, ShieldCheck } from 'lucide-react';

const faqs = [
  {
    category: "Shipping & Delivery",
    icon: <Truck className="w-5 h-5 text-amber-600" />,
    items: [
      { q: "Shipping mein kitna time lagta hai?", a: "Hum ₹5000 se upar ke orders par free express shipping dete hain. Aamtaur par, India mein orders 3-5 business days mein deliver ho jate hain." },
      { q: "Kya aap internationally ship karte hain?", a: "Filhal, ZERIMI sirf India ke andar ship karta hai. Hum jaldi hi global shipping shuru karne wale hain." },
      { q: "Main apna order kaise track kar sakta hoon?", a: "Order dispatch hone ke baad aapko SMS aur Email par tracking link milega. Aap apne Dashboard mein 'My Orders' section se bhi track kar sakte hain." }
    ]
  },
  {
    category: "Returns & Exchanges",
    icon: <RefreshCcw className="w-5 h-5 text-amber-600" />,
    items: [
      { q: "Aapki return policy kya hai?", a: "Hum 7-din ki hassle-free return policy dete hain. Agar aap product se khush nahi hain, toh dashboard se return initiate kar sakte hain, bas tags intact hone chahiye." },
      { q: "Refund kab milega?", a: "Quality check pass hone ke 48 ghante ke andar refund process kar diya jata hai. Bank account mein aane mein 5-7 din lag sakte hain." }
    ]
  },
  {
    category: "Warranty & Care",
    icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
    items: [
      { q: "Kya jewelry par warranty hai?", a: "Haan, ZERIMI plating aur stone setting par lifetime warranty deta hai. Yeh manufacturing defects cover karta hai." },
      { q: "Main shine kaise maintain karoon?", a: "Jewelry ko direct perfumes, paani aur harsh chemicals se door rakhein. Ise humare diye gaye signature box mein store karna behtar hai." }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
           <div className="w-16 h-16 bg-[#0a1f1c] rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl">
              <HelpCircle className="w-8 h-8" />
           </div>
           <h1 className="font-serif text-4xl text-[#0a1f1c] mb-4">Frequently Asked Questions</h1>
           <p className="text-stone-500 max-w-lg mx-auto">Koi sawal hai? Hum yahan madad ke liye hain. Hamare luxury collection ke bare mein aksar pooche jane wale sawalon ke jawab yahan payein.</p>
        </div>

        {/* FAQs */}
        <div className="space-y-8">
           {faqs.map((section, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                    {section.icon}
                    <h3 className="font-serif text-xl text-[#0a1f1c]">{section.category}</h3>
                 </div>
                 
                 <div className="space-y-4">
                    {section.items.map((item, i) => {
                       const id = `${idx}-${i}`;
                       const isOpen = openIndex === id;
                       
                       return (
                          <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                             <button 
                               onClick={() => toggleFAQ(id)}
                               className={`w-full flex justify-between items-center p-4 text-left transition-colors ${isOpen ? 'bg-stone-50' : 'bg-white hover:bg-stone-50'}`}
                             >
                                <span className="font-medium text-stone-800 text-sm md:text-base">{item.q}</span>
                                <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                             </button>
                             <AnimatePresence>
                                {isOpen && (
                                   <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                   >
                                      <div className="p-4 pt-0 text-sm text-stone-600 leading-relaxed bg-stone-50 border-t border-stone-100">
                                         {item.a}
                                      </div>
                                   </motion.div>
                                )}
                             </AnimatePresence>
                          </div>
                       );
                    })}
                 </div>
              </div>
           ))}
        </div>

      </div>
    </div>
  );
}