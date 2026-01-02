"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, Star, Loader2 } from 'lucide-react'; // Loader2 add kiya
import { useStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation'; // ✅ Add this

export default function ProductCard({ product }: { product: any }) {
  const router = useRouter();
  const { addToCart, toggleWishlist } = useStore() as any;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✅ Loading State
  
  // ✅ Handle Add to Cart with Loading Effect
  const handleAddToCart = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for premium feel (optional)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addToCart(product);
    toast.success("Added to Bag");
    setIsLoading(false);
  };

  // ✅ Auto-Slideshow Logic
  useEffect(() => {
    let interval: any;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      }, 1200); // Thoda slow kiya luxury feel ke liye
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  // Price Logic
  const originalPrice = product.originalPrice || 0;
  const hasDiscount = originalPrice > product.price;
  const discount = hasDiscount ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
  
  const displayImage = (product.images && product.images.length > 0) 
      ? product.images[currentImageIndex] 
      : product.image;

  // ✅ Mock Colors (Agar database me nahi hai to default dikhane ke liye)
 // ✅ Default colors hata diye, ab agar DB me nahi hai to khali array rahega
const colors = product.colors || [];
// ✅ HELPER: PREMIUM TAG COLORS
  const getTagStyle = (tag: string) => {
    if (!tag) return "bg-white/90 text-stone-800 border-stone-200"; // Safety check
    const t = tag.toLowerCase();
    
    // 1. NEW (Emerald Green)
    if (t.includes('new')) return "bg-[#064e3b] text-white border-[#064e3b]";
    
    // 2. SALE / OFF (Rich Red)
    if (t.includes('sale') || t.includes('off')) return "bg-[#881337] text-white border-[#881337]";
    
    // 3. BEST SELLER / TRENDING (Gold/Amber)
    if (t.includes('best') || t.includes('trend')) return "bg-[#fffbeb] text-[#92400e] border-[#fcd34d]";
    
    // 4. LIMITED / PREMIUM (Royal Blue)
    if (t.includes('limited') || t.includes('premium')) return "bg-[#312e81] text-white border-[#312e81]";
    
    // 5. SOLD OUT (Dark Grey)
    if (t.includes('sold')) return "bg-stone-800 text-white border-stone-800";

    // DEFAULT (White Glassmorphism)
    return "bg-white/90 backdrop-blur-md text-stone-800 border border-stone-200";
  };

  return (
    <div 
      className="group relative bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:border-amber-500/30 transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* --- IMAGE SECTION --- */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-50">
        <Link href={`/product/${product.id}`} className="block h-full w-full">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-1000 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
            {product.stock === 0 ? (
                <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm">Sold Out</span>
            ) : product.stock < 5 ? (
                // ✅ SCARCITY BADGE (Low Stock)
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm">
                    Only {product.stock} Left
                </span>
            ) : null}

            {product.stock > 0 && hasDiscount && (
                <span className="bg-red-700 text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm">
                    -{discount}%
                </span>
            )}

           {product.tags?.map((tag: string, idx: number) => (
                <span 
                  key={idx} 
                  className={`text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm border shadow-sm ${getTagStyle(tag)}`}
                >
                  {tag}
                </span>
            ))}
        </div>

        {/* Floating Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 z-10">
             <button 
                onClick={(e) => { e.preventDefault(); toggleWishlist(product); toast.success("Saved"); }}
                className="bg-white text-stone-600 p-2.5 rounded-full hover:bg-[#0a1f1c] hover:text-amber-400 transition shadow-lg hover:scale-110"
             >
                <Heart className="w-4 h-4" />
             </button>
             {/* Quick View Button */}
             <button 
                onClick={(e) => {
                    e.preventDefault(); // Link click hone se rokega
                    e.stopPropagation(); // Bubbling rokega
                    router.push(`/product/${product.id}`); // ✅ Product Page par bhejega
                }}
                className="bg-white text-stone-600 p-2.5 rounded-full hover:bg-[#0a1f1c] hover:text-amber-400 transition shadow-lg hover:scale-110 hidden md:block"
             >
                <Eye className="w-4 h-4" />
             </button>
        </div>

        {/* ✅ QUICK ADD BUTTON (With Loading) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block z-20">
             <button 
                onClick={handleAddToCart}
                disabled={isLoading || product.stock === 0}
                className="w-full bg-[#0a1f1c]/95 backdrop-blur text-white text-xs font-bold uppercase py-3.5 rounded-lg hover:bg-amber-600 transition-colors shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <ShoppingBag className="w-3.5 h-3.5" /> 
                        {product.stock === 0 ? "Out of Stock" : "Quick Add"}
                    </>
                )}
             </button>
        </div>
      </div>

      {/* --- DETAILS SECTION --- */}
      <div className="p-4 bg-white relative">
        
        {/* ✅ COLOR / VARIANT SWATCHES (Standard in Luxury) */}
        {/* Yeh dikhata hai ki product ke aur options hain */}
       {/* ✅ COLOR / VARIANT SWATCHES (Sirf tab dikhega jab colors honge) */}
        {colors.length > 0 ? (
            <div className="flex gap-1.5 mb-3 h-3">
                {colors.slice(0, 4).map((color: string, i: number) => (
                    <button 
                        key={i}
                        className={`w-3 h-3 rounded-full border border-stone-300 hover:scale-125 transition-transform ring-1 ring-offset-1 ${i===0 ? 'ring-stone-300' : 'ring-transparent'}`}
                        style={{ backgroundColor: color }}
                        title="View Color"
                    />
                ))}
                {colors.length > 4 && <span className="text-[9px] text-stone-400">+More</span>}
            </div>
        ) : (
            // Agar colors nahi hain, to layout maintain rakhne ke liye khali jagah (Optional)
            // Agar aap chahte hain ki gap na rahe, to is div ko hata kar null likh dein.
            <div className="mb-3 h-3"></div> 
        )}
        {/* Title & Category */}
        <div className="mb-1">
             <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">{product.category}</span>
             <Link href={`/product/${product.id}`} className="block mt-1">
                <h3 className="font-serif text-[#0a1f1c] text-lg font-medium leading-tight group-hover:text-amber-700 transition-colors line-clamp-1">
                {product.name}
                </h3>
            </Link>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
             <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
             <span className="text-[10px] text-stone-600 font-bold mt-0.5">4.8 (120 reviews)</span>
        </div>

        {/* Price & Mobile Action */}
        <div className="flex items-end justify-between border-t border-stone-100 pt-3 mt-1">
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                   <span className="text-lg font-bold text-[#0a1f1c] tracking-tight">₹{product.price.toLocaleString()}</span>
                   {hasDiscount && (
                      <span className="text-xs text-stone-400 line-through">₹{originalPrice.toLocaleString()}</span>
                   )}
                </div>
            </div>

            {/* Mobile Cart Button (Icon Only) */}
            <button 
                onClick={handleAddToCart}
                disabled={isLoading}
                className="md:hidden w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-[#0a1f1c] active:bg-amber-500 active:text-white transition shadow-sm border border-stone-200"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
            </button>
        </div>

      </div>
    </div>
  );
}