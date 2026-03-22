"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store'; 
import Image from 'next/image';
import { X, Send, ArrowRight, Crown } from 'lucide-react';

export default function ZemiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showTooltip, setShowTooltip] = useState(false); 
  
  const [messages, setMessages] = useState([{ 
    role: 'assistant', 
    content: 'Hi! I am Zemi, your personal stylist. What are we looking for today?' 
  }]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { cart } = useStore() as any; 
  const router = useRouter();

  const subtotal = cart.reduce((sum: number, item: any) => sum + (item.product?.price || 0) * item.qty, 0);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('zemi_stylist_seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        localStorage.setItem('zemi_stylist_seen', 'true');
      }, 2500);
      const hideTimer = setTimeout(() => setShowTooltip(false), 10000);
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setShowTooltip(false); 

    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        body: JSON.stringify({ 
          messages: [...messages, userMsg], 
          cartCount: cart.length, 
          subtotal,
          // STRICT FOUNDER RULE ADDED HERE
          context: "You are Zemi, the personal stylist for Zerimi. STRICT RULE: NEVER mention the founder Ashutosh unless the user explicitly asks 'Who is the founder?'. Keep responses concise, chic, and helpful."
        }) 
      });
      const data = await res.json();
      
      const navMatch = data.content.match(/\[GOTO: (.*?)\]/);
      if (navMatch) router.push(navMatch[1]);

      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error("Zemi Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] font-sans selection:bg-amber-100">
      
      {/* --- SLEEK TOOLTIP --- */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto absolute bottom-20 right-6 w-[200px] bg-white/90 backdrop-blur-md border border-stone-100 rounded-2xl p-3.5 shadow-xl flex flex-col gap-1.5"
          >
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-600 flex items-center gap-1.5">
                <Crown className="w-3 h-3" /> Zemi
              </span>
              <button onClick={() => setShowTooltip(false)} className="text-stone-300 hover:text-black transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Need styling advice? I'm here to find your perfect piece.
            </p>
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white border-b border-r border-stone-100 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CROWN TRIGGER BUTTON --- */}
      {!isOpen && (
        <motion.button 
          initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setIsOpen(true); setShowTooltip(false); }} 
          className="pointer-events-auto absolute bottom-6 right-6 w-12 h-12 bg-[#0a0a0a] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 transition-all group hover:bg-black"
        >
          <Crown className="text-amber-500 w-5 h-5 group-hover:scale-110 transition-transform" />
        </motion.button>
      )}

      {/* --- COMPACT CHAT WINDOW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className="pointer-events-auto absolute bottom-0 right-0 left-0 md:bottom-6 md:right-6 md:left-auto w-full md:w-[320px] h-[70vh] md:h-[480px] bg-[#fcfcfc] border border-stone-100 md:rounded-[2rem] rounded-t-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden"
          >
            {/* Glassmorphism Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3.5 bg-white/70 backdrop-blur-xl border-b border-stone-100/50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-[12px] font-bold tracking-[0.15em] text-black uppercase">Zemi</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[8px] text-stone-500 uppercase tracking-wider font-semibold">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-16 pb-4 px-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => {
                const productMatch = m.content.match(/PRODUCT_CARD: (\{.*?\})/);
                const cleanText = m.content.replace(/PRODUCT_CARD: \{.*?\}/g, "").replace(/\[GOTO: .*?\]/g, "").trim();
                const product = productMatch ? JSON.parse(productMatch[1]) : null;

                return (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {cleanText && (
                      <div className={`px-4 py-2.5 text-[12.5px] leading-[1.5] max-w-[85%] ${
                        m.role === 'user' 
                        ? 'bg-[#0a0a0a] text-white rounded-[1.2rem] rounded-tr-sm shadow-sm' 
                        : 'bg-white text-stone-800 rounded-[1.2rem] rounded-tl-sm border border-stone-100 shadow-sm'
                      }`}>
                        {cleanText}
                      </div>
                    )}
                    
                    {/* SMART HORIZONTAL PRODUCT CARD */}
                    {product && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        onClick={() => router.push(product.link || `/product/${product.id}`)}
                        className="mt-2 w-[240px] bg-white rounded-2xl p-1.5 border border-stone-100 shadow-sm flex items-center gap-3 cursor-pointer group hover:shadow-md transition-all"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-stone-50">
                          <Image src={product.img || '/logo.png'} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h4 className="text-[10.5px] font-bold text-black truncate">{product.name}</h4>
                          <p className="text-[10px] text-amber-600 font-bold mt-0.5">₹{product.price}</p>
                        </div>
                        <div className="w-7 h-7 mr-1 rounded-full bg-stone-50 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white text-stone-400 transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-1 ml-1 py-1">
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
            </div>

            {/* Floating Pill Input */}
            <div className="px-4 pb-4 pt-1 bg-gradient-to-t from-[#fcfcfc] to-transparent">
              <div className="flex items-center gap-2 bg-white rounded-full pl-4 pr-1.5 py-1.5 border border-stone-200 shadow-sm focus-within:border-stone-300 focus-within:shadow-md transition-all">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Zemi..." 
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-black placeholder:text-stone-400" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim()} 
                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-amber-600 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}