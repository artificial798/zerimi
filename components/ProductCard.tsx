"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, Star, Loader2, ShieldCheck, Truck, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();
  const { addToCart, toggleWishlist } = useStore() as any;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
// components/ProductCard.tsx

const handleAddToCart = (e: any) => {
    e.preventDefault(); // Link click hone se rokein
    e.stopPropagation();

    // 1. Check karein ki kya Product me Variants hain?
    const hasVariants = (product.colors && product.colors.length > 0) || 
                        (product.sizes && product.sizes.length > 0);

    if (hasVariants) {
        // 🛑 ROKO: Agar variants hain, to direct add mat karne do.
        // Option A: User ko Product Page par bhej do
        window.location.href = `/product/${product.id}`;
        
        // Option B (Agar apke paas QuickView Modal hai):
        // openQuickView(product);
        
        // Option C (Toast Message):
        // toast.error("Please select a color/size first!");
    } else {
        // ✅ JAANE DO: Agar simple product hai, to add kar lo
        addToCart(product, 1);
        toast.success("Added to Cart!");
    }
};

// Button Code Example:
<button 
    onClick={handleAddToCart}
    className="bg-white p-2 rounded-full shadow-lg hover:bg-amber-500 hover:text-white transition"
>
    {/* Agar variants hain to 'Eye' icon dikhao (View), nahi to 'Plus' (Add) */}
    {((product.colors?.length > 0) || (product.sizes?.length > 0)) ? (
        <Eye size={20} /> 
    ) : (
        <Plus size={20} />
    )}
</button>

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

  const originalPrice = product.originalPrice || 0;
  const hasDiscount = originalPrice > product.price;
  const discount = hasDiscount ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
  
  const displayImage = (product.images && product.images.length > 0) ? product.images[currentImageIndex] : product.image;
  const colors = product.colors || [];

  // ✨ NEW PREMIUM TAG STYLES
 // ✨ ULTRA-PREMIUM LUXURY TAGS
  const getTagStyle = (tag: string) => {
    if (!tag) return "bg-white/90 text-stone-900 border-stone-200";
    const t = tag.toLowerCase();

    // 1. GOLD / PLATINUM (The "Metallic" Look)
    if (t.includes('gold') || t.includes('premium') || t.includes('luxury')) 
      return "bg-gradient-to-r from-[#FDFBF7] to-[#F3EAC2] text-[#856c26] border border-[#d4af37]/40 shadow-[0_2px_10px_rgba(212,175,55,0.15)]";
    
    if (t.includes('platinum') || t.includes('silver') || t.includes('diamond')) 
      return "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border border-slate-300 shadow-sm";
    
    // 2. NEW ARRIVAL (Signature Dark Green + Gold Text)
    if (t.includes('new')) 
      return "bg-[#052e16] text-[#fbbf24] border border-[#fbbf24]/20 shadow-md";
    
    // 3. SALE / OFF (Elegant Burgundy - Not screaming Red)
    if (t.includes('sale') || t.includes('off') || t.includes('deal')) 
      return "bg-[#4c0519] text-white border border-[#881337] shadow-[0_2px_8px_rgba(76,5,25,0.3)]"; 
    
    // 4. BEST SELLER (Subtle Champagne)
    if (t.includes('best') || t.includes('trend')) 
      return "bg-[#fff7ed] text-[#7c2d12] border border-[#fed7aa]";
    
    // 5. SOLD OUT (Minimalist Black)
    if (t.includes('sold')) 
      return "bg-black text-white border border-stone-800 opacity-80";

    // Default: Clean White Glassmorphism
    return "bg-white/95 backdrop-blur-md text-stone-900 border border-stone-100";
  };

  return (
    // ✅ CHANGE 1: Main Container Hover Effect (Rose Border & Pink Glow)
    <div 
      className="group relative bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-[0_10px_40px_rgba(244,63,94,0.15)] hover:border-rose-300/50 transition-all duration-500 flex flex-col w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* IMAGE SECTION */}
      <div className="relative aspect-[4/5] w-full bg-stone-50 overflow-hidden">
        <Link href={`/product/${product.id}`} className="block h-full w-full">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-1000 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
        </Link>

        {/* Badges */}
       {/* Premium Badges */}
        {/* Luxury Badges - Top Left */}
        <div className="absolute top-0 left-0 p-3 flex flex-col gap-2 z-10 items-start">
            {product.tags?.slice(0, 2).map((tag: string, idx: number) => (
                <span 
                  key={idx} 
                  className={`
                    text-[8px] font-extrabold uppercase tracking-[0.2em] px-3 py-1.5 
                    rounded-[2px] backdrop-blur-sm transition-all duration-500
                    group-hover:translate-x-1 shadow-sm
                    ${getTagStyle(tag)}
                  `}
                >
                  {tag}
                </span>
            ))}
        </div>

        {/* ✅ CHANGE 2: Wishlist Icon Hover Color (Rose) */}
        <button 
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); toast.success("Saved"); }}
            className="absolute top-2.5 right-2.5 bg-white/90 p-2 rounded-full text-stone-600 hover:text-rose-600 shadow-sm z-20 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-x-10 md:group-hover:translate-x-0 active:scale-95"
        >
            <Heart className="w-4 h-4" />
        </button>

        {/* ✅ CHANGE 3: Desktop Quick Add Button Hover Color (Rose) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block z-20">
             <button onClick={handleAddToCart} disabled={isLoading || product.stock === 0} className="w-full bg-[#0a1f1c]/95 backdrop-blur text-white text-xs font-bold uppercase py-3 rounded-lg hover:bg-rose-600 transition-colors shadow-xl flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingBag className="w-3.5 h-3.5" /> Quick Add</>}
             </button>
        </div>
      </div>

      {/* DETAILS SECTION */}
      <div className="p-3 md:p-4 flex flex-col gap-2 flex-grow">
        
        {/* Header & Rating */}
        <div className="flex justify-between items-center">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">{product.category}</span>
            <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-full border border-rose-100 shadow-sm">
                <Star className="w-3 h-3 fill-rose-500 text-rose-500" />
                <span className="text-[10px] font-bold text-rose-700 leading-none pt-[1px]">4.8</span>
            </div>
        </div>

        {/* ✅ CHANGE 4: Title Hover Color (Deep Rose) */}
        <Link href={`/product/${product.id}`}>
            <h3 className="font-serif text-[#0a1f1c] text-base md:text-lg font-medium leading-snug group-hover:text-rose-700 transition-colors line-clamp-2 md:line-clamp-1">{product.name}</h3>
        </Link>

        {/* Gap Filler */}
        <div className="min-h-[20px] flex items-center">
             {product.stock > 0 && product.stock < 5 ? (
                 <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded w-fit"><span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>Only {product.stock} Left</p>
             ) : (
                 <div className="flex items-center gap-3 opacity-80"><span className="text-[10px] text-stone-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-stone-400" /> Certified</span><span className="text-[10px] text-stone-500 flex items-center gap-1"><Truck className="w-3 h-3 text-stone-400" /> Fast Del.</span></div>
             )}
        </div>

        {/* Footer: Price & Actions */}
        <div className="flex items-end justify-between mt-auto pt-2 border-t border-stone-100 md:border-none md:pt-1">
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2 flex-wrap">
                   <span className="text-lg md:text-xl font-bold text-[#0a1f1c] tracking-tight">
                    ₹{product.price.toLocaleString()}
                   </span>
                   {hasDiscount && (
                      <>
                        <span className="text-xs text-stone-400 line-through">₹{originalPrice.toLocaleString()}</span>
                        <span className="text-xs font-bold text-rose-600">({discount}% OFF)</span>
                      </>
                   )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {colors.length > 0 && (
                    <div className="flex -space-x-1.5">
                        {colors.slice(0, 3).map((color: string, i: number) => (
                            <div key={i} className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-stone-200 shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                        {colors.length > 3 && <div className="w-3.5 h-3.5 rounded-full bg-stone-100 flex items-center justify-center text-[8px] border border-white ring-1 ring-stone-200">+</div>}
                    </div>
                )}
                {/* ✅ CHANGE 5: Mobile Cart Button Active Color (Rose) */}
                <button onClick={handleAddToCart} disabled={isLoading} className="md:hidden w-8 h-8 rounded-full bg-[#0a1f1c] text-white flex items-center justify-center active:bg-rose-500 transition shadow-md">
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}