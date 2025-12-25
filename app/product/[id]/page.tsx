"use client";
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingBag, Heart, Star, ShieldCheck, Truck, RotateCcw, Ruler, Share2, 
  ChevronDown, Minus, Plus, Eye, Clock 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SizeGuide from '@/components/SizeGuide'; 
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews'; 

// --- HELPER: Calculate Delivery Date ---
const getDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5); 
    return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
};

export default function ProductPage() {
  const { id } = useParams();
  const { products, addToCart, toggleWishlist, wishlist, reviews } = useStore() as any;
  const [product, setProduct] = useState<any>(null);
  const [activeImg, setActiveImg] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  
  // States
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('desc');
  const [showStickyBar, setShowStickyBar] = useState(false);

  // 1. Fetch Product
  useEffect(() => {
    if (id && products.length > 0) {
        const found = products.find((p: any) => p.id === id);
        if (found) {
          setProduct(found);
          setActiveImg(found.image);
        }
    }
  }, [id, products]);

  // 2. Sticky Bar Scroll Logic
  useEffect(() => {
      const handleScroll = () => {
          if (window.scrollY > 600) setShowStickyBar(true);
          else setShowStickyBar(false);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!product) return <div className="min-h-screen pt-32 text-center text-stone-500 font-serif text-xl animate-pulse">Loading Luxury...</div>;

  // 3. Derived Variables
  const isWishlisted = wishlist.some((p: any) => p.id === product.id);
  const relatedProducts = products.filter((p: any) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const productReviews = reviews ? reviews.filter((r: any) => r.productId === product.id) : [];
  const ratingCount = productReviews.length;
  const averageRating = ratingCount > 0 ? (productReviews.reduce((a: any, b: any) => a + b.rating, 0) / ratingCount).toFixed(1) : 0;
  
  const stock = product.stock || 0;
  const isOutOfStock = stock <= 0;

  // ✅ 4. FIXED: ADD TO CART HANDLER
  const handleAddToCart = () => {
      // A. Stock Check
      if (isOutOfStock) {
          toast.error("Sorry, this item is out of stock.");
          return;
      }

      // B. Size Check (Sirf agar Necklace nahi hai to size maango)
      if (!selectedSize && product.category !== 'Necklace' && product.category !== 'Earrings') {
          toast.error("Please select a size first", {
              style: { border: '1px solid #ef4444', color: '#7f1d1d' },
              iconTheme: { primary: '#ef4444', secondary: '#FFFAEE' },
          });
          return;
      }
      
      // ✅ C. CORRECT FUNCTION CALL (Ye Line Sahi Ki Hai)
      // Pehle product, fir qty, fir size
      addToCart(product, qty, selectedSize);
      
      toast.success(`Added ${qty} x ${product.name} to bag`, {
          style: { border: '1px solid #0a1f1c', color: '#0a1f1c' },
          iconTheme: { primary: '#0a1f1c', secondary: '#fff' },
      });
  };

  return (
    <div className="bg-white min-h-screen pt-28 pb-20 relative">
      <SizeGuide isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} category={product.category} />

      {/* --- STICKY ACTION BAR --- */}
      <div className={`fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-stone-200 z-50 transform transition-transform duration-300 flex items-center justify-between px-4 md:px-8 py-3 ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex items-center gap-3">
              <img src={product.image} className="w-10 h-10 rounded object-cover" alt={product.name} />
              <div>
                  <h4 className="font-serif text-sm text-[#0a1f1c]">{product.name}</h4>
                  <p className="text-xs text-amber-600 font-bold">₹{product.price.toLocaleString()}</p>
              </div>
          </div>
          <button 
            onClick={handleAddToCart} 
            disabled={isOutOfStock}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition ${isOutOfStock ? 'bg-stone-300 cursor-not-allowed' : 'bg-[#0a1f1c] text-white hover:bg-amber-600'}`}
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="text-[10px] md:text-xs text-stone-400 mb-8 uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-amber-600 transition">Home</Link> / 
          <Link href={`/category/${product.category ? product.category.toLowerCase() : 'all'}`} className="hover:text-amber-600 transition">{product.category || 'Jewelry'}</Link> / 
          <span className="text-stone-900 font-bold line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          
          {/* LEFT: GALLERY (Col Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div 
                className="relative aspect-square w-full bg-stone-50 rounded-sm overflow-hidden cursor-zoom-in group"
                onClick={() => setIsZoomed(true)}
            >
              <Image src={activeImg || product.image} alt={product.name} fill className={`object-cover transition duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`} priority />
              {isOutOfStock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-white px-4 py-2 uppercase font-bold tracking-widest text-xs">Sold Out</span></div>}
              
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Eye className="w-3 h-3"/> Click to Zoom
              </div>
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 0 && (
                <div className="grid grid-cols-5 gap-4">
                  {[product.image, ...product.images].map((img: string, i: number) => (
                    <div key={i} onClick={() => setActiveImg(img)} className={`relative aspect-square cursor-pointer border transition-all ${activeImg === img ? 'border-[#0a1f1c] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <Image src={img} alt="Thumbnail" fill className="object-cover" />
                    </div>
                  ))}
                </div>
            )}
          </div>

          {/* RIGHT: INFO (Col Span 5) */}
          <div className="lg:col-span-5 sticky top-24 h-fit">
            
            {/* Scarcity */}
            {stock > 0 && stock < 5 && (
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                    <Clock className="w-3 h-3 animate-pulse"/> Only {stock} left in stock
                </div>
            )}

            <h1 className="font-serif text-3xl md:text-4xl text-[#0a1f1c] mb-2 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
               <div className="flex text-amber-500">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${Number(averageRating) >= s ? 'fill-current' : 'text-stone-200'}`} />)}</div>
               <span className="text-xs text-stone-400 hover:text-amber-600 cursor-pointer border-b border-transparent hover:border-amber-600 transition">{ratingCount} Verified Reviews</span>
            </div>

            <div className="flex items-end gap-4 mb-8">
               <span className="text-3xl font-serif text-[#0a1f1c]">₹{product.price.toLocaleString()}</span>
               <span className="text-lg text-stone-400 line-through mb-1">₹{(product.price * 1.25).toFixed(0)}</span>
               <span className="text-xs font-bold text-white bg-amber-500 px-2 py-1 rounded mb-2">20% OFF</span>
            </div>

            {/* --- SELECTION --- */}
            <div className="space-y-6 border-t border-b border-stone-100 py-8">
                
                {/* Size Selector */}
                {product.category !== 'Necklace' && product.category !== 'Earrings' && (
                    <div>
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-xs font-bold uppercase tracking-widest text-[#0a1f1c]">Select Size</span>
                           <button onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-1 text-xs text-amber-700 hover:underline"><Ruler className="w-3 h-3" /> Size Guide</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {['S', 'M', 'L', 'XL'].map(s => (
                              <button 
                                 key={s} 
                                 onClick={() => setSelectedSize(s)}
                                 className={`w-12 h-10 border text-sm font-medium transition-all ${selectedSize === s ? 'bg-[#0a1f1c] text-white border-[#0a1f1c]' : 'border-stone-200 text-stone-500 hover:border-[#0a1f1c]'}`}
                              >
                                 {s}
                              </button>
                           ))}
                        </div>
                    </div>
                )}

                {/* Buttons Group */}
                <div className="flex gap-4">
                   {/* Qty */}
                   <div className="flex items-center border border-stone-200 h-12 w-28 rounded-lg overflow-hidden">
                       <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-full flex items-center justify-center hover:bg-stone-50"><Minus className="w-3 h-3 text-stone-500"/></button>
                       <span className="flex-1 text-center text-sm font-bold">{qty}</span>
                       <button onClick={() => setQty(Math.min(stock > 0 ? stock : 1, qty + 1))} className="w-8 h-full flex items-center justify-center hover:bg-stone-50"><Plus className="w-3 h-3 text-stone-500"/></button>
                   </div>

                   {/* Add to Cart Button */}
                   <button 
                     onClick={handleAddToCart}
                     disabled={isOutOfStock}
                     className={`flex-1 h-12 uppercase tracking-[0.15em] text-xs font-bold transition shadow-xl flex items-center justify-center gap-3 ${isOutOfStock ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-[#0a1f1c] text-white hover:bg-amber-700'}`}
                   >
                     <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                   </button>
                   
                   {/* Wishlist */}
                   <button onClick={() => toggleWishlist(product)} className={`w-12 h-12 border flex items-center justify-center transition rounded-lg ${isWishlisted ? 'border-red-500 text-red-500 bg-red-50' : 'border-stone-200 text-stone-400 hover:border-red-500 hover:text-red-500'}`}>
                     <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                   </button>
                </div>
                
                {/* Delivery */}
                <div className="flex items-center gap-3 text-xs text-stone-500 bg-stone-50 p-3 rounded-lg">
                    <Truck className="w-4 h-4 text-green-600"/>
                    <span>Order now to get it by <span className="font-bold text-stone-800">{getDeliveryDate()}</span></span>
                </div>
            </div>

            {/* --- ACCORDION --- */}
            <div className="mt-8 space-y-2">
                <div className="border-b border-stone-100">
                    <button onClick={() => setOpenAccordion(openAccordion === 'desc' ? '' : 'desc')} className="w-full flex justify-between items-center py-4 text-sm font-bold uppercase tracking-wider">
                        Description <ChevronDown className={`w-4 h-4 transition ${openAccordion === 'desc' ? 'rotate-180' : ''}`}/>
                    </button>
                    {openAccordion === 'desc' && <p className="text-stone-600 text-sm leading-relaxed pb-4 animate-fade-in">{product.description}</p>}
                </div>
                
                <div className="border-b border-stone-100">
                    <button onClick={() => setOpenAccordion(openAccordion === 'mat' ? '' : 'mat')} className="w-full flex justify-between items-center py-4 text-sm font-bold uppercase tracking-wider">
                        Material & Care <ChevronDown className={`w-4 h-4 transition ${openAccordion === 'mat' ? 'rotate-180' : ''}`}/>
                    </button>
                    {openAccordion === 'mat' && <p className="text-stone-600 text-sm leading-relaxed pb-4 animate-fade-in">
                        Crafted with premium materials. Avoid contact with perfumes and water. Store in the provided luxury box.
                    </p>}
                </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8">
               <div className="text-center p-4 border border-stone-100 rounded-xl">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-stone-400" />
                  <p className="text-[9px] uppercase font-bold text-stone-600">Certified</p>
               </div>
               <div className="text-center p-4 border border-stone-100 rounded-xl">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-stone-400" />
                  <p className="text-[9px] uppercase font-bold text-stone-600">7-Day Returns</p>
               </div>
               <div className="text-center p-4 border border-stone-100 rounded-xl">
                  <Share2 className="w-6 h-6 mx-auto mb-2 text-stone-400" />
                  <p className="text-[9px] uppercase font-bold text-stone-600">Share</p>
               </div>
            </div>

          </div>
        </div>

        {/* --- REVIEWS --- */}
        <ProductReviews productId={product.id} />

        {/* RELATED --- */}
        {relatedProducts.length > 0 && (
           <div className="mt-24 border-t border-stone-200 pt-12">
              <div className="flex justify-between items-end mb-8">
                  <h2 className="font-serif text-2xl text-[#0a1f1c]">Complete the Look</h2>
                  <Link href="/category/all" className="text-xs font-bold uppercase border-b border-amber-500 pb-1">View All</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {relatedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
           </div>
        )}
      </div>

      {/* --- ZOOM MODAL --- */}
      {isZoomed && (
          <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center animate-in fade-in duration-300" onClick={() => setIsZoomed(false)}>
              <div className="relative w-full h-full p-4 md:p-10 flex items-center justify-center">
                  <Image src={activeImg || product.image} alt="Full Screen" fill className="object-contain" />
                  <button className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 p-2 rounded-full"><ChevronDown className="w-6 h-6 rotate-45"/></button>
              </div>
          </div>
      )}
    </div>
  );
}