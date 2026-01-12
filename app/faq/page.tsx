"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, HelpCircle, Truck, RefreshCcw, ShieldCheck, 
  CreditCard, Gift, AlertCircle, ShoppingBag 
} from 'lucide-react';

const faqs = [
  {
    category: "Orders & Shipping",
    icon: <Truck className="w-5 h-5 text-amber-500" />,
    items: [
      { 
        q: "How can I track my order?", 
        a: "Once your order is dispatched, you will receive a tracking link via SMS and Email. You can also track it from the 'My Orders' section in your account." 
      },
      { 
        q: "How long does delivery take?", 
        a: "We usually dispatch within 24-48 hours. Standard delivery across India takes 3-5 business days. Remote locations may take 7 days." 
      },
      { 
        q: "Can I cancel my order?", 
        a: "Yes, you can cancel your order directly from the dashboard before it is marked as 'Shipped'. Once shipped, cancellations are not allowed." 
      },
      { 
        q: "Is Cash on Delivery (COD) available?", 
        a: "Yes, we offer COD on most pincodes for orders up to ₹5,000. For higher value orders, we request prepaid payment for security reasons." 
      },
      { 
        q: "Do you ship internationally?", 
        a: "Currently, ZERIMI ships exclusively within India. We do not ship internationally yet." 
      }
    ]
  },
  {
    category: "Returns & Refunds (Important)",
    icon: <RefreshCcw className="w-5 h-5 text-amber-500" />,
    items: [
      { 
        q: "What is your Return Policy?", 
        a: "We have a strict 3-Day Return Policy. You must raise a return request within 72 hours of delivery. Requests made after 3 days will be automatically rejected." 
      },
      { 
        q: "Is an Unboxing Video mandatory?", 
        a: "YES. To claim a return for damage, missing items, or wrong product, a complete 360-degree unboxing video without cuts/edits is MANDATORY. Without this video evidence, we cannot process any claims." 
      },
      { 
        q: "Will my shipping charges be refunded?", 
        a: "No. The shipping charge paid during the order is non-refundable. Additionally, for return pickups, a reverse shipping fee (approx. ₹150-₹200) will be deducted from your final refund amount." 
      },
      { 
        q: "Which items are Non-Returnable?", 
        a: "Customized jewelry, personalized items, nose pins (for hygiene), and products bought during a 'Flash Sale' or 'Clearance Sale' cannot be returned." 
      },
      { 
        q: "When will I get my refund?", 
        a: "Once the return reaches our warehouse and passes the quality check (approx. 48 hours), the refund is initiated. It takes 7-10 business days to reflect in your bank account." 
      }
    ]
  },
  {
    category: "Payments & Security",
    icon: <CreditCard className="w-5 h-5 text-amber-500" />,
    items: [
      { 
        q: "What payment methods do you accept?", 
        a: "We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Wallets via our secure payment partners (Razorpay/PayU)." 
      },
      { 
        q: "Is my payment information safe?", 
        a: "Absolutely. All transactions are encrypted with 256-bit SSL technology. We do not store your card details on our servers." 
      },
      { 
        q: "Why was my COD order cancelled?", 
        a: "We verify all COD orders via an automated call/WhatsApp. If the customer does not confirm the order within 24 hours, it may be cancelled to prevent RTO losses." 
      }
    ]
  },
  {
    category: "Product & Warranty",
    icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
    items: [
      { 
        q: "Is the jewelry anti-tarnish?", 
        a: "Most of our premium collection is 18k Gold Plated on Stainless Steel, which is anti-tarnish and water-resistant. Please check individual product descriptions for specific details." 
      },
      { 
        q: "Does ZERIMI offer a warranty?", 
        a: "Yes, we offer a Six Month Warranty on stone falling and plating issues (manufacturing defects only). Physical breakage due to mishandling is not covered." 
      },
      { 
        q: "How do I care for my jewelry?", 
        a: "Keep it away from direct perfumes, sanitizers, and harsh chemicals. Store it in the signature ZERIMI box or a ziplock bag to maintain its shine for years." 
      }
    ]
  },
  {
    category: "Gifting & Special Requests",
    icon: <Gift className="w-5 h-5 text-amber-500" />,
    items: [
      { 
        q: "Does the order come in a gift box?", 
        a: "Yes! Every ZERIMI order comes in our premium signature packaging, perfect for gifting directly." 
      },
      { 
        q: "Can I add a personalized note?", 
        a: "Yes, you can add a gift message on the cart page. We will print it on a beautiful card and include it in the package." 
      },
      { 
        q: "What is 'Secret Gift' mode?", 
        a: "If you select 'Secret Gift' at checkout, we will hide the price tag and invoice from the package, so the receiver only sees the gift and your message." 
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="bg-[#0a1f1c] min-h-screen pt-32 pb-20 px-6 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16 border-b border-white/10 pb-10">
           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-white/10">
              <HelpCircle className="w-8 h-8" />
           </div>
           <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 block">Help Center</span>
           <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">Frequently Asked Questions</h1>
           <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
             Find answers to all your questions about our luxury products, shipping, returns, and more.
           </p>
        </div>

        {/* FAQs Categories */}
        <div className="space-y-10">
           {faqs.map((section, idx) => (
              <div key={idx} className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/5 hover:border-amber-500/20 transition duration-500">
                 <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 shadow-inner">{section.icon}</div>
                    <h3 className="font-serif text-xl text-white tracking-wide">{section.category}</h3>
                 </div>
                 
                 <div className="space-y-3">
                    {section.items.map((item, i) => {
                       const id = `${idx}-${i}`;
                       const isOpen = openIndex === id;
                       
                       return (
                          <div key={i} className={`rounded-xl overflow-hidden transition-all duration-300 border ${isOpen ? 'bg-white/10 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                             <button 
                               onClick={() => toggleFAQ(id)}
                               className="w-full flex justify-between items-center p-4 text-left focus:outline-none group"
                             >
                                <span className={`font-medium text-sm md:text-base pr-4 transition-colors ${isOpen ? 'text-amber-400' : 'text-white/80 group-hover:text-white'}`}>
                                  {item.q}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : 'group-hover:text-white'}`} />
                             </button>
                             <AnimatePresence>
                                {isOpen && (
                                   <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                   >
                                      <div className="p-4 pt-0 text-sm text-white/60 leading-relaxed border-t border-white/5 mt-2 ml-1">
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

        {/* Footer Note */}
        <div className="mt-16 p-6 bg-gradient-to-r from-amber-900/20 to-transparent rounded-2xl border border-amber-500/20 flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
                <h4 className="text-amber-400 font-bold text-sm mb-1 uppercase">Still have questions?</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                    If you couldn't find your answer here, please reach out to our support team. <br/>
                    <strong>Email:</strong> support@zerimi.com <br/>
                    <strong>Note:</strong> All legal disputes are subject to <strong>Baghpat Jurisdiction</strong> only.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}