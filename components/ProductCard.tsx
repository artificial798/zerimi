"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, Star, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

export default function ProductCard({ product }: { product: any }) {
  const { addToCart, addToWishlist } = useStore() as any;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Auto-Slideshow Logic (Hover karne par images badlengi)
  useEffect(() => {
    let interval: any;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      }, 1000); // Har 1 second mein image change hogi
    } else {
      setCurrentImageIndex(0); // Mouse hatate hi wapas pehli image
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  // Discount Calculation
 // ❌ PURANA CODE HATA DEIN: 
  // const originalPrice = product.price * 1.2;

  // ✅ NAYA CODE:
  const originalPrice = product.originalPrice || 0; // Database se lega
  const hasDiscount = originalPrice > product.price; // Check karega discount hai ya nahi
  const discount = hasDiscount ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0; 
  

  // Safe Image Source
  const displayImage = (product.images && product.images.length > 0) 
      ? product.images[currentImageIndex] 
      : product.image;

  return (
    <div 
      className="group relative bg-white rounded-xl overflow-hidden border border-stone-100 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-amber-500/20 transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* --- IMAGE SECTION --- */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 cursor-pointer">
        <Link href={`/product/${product.id}`}>
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-100'}`}
            />
        </Link>

        {/* ✅ BADGES & TAGS SECTION */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            
            {/* 1. Stock Badge */}
            {product.stock === 0 && (
                <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm shadow-md">Sold Out</span>
            )}

            {/* 2. ✅ DISCOUNT BADGE (Naya Logic) */}
            {/* Sirf tab dikhega jab stock ho AUR discount calculate hua ho */}
            {product.stock > 0 && hasDiscount && (
                <span className="bg-red-700 text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm shadow-md">
                    -{discount}%
                </span>
            )}

            {/* 3. Admin Custom Tags (New, Premium etc.) */}
            {product.tags && product.tags.map((tag: string, idx: number) => (
                <span 
                  key={idx} 
                  className={`text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm shadow-sm border ${
                      tag.toLowerCase() === 'premium' ? 'bg-[#0a1f1c] text-amber-400 border-amber-500/50' : 
                      tag.toLowerCase() === 'new' ? 'bg-amber-400 text-black border-amber-400' :
                      'bg-white/90 text-stone-800 border-stone-200 backdrop-blur-sm'
                  }`}
                >
                  {tag}
                </span>
            ))}
        </div>

        {/* Floating Actions (Right Side) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
             <button 
                onClick={(e) => { e.preventDefault(); addToWishlist(product); toast.success("Added to Wishlist"); }}
                className="bg-white text-stone-600 p-2.5 rounded-full hover:bg-[#0a1f1c] hover:text-amber-400 transition shadow-lg"
                title="Save for later"
             >
                <Heart className="w-4 h-4" />
             </button>
             <Link href={`/product/${product.id}`} className="bg-white text-stone-600 p-2.5 rounded-full hover:bg-[#0a1f1c] hover:text-amber-400 transition shadow-lg hidden md:block">
                <Eye className="w-4 h-4" />
             </Link>
        </div>

        {/* Quick Add Button (Desktop: Slide Up) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
             <button 
                onClick={(e) => { e.preventDefault(); addToCart(product); toast.success("Added to Bag"); }}
                className="w-full bg-[#0a1f1c] text-white text-xs font-bold uppercase py-3 rounded-lg hover:bg-amber-700 transition shadow-xl flex items-center justify-center gap-2"
             >
                <ShoppingBag className="w-3 h-3" /> Quick Add
             </button>
        </div>
      </div>

      {/* --- DETAILS SECTION --- */}
      <div className="p-4 bg-white relative">
        
        {/* Rating & Category */}
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">{product.category}</span>
            <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-[10px] text-stone-600 font-bold">4.8</span>
            </div>
        </div>

        {/* Title */}
        <Link href={`/product/${product.id}`} className="block mb-2">
            <h3 className="font-serif text-[#0a1f1c] text-lg leading-snug group-hover:text-amber-700 transition duration-300 line-clamp-1">
            {product.name}
            </h3>
        </Link>

        {/* Price Section */}
        <div className="flex items-center justify-between mt-3">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   {/* Selling Price (Jo customer pay karega) */}
                   <span className="text-lg font-bold text-[#0a1f1c]">₹{product.price.toLocaleString()}</span>
                   
                   {/* ✅ NAYA LOGIC: Original Price tabhi dikhega jab discount ho */}
                   {hasDiscount && (
                      <span className="text-xs text-stone-400 line-through decoration-red-400">₹{originalPrice.toLocaleString()}</span>
                   )}
                </div>
                <p className="text-[9px] text-green-600 font-bold uppercase tracking-wide">In Stock</p>
            </div>

            {/* Mobile: Direct Add Button (Jo aapne Bag wala lagaya tha) */}
            <button 
                onClick={(e) => { e.preventDefault(); addToCart(product); toast.success("Added"); }}
                className="md:hidden w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[#0a1f1c] active:bg-amber-500 active:text-white transition shadow-sm"
            >
                <ShoppingBag className="w-4 h-4" />
            </button>
        </div>

      </div>
    </div>
  );
}