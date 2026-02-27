"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store'; 
import Image from 'next/image';
import { Sparkles, X, Send, ShoppingBag } from 'lucide-react';

export default function ZEliteChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ 
    role: 'assistant', 
    content: 'Welcome to the world of Zerimi. I am Z-Elite, your personal concierge. How may I elevate your style today?' 
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Ref for boundary constraints and dragging
  const constraintsRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { addToCart, cart } = useStore() as any; 
  const router = useRouter();

  const subtotal = cart.reduce((sum: number, item: any) => sum + (item.product?.price || 0) * item.qty, 0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        body: JSON.stringify({ messages: [...messages, userMsg], cartCount: cart.length, subtotal }) 
      });
      const data = await res.json();
      
      const navMatch = data.content.match(/\[GOTO: (.*?)\]/);
      if (navMatch) router.push(navMatch[1]);

      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    // Pointer-events-none ensures background remains clickable
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[999] font-sans">
      
      {/* --- DRAGGABLE PREMIUM PILL ICON --- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            drag
            dragConstraints={constraintsRef}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)} 
            className="pointer-events-auto absolute bottom-24 right-0 bg-[#0a1f1c] text-amber-500 pl-4 pr-3 py-3 rounded-l-full border border-amber-500/30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex items-center gap-2 cursor-grab active:cursor-grabbing"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden md:block">Z-Elite</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- ULTRA-PREMIUM CHAT WINDOW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 100, scale: 0.9, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
           // Is className ko apne motion.div mein replace karein
className="pointer-events-auto absolute bottom-4 right-4 left-4 md:left-auto md:right-6 md:bottom-6 w-[calc(100%-2rem)] md:w-[380px] h-[60vh] md:h-[600px] bg-[#0a1f1c]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Minimalist Gold Header with Close Action */}
            <div className="p-6 flex justify-between items-center border-b border-white/5 bg-gradient-to-b from-white/10 to-transparent">
              <div className="flex flex-col items-start text-left">
                <span className="text-[9px] tracking-[0.4em] text-amber-500 uppercase font-bold mb-0.5">Concierge</span>
                <h3 className="font-serif text-white text-xl tracking-widest italic uppercase">Z-Elite</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area with Smooth Content Rendering */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
              {messages.map((m, i) => {
                const productMatch = m.content.match(/PRODUCT_CARD: (\{.*?\})/);
                const cleanText = m.content.replace(/PRODUCT_CARD: \{.*?\}/g, "").replace(/\[GOTO: .*?\]/g, "").trim();
                const product = productMatch ? JSON.parse(productMatch[1]) : null;

                return (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {cleanText && (
                      <div className={`p-4 rounded-[1.5rem] text-[13px] leading-[1.6] tracking-wide max-w-[88%] ${
                        m.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none shadow-lg' : 'bg-white/5 text-stone-200 border border-white/10 rounded-tl-none backdrop-blur-md'
                      }`}>
                        {cleanText}
                      </div>
                    )}
                    
                    {product && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        onClick={() => router.push(product.link)}
                        className="mt-4 w-52 bg-white rounded-[1.5rem] overflow-hidden shadow-2xl cursor-pointer group ring-1 ring-black/5"
                      >
                        <div className="relative h-32 w-full overflow-hidden">
                          <Image src={product.img || '/logo.png'} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/5" />
                        </div>
                        <div className="p-4 bg-white">
                          <h4 className="text-[11px] font-bold text-black truncate mb-1">{product.name}</h4>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[12px] text-amber-600 font-bold">₹{product.price}</span>
                            <span className="text-[8px] bg-stone-100 px-2 py-0.5 rounded-full text-stone-500 uppercase tracking-tighter">Limited</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                            className="w-full bg-[#0a1f1c] text-white text-[10px] py-2.5 rounded-xl font-bold uppercase flex items-center justify-center gap-2 hover:bg-black transition-colors"
                          >
                            <ShoppingBag className="w-3 h-3" /> Add to Bag
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-2 px-3 py-1 items-center">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                </div>
              )}
            </div>

            {/* Premium Gold-Focus Input Area */}
            <div className="p-6 bg-[#0a1f1c] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-amber-500/40 focus-within:bg-white/[0.08] transition-all duration-500">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Inquire with Z-Elite..." 
                  className="flex-1 bg-transparent border-none outline-none text-white text-[14px] px-3 placeholder:text-white/20" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim()}
                  className="bg-amber-500 text-[#0a1f1c] p-2.5 rounded-xl hover:bg-amber-400 disabled:opacity-30 disabled:grayscale transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}