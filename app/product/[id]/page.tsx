"use client";
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import ProductGallery from '@/components/ProductGallery';
import ProductReviews from '@/components/ProductReviews'; // ✅ NEW: Imported Component
import SizeGuide from '@/components/SizeGuide';           // ✅ NEW: Imported Component
import { 
  Star, Truck, ShieldCheck, Heart, Share2, 
  Minus, Plus, ShoppingBag, ChevronDown, User, RefreshCcw, Award, Gift, Headphones, 
  History, Clock, MessageCircle, Ruler, CheckCircle, Eye, ChevronRight // ✅ Ruler Icon & MessageCircle Added
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
export default function ProductPage() {
  const { id } = useParams();
  const { products, addToCart, toggleWishlist, currentUser } = useStore() as any;
  const [loading, setLoading] = useState(true);

  // --- STATE MANAGEMENT ---
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // ✅ NEW: SIZE STATE
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
// ✅ NEW: Fake Live Viewers (Random 15-40 log)
  const [viewers] = useState(Math.floor(Math.random() * (40 - 15 + 1)) + 15);
  const product = products.find((p: any) => p.id == id);
  const colors = product?.colors || [];
// --- GIFT MODE LOGIC ---
// 1. URL Check (kya card se click karke aaye hain?)
// --- GIFT MODE LOGIC (UPDATED) ---
const searchParams = useSearchParams(); // ✅ Next.js Hook use karein
const isAutoGift = searchParams.get('gift') === 'true';

// State initialize
const [isGiftWrapped, setIsGiftWrapped] = useState(false);

// Effect: Jaise hi URL load ho, check karein
useEffect(() => {
    if (isAutoGift) {
        setIsGiftWrapped(true);
        // Optional: Toast dikhana ho to
        // toast.success("Gift Mode Activated! 🎁");
    }
}, [isAutoGift]);

// Effect to auto-select if URL has ?gift=true

  // ✅ SMART SIZING LOGIC (Agar DB mein sizes nahi hain to Category ke hisab se dikhao)
 // ✅ SMART SIZING LOGIC (PRIORITY OVERRIDE)
  const productSizes = (() => {
      const cat = product?.category?.toLowerCase() || '';
      
      // ⚠️ FORCE FIX: Agar Earring hai, toh DB ka purana data IGNORE karo
      // Aur sirf ye Standard Sizes dikhao
      if (cat.includes('earring')) return ['Standard', 'Small', 'Medium', 'Large']; 

      // Baaki Categories ke liye: Agar DB mein sizes save hain, toh wo use karo
      if (product?.sizes && product.sizes.length > 0) return product.sizes;

      // Agar DB mein nahi hain, toh Auto-Detect karo
      if (cat.includes('ring')) return ['6', '7', '8', '9', '10', '12'];
      if (cat.includes('bangle') || cat.includes('bracelet')) return ['2.2', '2.4', '2.6', '2.8'];
      if (cat.includes('necklace') || cat.includes('chain')) return ['16"', '18"', '20"', '24"'];

      return []; 
  })();

  // --- LOADING & RECENTLY VIEWED LOGIC ---
// --- LOADING & RECENTLY VIEWED LOGIC (FIXED) ---
  useEffect(() => {
    // 1. Agar product mil gaya hai, toh turant Loading hata do (Smooth Transition)
    if (product) {
      setLoading(false);
      return;
    }

    // 2. Agar Products ki list database se aa chuki hai (length > 0), 
    //    lekin humara product (id ke hisab se) usme nahi hai -> Matlab Product exist nahi karta.
    if (products && products.length > 0 && !product) {
       setLoading(false); 
       return;
    }

    // 3. Safety Fallback: Agar 3 second tak bhi kuch nahi hua (Slow Net/Empty DB), 
    //    tab jaake Loading hatao taaki user atak na jaye.
    const timer = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(timer);
  }, [products, product]);

  useEffect(() => {
      if (product) {
          if (colors.length > 0) setSelectedColor(colors[0]);
          if (productSizes.length > 0) setSelectedSize(productSizes[0]); // Default Size Select
          
          const stored = JSON.parse(localStorage.getItem('recent_products') || '[]');
          const filtered = stored.filter((pid: string) => pid !== product.id);
          const updated = [product.id, ...filtered].slice(0, 6);
          localStorage.setItem('recent_products', JSON.stringify(updated));
      }
  }, [product]);

  useEffect(() => {
     if(products.length > 0) {
         const storedIds = JSON.parse(localStorage.getItem('recent_products') || '[]');
         const recentProds = storedIds.map((rid: string) => products.find((p: any) => p.id === rid)).filter(Boolean);
         setRecentlyViewed(recentProds.filter((p: any) => p.id != id));
     }
  }, [products, id]);


  const originalPrice = product?.originalPrice || 0;
  const hasDiscount = originalPrice > (product?.price || 0);

  // --- PINCODE LOGIC ---
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handlePincodeCheck = async () => {
    setDeliveryMsg("");
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pincode)) {
      setDeliveryMsg("❌ Invalid Pincode Format");
      return;
    }
    setIsChecking(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      setIsChecking(false);
      if (data[0].Status === "Success") {
        const city = data[0].PostOffice[0].District;
        const state = data[0].PostOffice[0].State;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5);
        const dateString = deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        setDeliveryMsg(`✅ Delivering to ${city}, ${state} by ${dateString}`);
      } else {
        setDeliveryMsg("❌ Service not available here.");
      }
    } catch (error) {
      setIsChecking(false);
      setDeliveryMsg("❌ Network Error. Try again.");
    }
  };

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<string | null>('details');

  // Helper for Premium Tags
  const getTagStyle = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('new')) return "bg-[#064e3b] text-white border-[#064e3b]";
    if (t.includes('sale') || t.includes('off')) return "bg-[#881337] text-white border-[#881337]";
    if (t.includes('best') || t.includes('trend')) return "bg-[#fffbeb] text-[#92400e] border-[#fcd34d]";
    if (t.includes('limited') || t.includes('premium')) return "bg-[#312e81] text-white border-[#312e81]";
    return "bg-white text-stone-800 border-stone-200";
  };

// ---------------------------------------------------------
  // ✨ SKELETON LOADING (Fake Product Effect)
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f2] pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Fake Image Block (Pulsing) */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-stone-200 rounded-3xl animate-pulse border border-stone-100 relative overflow-hidden">
               {/* Shimmer Effect */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
            </div>
            <div className="flex gap-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="w-20 h-20 bg-stone-200 rounded-xl animate-pulse"></div>
               ))}
            </div>
          </div>

          {/* Fake Text Details (Pulsing) */}
          <div className="space-y-8 py-8">
            <div className="space-y-4">
              <div className="h-4 w-24 bg-stone-200 rounded animate-pulse"></div> {/* Category */}
              <div className="h-10 w-3/4 bg-stone-300 rounded-lg animate-pulse"></div> {/* Title */}
              <div className="h-8 w-1/3 bg-amber-100 rounded-lg animate-pulse"></div> {/* Price */}
            </div>

            <div className="h-32 w-full bg-stone-100 rounded-2xl animate-pulse"></div> {/* Desc */}

            <div className="grid grid-cols-2 gap-4">
               <div className="h-14 bg-stone-200 rounded-xl animate-pulse"></div>
               <div className="h-14 bg-stone-800 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 🚫 PRODUCT NOT FOUND (Sirf tab aayega jab loading 100% khatam ho)
  // ---------------------------------------------------------
 // 🚫 PRODUCT NOT FOUND (Fixed: Using Link instead of Router)
  // ---------------------------------------------------------
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f5f2] text-center p-6">
        <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="text-4xl">💎</span>
        </div>
        <h2 className="text-3xl font-serif text-[#0a1f1c] mb-2">Item Discontinued</h2>
        <p className="text-stone-500 max-w-md mx-auto mb-8">
          This luxury piece is no longer in our showcase. It might have been sold out or moved to the archives.
        </p>
        {/* ✅ FIX: Button ki jagah Link use kiya hai */}
        <Link 
          href="/" 
          className="px-8 py-3 bg-[#0a1f1c] text-white rounded-lg uppercase tracking-widest text-xs font-bold hover:bg-amber-600 transition shadow-xl inline-block"
        >
          View Latest Collection
        </Link>
      </div>
    );
  }
  const galleryImages = (product.images && product.images.length > 0) ? product.images : [product.image];
  // ✅ NAYA LOGIC: Pehle Category check karega, agar nahi mila to koi bhi 4 products dikhayega
const similarProducts = (() => {
  // 1. Try finding products in same category (Case Insensitive)
  let similar = products.filter((p: any) => 
      p.category?.toLowerCase() === product.category?.toLowerCase() && p.id !== product.id
  );

  // 2. Agar 4 se kam mile, to baaki products fill kar do (Fallback)
  if (similar.length < 4) {
      const remaining = products.filter((p: any) => p.id !== product.id && !similar.includes(p));
      similar = [...similar, ...remaining];
  }

  // 3. Return top 4
  return similar.slice(0, 4);
})();

  return (
    <div className="min-h-screen bg-[#fcfbf9] pt-28 pb-20">
      
      {/* ✅ SIZE GUIDE MODAL */}
      <SizeGuide isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} category={product.category} />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* ✅ BREADCRUMBS (Navigation Path) */}
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-stone-400 mb-6">
            <Link href="/" className="hover:text-amber-600">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-amber-600">{product.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-800 line-clamp-1">{product.name}</span>
        </div>  
       {/* --- MAIN PRODUCT SECTION (Grid Balanced) --- */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 mb-8 relative">
 
  {/* LEFT: IMAGE GALLERY (STICKY & SIZED) */}
  {/* 'lg:col-span-6' kar diya (pehle 7 tha). 'max-w-2xl' se width control hogi. */}
  <div className="lg:col-span-6 h-fit lg:sticky lg:top-28 max-w-2xl mx-auto w-full">
     <ProductGallery images={galleryImages} />
  </div>

          {/* RIGHT: DETAILS */}
          <div className="lg:col-span-5 flex flex-col h-full justify-center">
             
             {/* Header */}
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em]">{product.category}</span>
                {/* Scroll to Reviews */}
                <button onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 group">
                    <div className="flex text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span className="text-xs text-stone-400 ml-2 group-hover:text-[#0a1f1c] transition border-b border-transparent group-hover:border-stone-800">Read Reviews</span>
                </button>
             </div>

             {/* Title */}
             <h1 className="font-serif text-3xl md:text-5xl text-[#0a1f1c] mb-3 leading-tight tracking-tight">{product.name}</h1>
             {/* ✅ LIVE VIEWERS (Social Proof) */}
             <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500 mb-4 animate-fade-in">
                <Eye className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                <span><strong className="text-stone-800">{viewers} people</strong> are viewing this product right now.</span>
             </div>
             {/* Tags */}
             {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                   {product.tags.map((tag: string, idx: number) => (
                      <span key={idx} className={`text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-sm border shadow-sm ${getTagStyle(tag)}`}>
                         {tag}
                      </span>
                   ))}
                </div>
             )}

           {/* Price Section (Updated: No Free Shipping Promise) */}
             <div className="mb-6 border-b border-stone-100 pb-5">
                <div className="flex items-end gap-3 mb-2">
                   <span className="text-3xl md:text-4xl font-serif text-[#0a1f1c]">
                       ₹{product.price.toLocaleString()}
                   </span>
                   {hasDiscount && (
                       <div className="flex flex-col mb-1 leading-none">
                           <span className="text-sm text-stone-400 line-through decoration-stone-300">
                               ₹{originalPrice.toLocaleString()}
                           </span>
                           <span className="text-[10px] font-bold text-rose-600 tracking-widest mt-0.5">
                               SAVE {Math.round(((originalPrice - product.price) / originalPrice) * 100)}%
                           </span>
                       </div>
                   )}
                </div>

                {/* ✅ GAP FILLER: Safe & Luxury Trust Line */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
                    <span>Inclusive of all taxes</span>
                    <span className="text-stone-300">•</span>
                    
                    {/* Yahan humne Safe Option dala hai */}
                    <span>Pan India Delivery</span>
                    
                    <span className="text-stone-300">•</span>
                    <span className="text-amber-700 font-bold">
                        EMI starts ₹{Math.round(product.price / 3)}/mo
                    </span>
                </div>
             </div>
             {/* ✅ 1. SIZE SELECTOR (With Guide Link) */}
             {productSizes.length > 0 && (
                 <div className="mb-6">
                     <div className="flex justify-between items-center mb-3">
                         <span className="text-xs font-bold text-[#0a1f1c] uppercase tracking-widest">
                             Select Size: <span className="text-stone-500 font-normal">{selectedSize}</span>
                         </span>
                         {/* Size Guide Trigger */}
                         <button 
                            onClick={() => setIsSizeGuideOpen(true)}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 hover:text-amber-800 border-b border-amber-200 hover:border-amber-600 transition"
                         >
                             <Ruler className="w-3 h-3" /> Size Guide
                         </button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {productSizes.map((size: string) => (
                             <button 
                                 key={size}
                                 onClick={() => setSelectedSize(size)}
                                 className={`h-10 min-w-[40px] px-2 rounded-lg border text-xs font-bold transition-all duration-300 ${
                                     selectedSize === size 
                                     ? 'bg-[#0a1f1c] text-white border-[#0a1f1c] shadow-md scale-105' 
                                     : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                 }`}
                             >
                                 {size}
                             </button>
                         ))}
                     </div>
                 </div>
             )}

             {/* ✅ 2. COLOR SELECTOR */}
             {colors.length > 0 && (
                 <div className="mb-8">
                     <span className="text-xs font-bold text-[#0a1f1c] uppercase tracking-widest block mb-3">
                         Finish / Color: <span className="text-stone-500 font-normal">{selectedColor}</span>
                     </span>
                     <div className="flex gap-3">
                         {colors.map((color: string, i: number) => (
                             <button 
                                 key={i}
                                 onClick={() => setSelectedColor(color)}
                                 className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${selectedColor === color ? 'border-[#0a1f1c] scale-110 shadow-lg' : 'border-stone-200 hover:border-stone-400'}`}
                                 style={{ backgroundColor: color }}
                                 title={color}
                             >
                                 {selectedColor === color && <span className="block w-full h-full rounded-full border-2 border-white"></span>}
                             </button>
                         ))}
                     </div>
                 </div>
             )}
{/* ✅ STOCK ALERT (Urgency) - Only shows if stock < 5 */}
             {product.stock > 0 && product.stock < 5 && (
                <div className="flex items-center gap-2 mb-4 text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg w-full animate-pulse">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Hurry! Only {product.stock} units left in stock</span>
                </div>
             )}
             {/* Actions */}
             <div className="flex flex-col gap-4 mb-8">
              {/* 🎁 SECRET GIFT TOGGLE (New Addition) */}
   <div 
     onClick={() => setIsGiftWrapped(!isGiftWrapped)}
     className={`relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-300 group ${isGiftWrapped ? 'bg-[#0a1f1c]/5 border-[#0a1f1c]' : 'bg-white border-stone-200 hover:border-amber-400'}`}
   >
      {/* Selection Indicator */}
      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isGiftWrapped ? 'bg-[#0a1f1c] border-[#0a1f1c]' : 'border-stone-300 bg-white'}`}>
          {isGiftWrapped && <CheckCircle className="w-3 h-3 text-white" />}
      </div>

      <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isGiftWrapped ? 'bg-[#0a1f1c] text-white' : 'bg-amber-50 text-amber-600'}`}>
              <Gift className="w-5 h-5" />
          </div>
          <div>
              <h4 className={`font-serif font-bold text-sm ${isGiftWrapped ? 'text-[#0a1f1c]' : 'text-stone-700'}`}>
                  Send as a Secret Gift?
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-[250px] leading-relaxed">
                  We will hide the invoice, remove price tags, and pack it in our signature luxury box.
              </p>
          </div>
      </div>
   </div>
   {/* -------------------------------------- */}
                <div className="flex gap-4">
                    {/* Qty */}
                   {/* ✅ Qty Selector (With Stock Limit Check) */}
<div className="flex items-center border border-stone-200 rounded-lg h-12">
   {/* Minus Button (Same rahega) */}
   <button 
       onClick={() => setQty(Math.max(1, qty-1))} 
       className="px-3 h-full hover:bg-stone-50 text-stone-500"
   >
       <Minus className="w-4 h-4"/>
   </button>

   {/* Quantity Display */}
   <span className="w-10 text-center font-bold text-sm">{qty}</span>

   {/* ✅ PLUS BUTTON (Logic Updated) */}
   <button 
       onClick={() => {
           const maxStock = product.stock || 0;
           // Check: Kya current qty stock se kam hai?
           if (qty < maxStock) {
               setQty(qty + 1);
           } else {
               // Agar limit cross ho rahi hai to Toast dikhao
               toast.error(`Only ${maxStock} units left in stock!`, {
                   style: { border: '1px solid #ef4444', color: '#ef4444' },
                   icon: '🚫'
               });
           }
       }} 
       // Visual Disable Logic: Agar qty == stock hai to button dhundhla (fade) ho jayega
       className={`px-3 h-full text-stone-500 transition 
           ${qty >= (product.stock || 0) 
               ? 'opacity-50 cursor-not-allowed' 
               : 'hover:bg-stone-50'
           }`}
   >
       <Plus className="w-4 h-4"/>
   </button>
</div>
                    
                    {/* Add to Cart */}
                    <button
                    onClick={() => {
  // ✅ Sahi Tareeka: Alag-alag arguments pass karein
  addToCart(
      product, 
      qty, 
      selectedSize || productSizes[0], 
      selectedColor || colors[0],
      isGiftWrapped
  ); 
  
}}
                      disabled={product.stock === 0}
                      className={`flex-1 text-white rounded-lg flex items-center justify-center gap-3 h-12 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 ${product.stock === 0 ? 'bg-stone-400 cursor-not-allowed' : 'bg-[#0a1f1c] hover:bg-amber-700'}`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span className="font-bold uppercase tracking-widest text-xs">
                          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </span>
                    </button>
                    
                    {/* Wishlist */}
                    <button onClick={() => { toggleWishlist(product); toast.success("Saved"); }} className="px-4 border border-stone-200 rounded-lg hover:border-red-400 hover:text-red-500 transition hover:shadow-lg h-12">
                       <Heart className="w-5 h-5" />
                    </button>
                </div>

                {/* ✅ WHATSAPP BUTTON (Restored & Premium) */}
        {/* --- 🛡️ ULTRA-PREMIUM PAYMENT TRUST STRIP --- */}
<div className="mt-8 relative group">
    
    {/* Background Glow (Subtle Gold) */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent rounded-xl opacity-50 blur-md pointer-events-none"></div>

    <div className="relative bg-white border border-amber-100 rounded-xl p-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        
        {/* Header with Lock Icon */}
        <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-1.5 bg-green-50 rounded-full border border-green-100">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-[0.2em]">
                Guaranteed Safe Checkout
            </span>
        </div>

        {/* Logos Grid (Mobile Friendly) */}
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-4">
            
            {/* UPI Apps */}
            <div className="h-8 px-3 border border-stone-100 rounded-lg flex items-center justify-center bg-stone-50/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-[70px]">
                <img src="https://cdn.worldvectorlogo.com/logos/google-pay-1.svg" alt="GPay" className="h-4 w-auto object-contain" />
            </div>
            <div className="h-8 px-3 border border-stone-100 rounded-lg flex items-center justify-center bg-stone-50/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-[70px]">
                <img src="https://cdn.worldvectorlogo.com/logos/phonepe-1.svg" alt="PhonePe" className="h-4 w-auto object-contain" />
            </div>
            <div className="h-8 px-3 border border-stone-100 rounded-lg flex items-center justify-center bg-stone-50/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-[70px]">
                <img src="https://cdn.worldvectorlogo.com/logos/paytm.svg" alt="Paytm" className="h-3 w-auto object-contain" />
            </div>

            {/* Cards */}
            <div className="h-8 px-3 border border-stone-100 rounded-lg flex items-center justify-center bg-stone-50/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-[60px]">
                <img src="https://cdn.worldvectorlogo.com/logos/visa-10.svg" alt="Visa" className="h-3 w-auto object-contain" />
            </div>
    
            <div className="h-8 px-3 border border-stone-100 rounded-lg flex items-center justify-center bg-stone-50/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-[60px]">
                {/* RuPay ka reliable SVG */}
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-3 w-auto object-contain" />
            </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-[9px] text-stone-400 font-medium pt-3 border-t border-stone-50">
            <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-amber-500" />
                Shipping Partners: <strong>Shiprocket & BlueDart</strong>
            </span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-stone-300"></span>
            <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                Payments Verified by <strong>Razorpay</strong>
            </span>
        </div>

    </div>
</div>
{/* --------------------------------------------------------- */}       
             </div>

             {/* Description Snippet */}
             <p className="text-stone-500 leading-relaxed mb-8 text-sm border-l-2 border-amber-500 pl-4">
               {product.description || `Handcrafted with precision, this piece embodies the essence of ${product.category}. Designed for the modern connoisseur.`}
             </p>

             {/* Delivery Checker */}
             <div className="mb-6 p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                     <Truck className="w-4 h-4 text-amber-600" />
                     <span className="text-[10px] font-bold text-[#0a1f1c] uppercase tracking-widest">Estimated Delivery</span>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="Enter Pincode" className="w-full border-b border-stone-200 py-2 text-sm outline-none focus:border-amber-500 bg-transparent placeholder:text-stone-300 font-mono" />
                    <button onClick={handlePincodeCheck} disabled={isChecking || pincode.length !== 6} className="text-xs font-bold uppercase text-amber-600 hover:text-amber-800 disabled:opacity-50">{isChecking ? "..." : "Check"}</button>
                  </div>
                  {deliveryMsg && <p className={`mt-2 text-[10px] font-bold ${deliveryMsg.includes("✅") ? "text-green-600" : "text-red-500"}`}>{deliveryMsg}</p>}
             </div>

             {/* Trust Grid */}
             <div className="grid grid-cols-3 gap-2 mb-8">
                 <TrustBadge icon={<ShieldCheck />} title="Secure" sub="Encrypted" />
                 <TrustBadge icon={<RefreshCcw />} title="Returns" sub="7 Days" />
                 <TrustBadge icon={<Award />} title="Quality" sub="Certified" />
             </div>

             {/* Accordions */}
             <div className="border-t border-stone-100 divide-y divide-stone-100">
                <AccordionItem title="Description & Details" isOpen={activeTab === 'details'} onClick={() => setActiveTab(activeTab === 'details' ? null : 'details')}>
                    <div className="text-sm text-stone-500 space-y-3 pb-2">
                        <p className="leading-relaxed">{product.description}</p>
                        <p className="text-xs"><strong>Material:</strong> {product.material || "Premium Alloy"}</p>
                    </div>
                </AccordionItem>
                <AccordionItem title="Warranty & Care" isOpen={activeTab === 'care'} onClick={() => setActiveTab(activeTab === 'care' ? null : 'care')}>
                     <p className="text-sm text-stone-500">6 Months warranty on plating. Avoid perfumes & water.</p>
                </AccordionItem>
             </div>

          </div>
        </div>

        {/* --- ✅ INTEGRATED REVIEWS SECTION (Using ProductReviews.tsx) --- */}
       <div className="mb-8">
    <ProductReviews productId={product.id} />
</div>

        {/* --- SIMILAR PRODUCTS --- */}
        {similarProducts.length > 0 && (
           <div className="border-t border-stone-200 pt-8 mb-20">
              <h2 className="font-serif text-3xl text-center mb-10 text-[#0a1f1c]">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {similarProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
           </div>
        )}

        {/* --- RECENTLY VIEWED --- */}
        {recentlyViewed.length > 0 && (
           <div className="border-t border-stone-200 pt-16">
              <div className="flex items-center justify-center gap-2 mb-10">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h2 className="font-serif text-3xl text-[#0a1f1c]">Recently Viewed</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {recentlyViewed.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
           </div>
        )}

      </div>
    </div>
  );
}

// Minimal Components
function TrustBadge({ icon, title, sub }: any) {
    return (
        <div className="flex flex-col items-center justify-center p-3 bg-stone-50 rounded-lg text-center border border-stone-100">
            <div className="text-stone-700 mb-1">{icon}</div>
            <span className="text-[10px] font-bold uppercase text-[#0a1f1c]">{title}</span>
            <span className="text-[9px] text-stone-400">{sub}</span>
        </div>
    )
}

function AccordionItem({ title, children, isOpen, onClick }: any) {
   return (
      <div>
         <button onClick={onClick} className="w-full flex justify-between items-center py-4 text-left group">
            <span className="font-serif font-bold text-[#0a1f1c] group-hover:text-amber-700 transition text-sm">{title}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
         </button>
         <AnimatePresence>
            {isOpen && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pb-4">{children}</div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}