"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Zap, Star, Loader2 } from 'lucide-react';
import { useStore, Product } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLACEHOLDER_IMG = "https://via.placeholder.com/600x800?text=ZERIMI+JEWELRY";

export default function ProductCard({ product }: { product: Product }) {
  // ✅ Safety Check
  if (!product) return null;

  const router = useRouter();
  const store = useStore() as any;
  const { addToCart, toggleWishlist, wishlist } = store;

  // --- LOCAL STATES ---
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // --- DATA ---
  const isWishlisted = wishlist ? wishlist.some((p: any) => p.id === product.id) : false;
  const isOutOfStock = !product.stock || product.stock <= 0;
  
  const displayImage = product.image && product.image.trim() !== "" ? product.image : PLACEHOLDER_IMG;
  const displayHoverImage = product.hoverImage && product.hoverImage.trim() !== "" ? product.hoverImage : null;

  const originalPrice = (product as any).originalPrice || 0;
  const hasDiscount = originalPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100) 
    : 0;

  // --- HANDLERS ---
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (isOutOfStock || addingToCart) return;

    setAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    addToCart(product);
    toast.success("Added to Bag", {
        style: { background: '#0a1f1c', color: '#fff' },
        iconTheme: { primary: '#fbbf24', secondary: '#0a1f1c' },
    });
    setAddingToCart(false);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (isOutOfStock || buyingNow) return;

    setBuyingNow(true);
    addToCart(product); 
    router.push('/checkout');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group bg-white border border-stone-100 rounded-xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* 1. IMAGE AREA */}
      <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-stone-50 cursor-pointer">
        
        {/* Main Image */}
        <Image 
          src={displayImage} 
          alt={product.name || "Product"} 
          fill 
          sizes="(max-width: 768px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-80' : ''} ${isImageLoading ? 'blur-md scale-110' : 'blur-0 scale-100'}`}
          onLoadingComplete={() => setIsImageLoading(false)}
        />
        
        {/* Hover Image (Hidden on Mobile, Visible on Desktop) */}
        {!isOutOfStock && displayHoverImage && (
           <Image 
             src={displayHoverImage} 
             alt={product.name} 
             fill 
             className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 hidden md:block" 
           />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
           {isOutOfStock ? (
              <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm shadow-sm">Sold Out</span>
           ) : (
              <>
                {hasDiscount && <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm shadow-sm">-{discountPercentage}%</span>}
                {product.tags?.includes('New') && <span className="bg-white/90 text-[#0a1f1c] text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm shadow-sm backdrop-blur">NEW</span>}
              </>
           )}
        </div>

        {/* Wishlist Button */}
        <button 
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur text-stone-500 flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-all z-20 active:scale-90"
        >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </Link>

      {/* 2. DETAILS AREA */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
         
         {/* Category & Rating */}
         <div className="flex justify-between items-center">
             <p className="text-[9px] text-stone-400 uppercase tracking-wider font-bold truncate">
                {product.category || 'Jewelry'}
             </p>
             <div className="flex items-center text-amber-500 gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-bold text-stone-600">4.8</span>
             </div>
         </div>
         
         {/* Title */}
         <Link href={`/product/${product.id}`}>
             <h3 className="font-serif text-sm text-[#0a1f1c] leading-tight line-clamp-2 min-h-[2.5em]" title={product.name}>
                {product.name}
             </h3>
         </Link>

         {/* Price */}
         <div className="flex items-center gap-2 mt-0.5 mb-2">
             <span className="text-sm md:text-base font-serif font-bold text-[#0a1f1c]">
                ₹{product.price.toLocaleString()}
             </span>
             {hasDiscount && (
                <span className="text-[10px] md:text-xs text-stone-400 line-through">
                    ₹{originalPrice.toLocaleString()}
                </span>
             )}
         </div>

         {/* ✅ 3. FIXED ACTION BUTTONS (MOBILE VISIBLE) 
            - Removed 'absolute' 
            - Removed 'hidden'
            - Added 'mt-auto' to push to bottom
         */}
         <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-stone-50">
            
            {/* Add To Cart */}
            <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className={`h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 border transition-all active:scale-95 ${
                    isOutOfStock 
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' 
                    : 'bg-white text-[#0a1f1c] border-stone-200 hover:border-[#0a1f1c] hover:bg-stone-50'
                }`}
            >
                {addingToCart ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ShoppingBag className="w-3.5 h-3.5"/>}
                <span className="truncate">Add</span>
            </button>
            
            {/* Buy Now */}
            <button 
                onClick={handleBuyNow}
                disabled={isOutOfStock || buyingNow}
                className={`h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm ${
                     isOutOfStock
                     ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                     : 'bg-[#0a1f1c] text-white hover:bg-amber-600'
                }`}
            >
                {buyingNow ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5 fill-current"/>}
                <span className="truncate">Buy</span>
            </button>
         </div>

      </div>
    </div>
  );
}