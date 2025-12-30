"use client";
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import ProductGallery from '@/components/ProductGallery';
import ProductCard from '@/components/ProductCard';
import { 
  Star, Truck, ShieldCheck, Heart, Share2, 
  Minus, Plus, ShoppingBag, ChevronDown, User,RefreshCcw, Award, Gift, Headphones 
} from 'lucide-react'; // ✅ User icon add kiya
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams();
  
  // ✅ Store se zaroori cheezein nikali
  const { products, reviews, addToCart, toggleWishlist, currentUser, addReview } = useStore() as any;
  
  const product = products.find((p: any) => p.id == id);
  // ✅ YE LOGIC ADD KAREIN (Return se pehle)
const originalPrice = product?.originalPrice || 0;
const hasDiscount = originalPrice > (product?.price || 0);
// ... purana code ...
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [isChecking, setIsChecking] = useState(false); // ✅ Loader State

  // ✅ REAL INDIA POST API LOGIC
  const handlePincodeCheck = async () => {
    setDeliveryMsg(""); // Reset msg
    
    // 1. Validation (Must be 6 digits)
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pincode)) {
      setDeliveryMsg("❌ Invalid Pincode Format");
      return;
    }

    setIsChecking(true); // Loader Start

    try {
      // 🌍 Call Free API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      setIsChecking(false); // Loader Stop

      if (data[0].Status === "Success") {
        const city = data[0].PostOffice[0].District;
        const state = data[0].PostOffice[0].State;

        // Date Logic (Current Date + 5 Days)
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5);
        const dateString = deliveryDate.toLocaleDateString('en-IN', { 
          weekday: 'short', month: 'short', day: 'numeric' 
        });

        setDeliveryMsg(`✅ Delivering to ${city}, ${state} by ${dateString}`);
      } else {
        setDeliveryMsg("❌ Service not available here.");
      }
    } catch (error) {
      setIsChecking(false);
      setDeliveryMsg("❌ Network Error. Try again.");
    }
  };

// ...
  // Filter Reviews for this specific product
  const productReviews = reviews ? reviews.filter((r: any) => r.productId === product?.id) : [];

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<string | null>('details');

  // --- 👇 REVIEW LOGIC START (Ye missing tha) 👇 ---
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmitReview = async () => {
      if (!currentUser) return toast.error("Please login to write a review.");
      if (userRating === 0) return toast.error("Please select a rating.");
      if (!reviewText.trim()) return toast.error("Please write a comment.");

      const newReview = {
          id: Date.now().toString(),
          productId: product.id,
          userName: currentUser.name,
          rating: userRating,
          comment: reviewText,
          date: new Date().toLocaleDateString()
      };

      await addReview(newReview);
      toast.success("Review Submitted!");
      setReviewText('');
      setUserRating(0);
  };
  // --- 👆 REVIEW LOGIC END 👆 ---

  if (!product) return <div className="text-center py-20">Product not found</div>;

  // Real Images Logic
  const galleryImages = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.image];

  // Similar Products Logic
  const similarProducts = products.filter((p: any) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#fcfbf9] pt-28 pb-20">
      
      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- MAIN PRODUCT SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
         

          {/* LEFT: IMAGE GALLERY */}
          <div>
             <ProductGallery images={galleryImages} />
          </div>

          {/* RIGHT: DETAILS */}
          <div className="flex flex-col h-full justify-center">
             
             {/* Breadcrumbs & Rating */}
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-stone-500 uppercase tracking-widest">{product.category} Collection</span>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-700 text-xs font-bold">
                   <Star className="w-3 h-3 fill-amber-700" /> {productReviews.length > 0 ? '4.9' : 'New'} ({productReviews.length} Reviews)
                </div>
             </div>

             {/* TAGS DISPLAY */}
             {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                   {product.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-widest rounded-full">
                         {tag}
                      </span>
                   ))}
                </div>
             )}

             <h1 className="font-serif text-4xl md:text-5xl text-[#0a1f1c] mb-4 leading-tight">{product.name}</h1>
             
             <div className="flex items-center gap-4 mb-8">
   {/* Current Price */}
   <span className="text-2xl font-serif text-[#0a1f1c]">₹{product.price.toLocaleString()}</span>
   
   {/* Discount Logic: Sirf tab dikhega jab Original Price set ho */}
   {hasDiscount && (
      <>
          <span className="text-lg text-stone-400 line-through">₹{originalPrice.toLocaleString()}</span>
          <span className="text-xs font-bold bg-[#0a1f1c] text-white px-2 py-1 rounded">
              {Math.round(((originalPrice - product.price) / originalPrice) * 100)}% OFF
          </span>
      </>
   )}
</div>

             {/* Admin Description */}
             <p className="text-stone-600 leading-relaxed mb-8 text-sm">
               {product.description || `Handcrafted with precision, this piece embodies the essence of ${product.category}. Designed for the modern connoisseur, it features premium materials and a timeless silhouette.`}
             </p>

             {/* Actions */}
             <div className="flex gap-4 mb-8">
                <div className="flex items-center border border-stone-300 rounded-lg">
                   <button onClick={() => setQty(Math.max(1, qty-1))} className="p-3 hover:bg-stone-100"><Minus className="w-4 h-4"/></button>
                   <span className="w-12 text-center font-bold">{qty}</span>
                   <button onClick={() => setQty(qty+1)} className="p-3 hover:bg-stone-100"><Plus className="w-4 h-4"/></button>
                </div>
                <button
  onClick={() => {
    addToCart(product);
    toast.success("Added to Bag");
  }}
  className="flex-1 bg-[#0a1f1c] text-white rounded-lg flex items-center justify-center gap-2 py-3"
>
  {/* 🖥 Desktop: Icon + Text */}
  <span className="hidden md:flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
    <ShoppingBag className="w-4 h-4" />
    Add to Cart
  </span>

  {/* 📱 Mobile: Icon only */}
  <span className="flex md:hidden">
    <ShoppingBag className="w-5 h-5" />
  </span>
</button>

                
                <button 
                  onClick={() => { toggleWishlist (product); toast.success("Saved to Wishlist"); }}
                  className="p-3 border border-stone-300 rounded-lg hover:border-red-400 hover:text-red-500 transition"
                >
                   <Heart className="w-5 h-5" />
                </button>
                <button
  onClick={() => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check this product on ZERIMI`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied!");
    }
  }}
  className="p-3 border border-stone-300 rounded-lg hover:bg-stone-100 transition"
>
  <Share2 className="w-5 h-5" />
</button>

             </div>
             <a
  href={`https://wa.me/918077162909?HI=${encodeURIComponent(
    `Hi, I want to know about ${product.name}\n${window.location.href}`
  )}`}
  target="_blank"
  className="inline-flex items-center gap-2 text-green-600 text-sm font-bold mt-3 hover:underline"
>
  💬 Ask on WhatsApp
</a>
{/* ✅ PREMIUM DELIVERY CHECKER */}
<div className="mb-2 p-5 bg-stone-50 rounded-xl border border-stone-100">
  <div className="flex items-center gap-2 mb-3">
     <Truck className="w-4 h-4 text-[#0a1f1c]" />
     <span className="text-xs font-bold text-[#0a1f1c] uppercase tracking-widest">Check Delivery Date</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="relative flex-1">
      <input
        type="text"
        maxLength={6}
        value={pincode}
        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} // Sirf numbers allow
        placeholder="Enter Pincode"
        className="w-full border border-stone-300 pl-4 pr-4 py-3 rounded-lg text-sm outline-none focus:border-[#0a1f1c] focus:ring-1 focus:ring-[#0a1f1c] transition bg-white"
      />
    </div>

    <button
      onClick={handlePincodeCheck}
      disabled={isChecking || pincode.length !== 6}
      className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-sm ${
        isChecking || pincode.length !== 6
          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
          : 'bg-[#0a1f1c] text-white hover:bg-amber-700'
      }`}
    >
      {isChecking ? "Checking..." : "Check"}
    </button>
  </div>

  {/* RESULT MESSAGE DISPLAY */}
  {deliveryMsg && (
    <div className={`mt-3 p-3 rounded-lg text-xs font-bold flex items-start gap-2 border animate-in fade-in slide-in-from-top-1 ${
      deliveryMsg.includes("✅") 
        ? "bg-green-50 text-green-800 border-green-200" 
        : "bg-red-50 text-red-800 border-red-200"
    }`}>
      <span className="text-sm mt-0.5">{deliveryMsg.includes("✅") ? "🚚" : "⚠️"}</span>
      <span>{deliveryMsg.replace("✅ ", "").replace("❌ ", "")}</span>
    </div>
  )}
</div>
             <div className="flex gap-0 mt-0 text-xs text-stone-400">
{/* ✅ NEW: PREMIUM TRUST GRID (6 POINTS) */}
<div className="bg-stone-50 rounded-xl p-5 border border-stone-100 mt-2 mb-2">
  <h4 className="text-xs font-bold text-center text-stone-400 uppercase tracking-widest mb-4">Why Choose ZERIMI?</h4>
  
  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
    
    {/* 1. Secure Payment */}
    <div className="flex items-start gap-3">
       <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5" strokeWidth={1.5} />
       <div>
          <span className="block text-xs font-bold text-[#0a1f1c] uppercase">100% Secure</span>
          <span className="text-[10px] text-stone-500 leading-tight">Encrypted Payments</span>
       </div>
    </div>

    {/* 2. Fast Shipping */}
    <div className="flex items-start gap-3">
       <Truck className="w-5 h-5 text-blue-700 mt-0.5" strokeWidth={1.5} />
       <div>
          <span className="block text-xs font-bold text-[#0a1f1c] uppercase">Fast Delivery</span>
          <span className="text-[10px] text-stone-500 leading-tight">Within 3-5 Days</span>
       </div>
    </div>

    {/* 3. Easy Returns */}
    <div className="flex items-start gap-3">
       <RefreshCcw className="w-5 h-5 text-rose-700 mt-0.5" strokeWidth={1.5} />
       <div>
          <span className="block text-xs font-bold text-[#0a1f1c] uppercase">Easy Returns</span>
          <span className="text-[10px] text-stone-500 leading-tight">7 Days Policy</span>
       </div>
    </div>

    {/* 4. Premium Quality (Jewelry Specific) */}
    <div className="flex items-start gap-3">
       <Award className="w-5 h-5 text-amber-600 mt-0.5" strokeWidth={1.5} />
       <div>
          <span className="block text-xs font-bold text-[#0a1f1c] uppercase">Top Quality</span>
          <span className="text-[10px] text-stone-500 leading-tight">Handpicked & Verified</span>
       </div>
    </div>

    {/* 5. Luxury Packaging */}
    <div className="flex items-start gap-3">
       <Gift className="w-5 h-5 text-purple-700 mt-0.5" strokeWidth={1.5} />
       <div>
          <span className="block text-xs font-bold text-[#0a1f1c] uppercase">Gift Ready</span>
          <span className="text-[10px] text-stone-500 leading-tight">Premium Box Packaging</span>
       </div>
    </div>

    {/* 6. Support */}
    <div className="flex items-start gap-3">
       <Headphones className="w-5 h-5 text-stone-700 mt-0.5" strokeWidth={1.5} />
       <div>
          <span className="block text-xs font-bold text-[#0a1f1c] uppercase">Help Center</span>
          <span className="text-[10px] text-stone-500 leading-tight">Support via WhatsApp</span>
       </div>
    </div>

  </div>
</div>
</div>



             {/* ACCORDIONS (Details, Warranty etc.) */}
             <div className="border-t border-stone-200 divide-y divide-stone-200">
                
                <AccordionItem title="Description & Details" isOpen={activeTab === 'details'} onClick={() => setActiveTab(activeTab === 'details' ? null : 'details')}>
                    <div className="text-sm text-stone-500 space-y-3 pb-2">
                        <p className="leading-relaxed">
                            {product.description || `Handcrafted with precision, this piece embodies the essence of ${product.category}.`}
                        </p>
                        <div className="bg-stone-50 p-3 rounded-lg mt-2">
                            <p className="text-xs font-bold text-[#0a1f1c] uppercase mb-1">Material Composition</p>
                            <p>{product.material || "Premium Quality Brass / Copper Alloy"}</p>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Warranty & Care" isOpen={activeTab === 'care'} onClick={() => setActiveTab(activeTab === 'care' ? null : 'care')}>
                    <div className="text-sm text-stone-500 space-y-3 pb-2">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-[#0a1f1c] block text-xs uppercase">Warranty Coverage</span>
                                <span>{product.warranty || "6 Months Polish Warranty"}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 border-t border-stone-100 pt-3">
                            <div className="w-5 h-5 flex items-center justify-center text-amber-600 font-bold border border-amber-600 rounded-full text-[10px] flex-shrink-0 mt-0.5">!</div>
                            <div>
                                <span className="font-bold text-[#0a1f1c] block text-xs uppercase">Care Instructions</span>
                                <span>{product.care || "Keep away from perfumes, water, and sprays."}</span>
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Shipping & Returns" isOpen={activeTab === 'shipping'} onClick={() => setActiveTab(activeTab === 'shipping' ? null : 'shipping')}>
                    <div className="text-sm text-stone-500 flex items-start gap-3">
                        <Truck className="w-5 h-5 text-[#0a1f1c] flex-shrink-0" />
                        <p>Free express shipping on all orders above ₹999. Returns accepted within 7 days.</p>
                    </div>
                </AccordionItem>
             </div>


             {/* 👇👇👇 REVIEWS SECTION (Yahan Add Kar Diya Hai) 👇👇👇 */}
             <div className="border-t border-stone-200 pt-10 mt-10">
                <h3 className="font-serif text-2xl text-[#0a1f1c] mb-6">Customer Reviews</h3>

                {/* WRITE A REVIEW FORM */}
                <div className="bg-stone-50 p-6 rounded-xl mb-10 border border-stone-100">
                   <h4 className="font-bold text-sm text-[#0a1f1c] uppercase tracking-widest mb-4">Write a Review</h4>
                   <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                         <button key={star} onClick={() => setUserRating(star)} className="transition-transform hover:scale-110">
                            <Star className={`w-6 h-6 ${star <= userRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} />
                         </button>
                      ))}
                   </div>
                   <textarea 
                      className="w-full p-4 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500 transition resize-none h-24 mb-4"
                      placeholder="Share your experience..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                   />
                   <button onClick={handleSubmitReview} className="bg-[#0a1f1c] text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition">
                      Submit Review
                   </button>
                </div>

                {/* REVIEWS LIST */}
                <div className="space-y-6">
                   {productReviews.length === 0 ? (
                      <p className="text-stone-400 text-sm italic">No reviews yet.</p>
                   ) : (
                      productReviews.map((review: any) => (
                         <div key={review.id} className="border-b border-stone-100 pb-6 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-stone-500">
                                     <User className="w-4 h-4" />
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm text-[#0a1f1c]">{review.userName}</p>
                                     <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                           <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`} />
                                        ))}
                                     </div>
                                  </div>
                               </div>
                               <span className="text-xs text-stone-400">{review.date}</span>
                            </div>
                            <p className="text-stone-600 text-sm leading-relaxed ml-11">{review.comment}</p>
                         </div>
                      ))
                   )}
                </div>
             </div>
             {/* 👆👆👆 REVIEWS SECTION END 👆👆👆 */}

          </div>
        </div>

        {/* --- SIMILAR PRODUCTS --- */}
        {similarProducts.length > 0 && (
           <div className="border-t border-stone-200 pt-16">
              <h2 className="font-serif text-3xl text-center mb-10 text-[#0a1f1c]">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {similarProducts.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                 ))}
              </div>
           </div>
        )}

      </div>
    </div>
  );
}

// Helper Component for Accordion
function AccordionItem({ title, children, isOpen, onClick }: any) {
   return (
      <div>
         <button onClick={onClick} className="w-full flex justify-between items-center py-4 text-left group">
            <span className="font-serif font-bold text-[#0a1f1c] group-hover:text-amber-700 transition">{title}</span>
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