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
      
      {/* --- MICRO TOOLTIP --- */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto absolute bottom-16 right-3 md:right-6 w-[160px] bg-white/95 backdrop-blur-md border border-stone-100 rounded-xl p-2.5 shadow-lg flex flex-col gap-0.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-amber-600 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> Zemi
              </span>
              <button onClick={() => setShowTooltip(false)} className="text-stone-300 hover:text-black">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-stone-600 leading-snug mt-0.5">
              Need styling advice?
            </p>
            <div className="absolute -bottom-1 right-4 w-2.5 h-2.5 bg-white border-b border-r border-stone-100 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TINY TRIGGER BUTTON --- */}
      {!isOpen && (
        <motion.button 
          initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }}
          onClick={() => { setIsOpen(true); setShowTooltip(false); }} 
          // Size reduced from w-12 to w-10
          className="pointer-events-auto absolute bottom-3 right-3 md:bottom-6 md:right-6 w-10 h-10 bg-[#0a0a0a] rounded-full flex items-center justify-center shadow-xl border border-white/10 hover:bg-black transition-all"
        >
          <Crown className="text-amber-500 w-4.5 h-4.5" />
        </motion.button>
      )}

      {/* --- MICRO-COMPACT CHAT WINDOW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: 15, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 15, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            // ULTRA COMPACT: width 280px on mobile, h-45vh, max-h-360px
            className="pointer-events-auto absolute bottom-2 right-2 left-auto w-[280px] md:w-[300px] h-[45vh] min-h-[300px] max-h-[360px] md:max-h-[450px] bg-[#fcfcfc] border border-stone-100 rounded-[1.2rem] shadow-[0_12px_35px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden"
          >
            {/* Header - Micro Padding */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-white/80 backdrop-blur-md border-b border-stone-100/50">
              <div className="flex items-center gap-2">
                <div className="w-4.5 h-4.5 bg-black rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold tracking-[0.15em] text-black uppercase">Zemi</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 bg-green-500 rounded-full" />
                    <span className="text-[7.5px] text-stone-400 uppercase tracking-wider">Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-5 h-5 flex items-center justify-center bg-stone-100 rounded-full text-stone-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Chat Area - tighter padding */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-11 pb-1.5 px-2.5 space-y-2.5 custom-scrollbar">
              {messages.map((m, i) => {
                const productMatch = m.content.match(/PRODUCT_CARD: (\{.*?\})/);
                const cleanText = m.content.replace(/PRODUCT_CARD: \{.*?\}/g, "").replace(/\[GOTO: .*?\]/g, "").trim();
                const product = productMatch ? JSON.parse(productMatch[1]) : null;

                return (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {cleanText && (
                      <div className={`px-3 py-1.5 text-[11.5px] leading-[1.35] max-w-[90%] ${
                        m.role === 'user' 
                        ? 'bg-[#0a0a0a] text-white rounded-[0.9rem] rounded-tr-sm shadow-sm' 
                        : 'bg-white text-stone-800 rounded-[0.9rem] rounded-tl-sm border border-stone-100 shadow-sm'
                      }`}>
                        {cleanText}
                      </div>
                    )}
                    
                    {/* MICRO PRODUCT STRIP */}
                    {product && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={() => router.push(product.link || `/product/${product.id}`)}
                        className="mt-1.5 w-[190px] bg-white rounded-lg p-1 border border-stone-100 shadow-sm flex items-center gap-2 cursor-pointer group hover:border-amber-200 transition-all"
                      >
                        <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0 bg-stone-50">
                          <Image src={product.img || '/logo.png'} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h4 className="text-[9.5px] font-bold text-black truncate">{product.name}</h4>
                          <p className="text-[9px] text-amber-600 font-medium mt-0.5">₹{product.price}</p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-stone-300 mr-1 shrink-0" />
                      </motion.div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-1 ml-1 py-1">
                  <div className="w-1 h-1 bg-stone-300 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-stone-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1 h-1 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              )}
            </div>

            {/* Input Area - Micro profile */}
            <div className="px-2.5 pb-2.5 pt-1 bg-gradient-to-t from-[#fcfcfc] to-transparent">
              <div className="flex items-center gap-1.5 bg-white rounded-full pl-3 pr-1 py-1 border border-stone-200 focus-within:border-stone-300 transition-all">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Zemi..." 
                  className="flex-1 bg-transparent border-none outline-none text-[11.5px] text-black placeholder:text-stone-400" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim()} 
                  className="w-6.5 h-6.5 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-amber-600 transition-colors shrink-0"
                >
                  <Send className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}