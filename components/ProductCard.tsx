"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, Loader2, Zap, Gift, Plus, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();
  const { addToCart, toggleWishlist } = useStore() as any;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- 1. LOGIC: SMART CLICK NAVIGATION ---
  const handleCardClick = (e: any) => {
    // Agar user button (Add/Wishlist) par click kare to redirect mat karo
    if (e.target.closest('button') || e.target.closest('a')) return;
    router.push(`/product/${product.id}`);
  };

  // --- 2. LOGIC: ADD TO CART WITH VARIANT CHECK ---
  const handleAddToCart = (e: any) => {
    e.preventDefault(); 
    e.stopPropagation();

    const hasVariants = (product.colors && product.colors.length > 0) || 
                        (product.sizes && product.sizes.length > 0);

    if (hasVariants) {
        // Agar color/size hai, to product page par bhejo select karne ke liye
        router.push(`/product/${product.id}`);
    } else {
        // Simple product hai to direct cart me daalo
        addToCart(product, 1);
        toast.success("Added to Cart", {
            style: { background: '#0a1f1c', color: '#fff', fontSize: '12px', border: '1px solid #d4af37' },
            icon: '🛍️'
        });
    }
  };

  // --- 3. LOGIC: IMAGE SLIDESHOW ON HOVER ---
  useEffect(() => {
    let interval: any;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      }, 1200);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  // Calculations
  const originalPrice = product.originalPrice || 0;
  const hasDiscount = originalPrice > product.price;
  const displayImage = (product.images && product.images.length > 0) ? product.images[currentImageIndex] : product.image;
  const colors = product.colors || [];

  // --- 4. PREMIUM BADGE STYLING ---
  const getTagStyle = (tag: string) => {
    if (!tag) return "bg-white text-stone-900 border-stone-200";
    const t = tag.toLowerCase();
    if (t.includes('new')) return "bg-[#0a1f1c] text-white border-[#0a1f1c]"; // Signature Black
    if (t.includes('sale') || t.includes('off')) return "bg-[#9f1239] text-white border-[#9f1239]"; // Deep Red
    if (t.includes('best') || t.includes('trend')) return "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]"; // Burnt Orange
    if (t.includes('premium') || t.includes('gold')) return "bg-gradient-to-r from-amber-100 to-[#f3eac2] text-[#856c26] border-[#d4af37]/30"; // Gold
    return "bg-white text-stone-600 border-stone-200";
  };

  return (
   <div 
      onClick={handleCardClick} 
      className="group relative flex flex-col w-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* =================================
          IMAGE AREA (SQUARE 1:1 RATIO)
         ================================= */}
      {/* 👇 Square Box Logic */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f9f9f9] rounded-xl border border-stone-100/50 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500">
        
        <Image
            src={displayImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition-transform duration-[1.5s] ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
        />

        {/* Gradient Overlay (Hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* --- TOP LEFT: BADGES --- */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {product.tags?.slice(0, 1).map((tag: string, idx: number) => (
                <span key={idx} className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border shadow-sm ${getTagStyle(tag)}`}>
                  {tag}
                </span>
            ))}
        </div>

        {/* --- TOP RIGHT: WISHLIST (Floating Glass) --- */}
        <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); toast.success("Saved"); }}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/80 backdrop-blur-md text-stone-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-20 md:translate-x-10 md:group-hover:translate-x-0"
        >
            <Heart className="w-4 h-4" />
        </button>

        {/* --- BOTTOM RIGHT: GIFT ICON (Desktop Only) --- */}
        <Link 
          href={`/product/${product.id}?gift=true`}
          onClick={(e) => e.stopPropagation()} 
          className="absolute bottom-3 right-3 z-20 hidden md:block"
        >
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full text-white hover:bg-[#d4af37] hover:text-white hover:border-[#d4af37] transition-all duration-300 transform translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg">
             <Gift className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* --- DESKTOP QUICK ADD (Slide Up) --- */}
        <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hidden md:block">
             <button 
                onClick={handleAddToCart} 
                disabled={isLoading || product.stock === 0} 
                className="w-full bg-white/95 backdrop-blur-xl text-[#0a1f1c] hover:bg-[#0a1f1c] hover:text-white text-[10px] font-bold uppercase py-3 border-t border-stone-100 transition-colors flex items-center justify-center gap-2 tracking-[0.2em]"
             >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                    ((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) ? "SELECT OPTIONS" : "QUICK ADD"
                )}
             </button>
        </div>
      </div>

      {/* =================================
          DETAILS AREA (Clean & Minimal)
         ================================= */}
      <div className="pt-3 pb-2 flex flex-col gap-1 px-1">
        
        {/* Category & Rating */}
        <div className="flex justify-between items-center opacity-70">
            <span className="text-[9px] text-stone-500 uppercase tracking-widest font-semibold truncate max-w-[70%]">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] text-stone-500 font-medium">4.8</span>
            </div>
        </div>

        {/* Title (Premium Serif Font) */}
        <Link href={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-[#1c1917] text-sm md:text-[15px] leading-snug group-hover:text-[#d4af37] transition-colors line-clamp-1 mt-0.5 font-medium">
              {product.name}
            </h3>
        </Link>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-0.5">
           <span className="text-sm md:text-base font-bold text-[#1c1917] tracking-tight">
            ₹{product.price.toLocaleString()}
           </span>
           {hasDiscount && (
              <span className="text-[10px] text-stone-400 line-through decoration-stone-300">
                ₹{originalPrice.toLocaleString()}
              </span>
           )}
        </div>

        {/* Bottom Logic: Colors OR Stock OR Mobile Add */}
        <div className="flex items-center justify-between mt-2 min-h-[22px]">
            
            {/* Logic A: Colors Available? */}
            {colors.length > 0 ? (
                <div className="flex -space-x-1.5 pl-0.5">
                    {colors.slice(0, 4).map((color: string, i: number) => (
                        <div key={i} className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-stone-200 shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                    {colors.length > 4 && <span className="text-[9px] text-stone-400 pl-2">+{colors.length - 4}</span>}
                </div>
            ) : (
                // Logic B: Agar Colors nahi, to Delivery Badge
                <div className="flex items-center gap-1 text-[9px] text-stone-400 font-medium">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> <span className="hidden md:inline">Express</span> Delivery
                </div>
            )}

            {/* Right Side: Stock Logic OR Mobile Add Button */}
            <div className="flex items-center gap-2">
                {product.stock > 0 && product.stock < 5 ? (
                    <p className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                        Only {product.stock} Left
                    </p>
                ) : null}

                {/* Mobile Add Button (Desktop par hidden) */}
                <button 
                    onClick={handleAddToCart} 
                    className="md:hidden w-7 h-7 rounded-full bg-stone-100 text-[#0a1f1c] flex items-center justify-center active:bg-[#0a1f1c] active:text-white transition shadow-sm border border-stone-200"
                >
                    {((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) ? <Eye className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}