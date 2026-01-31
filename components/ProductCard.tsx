"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// ✅ 1. Added Share2 icon
import { Heart, Star, Loader2, Zap, Gift, Plus, Eye, Share2, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, wishlist } = useStore() as any;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCardGift, setIsCardGift] = useState(false);

  // --- 1. SMART CLICK NAVIGATION ---
  const handleCardClick = (e: any) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    router.push(`/product/${product.id}`);
  };

  // --- 2. ADD TO CART ---
  const handleAddToCart = (e: any) => {
    e.preventDefault(); 
    e.stopPropagation();

    const hasVariants = (product.colors && product.colors.length > 0) || 
                        (product.sizes && product.sizes.length > 0);

    if (hasVariants) {
        router.push(`/product/${product.id}`);
    } else {
        addToCart(product, 1, '', '', isCardGift);
    }
  };

  // ✅ 3. NEW SHARE FUNCTION
  const handleShare = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} - Amazing product!`,
          url: url,
        });
      } catch (err) {
        console.log('Sharing closed', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", {
        icon: '🔗',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    }
  };

  // --- 4. IMAGE SLIDESHOW ---
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
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100) 
    : 0;

  const displayImage = (product.images && product.images.length > 0) ? product.images[currentImageIndex] : product.image;
  const colors = product.colors || [];
  const isLiked = wishlist && wishlist.some((p: any) => p.id === product.id);

  // --- BADGE STYLING ---
  const getTagStyle = (tag: string) => {
    if (!tag) return "bg-white text-stone-900 border-stone-200";
    const t = tag.toLowerCase();
    if (t.includes('new')) return "bg-[#0a1f1c] text-white border-[#0a1f1c]";
    if (t.includes('sale') || t.includes('off')) return "bg-[#9f1239] text-white border-[#9f1239]";
    if (t.includes('best') || t.includes('trend')) return "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]";
    if (t.includes('premium') || t.includes('gold')) return "bg-gradient-to-r from-amber-100 to-[#f3eac2] text-[#856c26] border-[#d4af37]/30";
    return "bg-white text-stone-600 border-stone-200";
  };

  return (
   <div 
      onClick={handleCardClick} 
      className="group relative flex flex-col w-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* IMAGE AREA */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f9f9f9] rounded-xl border border-stone-100/50 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500">
        
        <Image
            src={displayImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition-transform duration-[1.5s] ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* TAGS (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
            {product.tags?.slice(0, 1).map((tag: string, idx: number) => (
                <span key={idx} className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border shadow-sm ${getTagStyle(tag)}`}>
                  {tag}
                </span>
            ))}
        </div>

        {/* ✅ ACTIONS GROUP (Top Right: Wishlist + Share) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-20">
            
            {/* Wishlist Button */}
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); toast.success(isLiked ? "Removed" : "Saved"); }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md text-stone-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
            >
                <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* ✅ NEW SHARE BUTTON */}
            <button 
                onClick={handleShare}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md text-stone-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm delay-75"
                title="Share"
            >
                <Share2 className="w-4 h-4" />
            </button>
        </div>

        {/* GIFT ICON (Bottom Left) */}
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCardGift(!isCardGift);
                toast.success(isCardGift ? "Gift Wrap Removed" : "Gift Wrap Added", { 
                    icon: isCardGift ? '❌' : '🎁',
                    style: { background: '#0a1f1c', color: '#fff', fontSize: '12px', border: '1px solid #d4af37' }
                });
            }}
            className={`absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm z-30
                ${isCardGift 
                    ? 'bg-[#0a1f1c] text-amber-400 border border-amber-500/50' 
                    : 'bg-white/80 text-stone-500 hover:bg-white hover:text-amber-600'
                }`}
            title="Add Gift Wrap"
        >
            <Gift className="w-3.5 h-3.5" />
        </button>

        {/* DESKTOP QUICK ADD */}
        <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hidden md:block">
             <button 
                onClick={handleAddToCart} 
                disabled={isLoading || product.stock === 0} 
                className={`w-full bg-white/95 backdrop-blur-xl text-[#0a1f1c] hover:bg-[#0a1f1c] hover:text-white text-[10px] font-bold uppercase py-3 border-t border-stone-100 transition-colors flex items-center justify-center gap-2 tracking-[0.2em] ${product.stock === 0 ? 'cursor-not-allowed opacity-70' : ''}`}
             >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                    product.stock === 0 ? "SOLD OUT" : 
                    ((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) ? "SELECT OPTIONS" : "QUICK ADD"
                )}
             </button>
        </div>
      </div>

    {/* DETAILS AREA */}
      <div className="pt-3 pb-2 flex flex-col gap-1 px-1">
        
        <div className="flex justify-between items-center opacity-70">
            <span className="text-[9px] text-stone-500 uppercase tracking-widest font-semibold truncate max-w-[70%]">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] text-stone-500 font-medium">4.8</span>
            </div>
        </div>

        <Link href={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-[#1c1917] text-sm md:text-[15px] leading-snug group-hover:text-[#d4af37] transition-colors line-clamp-1 mt-0.5 font-medium">
              {product.name}
            </h3>
        </Link>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
           <span className="text-sm md:text-base font-bold text-[#1c1917] tracking-tight">
            ₹{product.price.toLocaleString()}
           </span>
           
           {hasDiscount && (
              <>
                <span className="text-[10px] text-stone-400 line-through decoration-stone-300">
                  ₹{originalPrice.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded tracking-wider leading-none">
                    {discountPercentage}% OFF
                </span>
              </>
           )}
        </div>

        {/* 👇👇👇 यहाँ बदलाव किया है (Colors & Assured Badge) 👇👇👇 */}
        <div className="flex items-center justify-between mt-2 min-h-[22px]">
            {colors.length > 0 ? (
                <div className="flex -space-x-1.5 pl-0.5">
                    {colors.slice(0, 4).map((color: string, i: number) => (
                        <div key={i} className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-stone-200 shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                    {colors.length > 4 && <span className="text-[9px] text-stone-400 pl-2">+{colors.length - 4}</span>}
                </div>
            ) : (
                <div className="flex items-center gap-1 text-[9px] text-stone-400 font-medium">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> <span className="hidden md:inline">Express</span> Delivery
                </div>
            )}

{/* RIGHT SIDE: Smart Mobile Layout */}
            <div className="flex items-center gap-2">
                
                {/* 1. SIGNATURE BADGE */}
                {/* Logic: Mobile par agar Stock Kam (<5) hai, toh Badge HATA DO taaki Stock Alert dikhe */}
                <div className={`${(product.stock > 0 && product.stock < 5) ? 'hidden md:flex' : 'flex'} items-center gap-1 px-1.5 py-[2px] md:px-2 md:py-0.5 rounded-[3px] md:rounded-[4px] border border-[#C0A055] bg-gradient-to-r from-[#DFBD69] via-[#F9F2C5] to-[#DFBD69] shadow-sm`}>
                    <BadgeCheck className="w-2.5 h-2.5 text-[#5B3A0A] fill-[#5B3A0A]/10" strokeWidth={2.5} />
                    <span className="text-[7px] md:text-[8px] font-extrabold uppercase tracking-wide md:tracking-[0.2em] text-[#5B3A0A] leading-none pt-[1px]">
                        Signature
                    </span>
                </div>

                {/* 2. STOCK WARNING (Ab Mobile Par Bhi Dikhega) */}
                {/* Logic: Agar Stock < 5 hai, toh ye Mobile par Signature ki jagah le lega */}
                {product.stock > 0 && product.stock < 5 && (
                    <p className="text-[8px] md:text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 whitespace-nowrap animate-pulse">
                        Only {product.stock} Left
                    </p>
                )}

                {/* 3. ADD BUTTON (Same as before) */}
                <button 
                    onClick={handleAddToCart} 
                    disabled={product.stock === 0}
                    className={`md:hidden w-7 h-7 rounded-full flex items-center justify-center transition shadow-sm border ${product.stock === 0 ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-[#0a1f1c] text-white border-[#0a1f1c] active:scale-95'}`}
                >
                    {((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) ? <Eye className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}