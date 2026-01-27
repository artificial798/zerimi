"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCw, Lock, Gift, EyeOff } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import PremiumMarquee from '@/components/PremiumMarquee';

// ✅ FIX: Fallback Image
const FALLBACK_IMAGE = "https://via.placeholder.com/1920x1080?text=ZERIMI+JEWELRY";

export default function Home() {
  const store = useStore() as any;
  
  // Safe destructuring
  const { products, banner, categories, featuredSection, promoSection, blogs, siteText } = store || {};
// ✅ YE LINE ADD KAREIN (New Arrivals Logic)
  // 1. Check karo products hain ya nahi
  // 2. Copy karo [...products]
  // 3. Reverse karo (Taaki naye wale sabse upar aa jayein)
  // 4. Pehle 8 items lelo (.slice(0, 8))
  const newArrivals = products ? [...products].reverse().slice(0, 8) : [];
  // --- SLIDER STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);

  // --- INITIALIZE SLIDES ---
  useEffect(() => {
    const safeBanner = banner || {};

    if (safeBanner.slides && safeBanner.slides.length > 0) {
      setSlides(safeBanner.slides);
    } else if (safeBanner.image || safeBanner.heroImage) {
      setSlides([{
        image: safeBanner.image || safeBanner.heroImage,
        title: siteText?.heroTitle || "Timeless Elegance",
        subtitle: siteText?.heroSubtitle || "The ZERIMI Privilege",
        link: "/category/all"
      }]);
    } else {
      setSlides([{
        image: FALLBACK_IMAGE,
        title: "Timeless Elegance",
        subtitle: "The ZERIMI Privilege",
        link: "/category/all"
      }]);
    }
  }, [banner, siteText]);

  // --- AUTO PLAY SLIDER ---
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  const getSafeImage = (img: string | undefined | null) => {
    if (!img || img.trim() === "") return FALLBACK_IMAGE;
    return img;
  };

 if (slides.length === 0) return null;

  return (
    <div className="bg-white overflow-x-hidden">
      
      {/* ✅ YAHAN PASTE KAREIN: Popup sabse upar rahega */}
     

  {/* =========================================
          1. HERO SECTION (PREMIUM & COMPACT TEXT)
         ========================================= */}
     {/* Mobile: Aspect 16:10 (Horizontal) | Desktop: Aspect 16:7 (Wide) */}
<section className="relative w-full h-auto min-h-[350px] aspect-[16/10] md:aspect-[16/7] flex items-center justify-center overflow-hidden bg-black">
        
        {/* SLIDES */}
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image 
                src={getSafeImage(slide.image)} 
                alt={slide.title || "Banner"} 
                fill 
                className="object-cover opacity-80" 
                priority={index === 0}
            />
            {/* Elegant Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
          </div>
        ))}

        {/* CONTENT */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center pointer-events-none px-6 mt-6 md:mt-0 text-center">
           <AnimatePresence mode='wait'>
             <motion.div 
               key={currentSlide} 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="pointer-events-auto max-w-3xl mx-auto"
             >
                {/* Subtitle: Extra spaced, smaller, golden */}
                <p className="text-amber-300 tracking-[0.4em] text-[9px] md:text-xs uppercase font-medium mb-3 md:mb-5">
                  {slides[currentSlide].subtitle || "The ZERIMI Privilege"}
                </p>
                
                {/* Title: Serif, Italic, Not too huge */}
                <h1 className="text-3xl md:text-6xl font-serif italic text-white leading-tight mb-6 md:mb-8 drop-shadow-lg tracking-wide">
                  {slides[currentSlide].title || "Timeless Elegance"}
                </h1>
                
                {/* Button: Minimal Glass Style */}
               {/* Button: Mobile = Gold, Desktop = White */}
                <Link 
                    href={slides[currentSlide].link || "/category/all"}
                    className="inline-block px-8 py-3 md:px-10 md:py-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl border border-transparent
                    
                    bg-amber-600 text-white           
                    md:bg-white md:text-[#0a1f1c]     
                    
                    hover:bg-black hover:text-white hover:border-black"
                >
                    {siteText?.heroBtnText || "Shop Now"}
                </Link>
             </motion.div>
           </AnimatePresence>
        </div>

        {/* PREMIUM POINTERS (SLIDERS) - Moved Up */}
        {/* bottom-20 (mobile) aur bottom-28 (desktop) kar diya taaki card ke piche na chhupe */}
        <div className="absolute bottom-20 md:bottom-28 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-[2px] transition-all duration-500 rounded-full ${
                  currentSlide === idx 
                  ? "bg-amber-400 w-8 md:w-12 shadow-[0_0_10px_rgba(251,191,36,0.6)]" 
                  : "bg-white/40 w-4 md:w-6 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
        </div>
      </section>

      {/* =========================================
          2. CATEGORY CARDS (Grid Fix: 2 Columns on Mobile)
         ========================================= */}
      {/* =========================================
          2. CATEGORY CARDS (SIMPLE DESIGN + MOBILE VISIBLE SHOP NOW)
         ========================================= */}
 {/* =========================================
    2. CATEGORY CARDS (OVERLAPPING & PREMIUM)
   ========================================= */}
{/* 👇 UPDATE: '-mt-14' (Mobile) aur '-mt-24' (Desktop). 
    Isse ye Banner ke upar chadh jayega aur gap khatam ho jayega. */}
<section className="relative z-20 -mt-14 md:-mt-24 px-3 md:px-8 pb-12">
  
  <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
    
    {categories?.map((cat: any) => {
       
       let categorySlug = "all";
       const title = cat.title ? cat.title.toLowerCase() : "";
       if (title.includes("ring")) categorySlug = "Ring";
       else if (title.includes("neck") || title.includes("neclace")) categorySlug = "Necklace";
       else if (title.includes("ear")) categorySlug = "Earring";
       else if (title.includes("brace")) categorySlug = "Bracelet";
       else categorySlug = "all";

       return (
        <motion.div 
          key={cat.id || Math.random()} 
          whileHover="hover" 
          initial="rest"
          animate="rest"
          // 👇 PREMIUM LOOK: 'rounded-xl' (Soft), 'bg-white' (Clean), 'shadow-xl' (Pop effect)
          className="relative w-full aspect-[4/5] overflow-hidden group cursor-pointer bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-white/50"
        >
          <Link href={`/category/${categorySlug}`} className="block w-full h-full relative">
            
            {/* 1. IMAGE LAYER */}
            <motion.div 
              className="w-full h-full relative"
              variants={{ 
                rest: { scale: 1 },
                hover: { scale: 1.1 } 
              }} 
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Image 
                src={getSafeImage(cat.image)} 
                alt={cat.title || "Category"} 
                fill 
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover" 
              />
            </motion.div>

            {/* 2. GRADIENT (Thoda Soft Black niche se) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 transition-opacity duration-300" />
            
            {/* 3. CONTENT (Floating Glass Effect) */}
            <div className="absolute inset-0 flex flex-col justify-end p-3 text-center items-center pb-4">
              
              {/* Category Name */}
              <h3 className="font-serif text-white text-xs md:text-base uppercase tracking-[0.15em] font-medium drop-shadow-lg mb-2 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                {cat.title || "Category"}
              </h3>

              {/* Decorative Line (Gold) */}
              <div className="w-6 h-[2px] bg-amber-400 rounded-full mb-3 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>

              {/* 'Shop Now' Glass Button */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full group-hover:bg-white group-hover:text-black transition-all duration-300">
                 <p className="text-[9px] md:text-[10px] text-white group-hover:text-black uppercase tracking-widest font-bold flex items-center gap-1">
                   Shop Now
                 </p>
              </div>

            </div>

          </Link>
        </motion.div>
      );
    })}
  </div>
</section>
<PremiumMarquee />
      {/* =========================================
          3. NEW ARRIVALS (Grid Fix: 2 Columns on Mobile)
         ========================================= */}
     {/* =========================================
    3. NEW ARRIVALS (HORIZONTAL SCROLL ON MOBILE)
   ========================================= */}
<section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
  
  <div className="flex justify-between items-end mb-6 md:mb-10 px-1 md:px-0">
    <div>
      <h2 className="font-serif text-2xl md:text-4xl text-[#0a1f1c] mb-1">
        {siteText?.newArrivalsTitle || "New Arrivals"}
      </h2>
      <p className="text-stone-500 text-xs md:text-base">
        {siteText?.newArrivalsSub || "Freshly crafted for the modern you."}
      </p>
    </div>
    <Link href="/category/all" className="flex items-center gap-1 text-[#0a1f1c] uppercase text-[10px] md:text-xs font-bold tracking-widest hover:text-amber-600 transition">
      View All <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
    </Link>
  </div>

  {/* 👇 MAGIC CODE: Mobile par 'Flex + Scroll' | Desktop par 'Grid' */}
  <div className="flex md:grid md:grid-cols-4 overflow-x-auto md:overflow-visible gap-3 md:gap-8 pb-8 md:pb-0 -mx-4 px-4 md:mx-0 scrollbar-hide snap-x snap-mandatory">
      
      {newArrivals.length > 0 ? (
          newArrivals.map((product: any) => (
              // 👇 Mobile Width: 45% (Ek baar mein 2.2 products dikhenge)
              <div key={product.id} className="min-w-[45%] md:min-w-0 md:w-auto snap-start">
                  <ProductCard product={product} />
              </div>
          ))
      ) : (
          // Loading Skeleton (Horizontal)
          [...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[45%] md:min-w-0 aspect-square bg-stone-100 animate-pulse rounded-xl" />
          ))
      )}

  </div>
</section>
{/* --- 🤫 SECRET GIFT MODE USP SECTION (Mobile Optimized) --- */}
<section className="py-16 md:py-24 bg-[#0a1f1c] text-white overflow-hidden relative">
  
  {/* Background Glow (Responsive Position) */}
  <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-amber-500/10 rounded-full blur-[80px] md:blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
  <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none md:hidden"></div>

  <div className="max-w-7xl mx-auto px-5 md:px-6 relative z-10">
    <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
      
      {/* LEFT: TEXT CONTENT (Admin Controlled) */}
      <div className="flex-1 text-center md:text-left w-full">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 animate-pulse"></span>
          {store.siteText?.secretGiftBadge || "New Feature"}
        </div>
        
        {/* Main Heading (Responsive Text Size) */}
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif mb-4 md:mb-6 leading-tight">
           {store.siteText?.secretGiftTitle || "The Art of Secret Gifting"}
        </h2>
        
        {/* Subtitle */}
        <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 leading-relaxed max-w-xl mx-auto md:mx-0">
          {store.siteText?.secretGiftSub || "Surprise your loved ones with luxury. We deliver the gift, hide the price tag, and keep your identity a mystery until you decide to reveal it."}
        </p>
        
        {/* Features Grid (Mobile: Stacked/Full Width, Desktop: Inline) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full sm:w-auto">
          <div className="flex items-center gap-4 bg-white/5 px-5 py-4 rounded-xl border border-white/5 w-full sm:w-auto justify-center sm:justify-start hover:bg-white/10 transition">
            <Gift className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
            <div className="text-left">
                <p className="text-sm font-bold text-white leading-none mb-1">Luxury Box</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">No Branding</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-5 py-4 rounded-xl border border-white/5 w-full sm:w-auto justify-center sm:justify-start hover:bg-white/10 transition">
            <EyeOff className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
            <div className="text-left">
                <p className="text-sm font-bold text-white leading-none mb-1">Zero Trace</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">No Invoice Inside</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: VISUALS (Dynamic Image or Default Card) */}
      <div className="flex-1 relative flex justify-center md:justify-end w-full mt-4 md:mt-0">
        
        {/* CASE A: Admin ne Image Upload ki hai */}
        {store.siteText?.secretGiftImage ? (
            <div className="relative w-full max-w-sm md:max-w-md aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transform rotate-0 md:rotate-3 hover:rotate-0 transition duration-700 group">
                <Image 
                    src={store.siteText.secretGiftImage} 
                    alt="Secret Gift" 
                    fill 
                    className="object-cover group-hover:scale-105 transition duration-700" 
                />
                {/* Image Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
                    <p className="text-white font-serif italic text-lg md:text-xl opacity-90 leading-relaxed text-center md:text-left">
                       "{store.siteText?.secretGiftQuote || "Sent with love."}"
                    </p>
                </div>
            </div>
        ) : (
            
        /* CASE B: Default Abstract Card (Agar Image nahi hai) */
            <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-sm md:max-w-md transform rotate-0 md:rotate-3 hover:rotate-0 transition duration-500 shadow-2xl">
               {/* Card Header */}
               <div className="flex justify-between items-start mb-8 md:mb-12">
                  <div className="flex gap-3 md:gap-4">
                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg"></div>
                     <div>
                        <p className="text-sm font-bold text-white">Anonymous Sender</p>
                        <p className="text-[10px] md:text-xs text-white/40">Via ZERIMI Secret Mode</p>
                     </div>
                  </div>
                  <Lock className="w-5 h-5 md:w-6 md:h-6 text-white/20" />
               </div>

               {/* Quote (Responsive Text) */}
               <p className="text-xl md:text-3xl font-serif italic text-white/90 mb-8 md:mb-12 leading-relaxed text-center md:text-left">
                  "{store.siteText?.secretGiftQuote || "I wanted to see you smile, without knowing who put it there. Enjoy the sparkle."}"
               </p>

               {/* Fake Tracking Bar */}
               <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full w-3/4 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-[pulse_3s_ease-in-out_infinite]"></div>
               </div>
               <div className="flex justify-between text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                   <span className="text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span> Out for Delivery
                   </span>
                   <span className="text-white/20">Estimated: Today</span>
               </div>
            </div>
        )}
        
        {/* Background Decorations (Desktop Only) */}
        <div className="hidden md:block absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      </div>

    </div>
  </div>
</section>
      {/* =========================================
          4. FEATURED COLLECTION
         ========================================= */}
      <section id="shop" className="py-16 md:py-24 bg-[#fffcf5]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-[#0a1f1c] mb-2 md:mb-4">
              {siteText?.featuredTitle || "Diamonds & Engagement Rings"}
            </h2>
            <p className="text-stone-500 text-xs md:text-base">
              {siteText?.featuredSub || "Experience brilliance."}
            </p>
            <div className="w-20 h-[2px] bg-amber-200 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Featured Hero Image */}
            <div className="bg-white p-4 md:p-8 border border-stone-100 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 uppercase">Featured</div>
              <div className="relative h-64 md:h-80 w-full mb-4 md:mb-6">
                <Image
                  src={getSafeImage(featuredSection?.image)}
                  alt="Featured Product"
                  fill
                  className="object-contain group-hover:scale-105 transition duration-500"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-serif text-[#0a1f1c]">{featuredSection?.title || "Signature Collection"}</h3>
              <p className="text-stone-500 text-xs md:text-sm mt-1 md:mt-2 mb-4 md:mb-6">{featuredSection?.subtitle || "Exclusive designs"}</p>
              <Link href="/category/rings" className="inline-block text-xs font-bold uppercase tracking-widest border-b border-[#0a1f1c] pb-1 hover:text-amber-700 hover:border-amber-700 transition">
                Shop Collection
              </Link>
            </div>

            {/* Product Grid - Mobile 2 Cols */}
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              {products?.slice(0, 4).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          5. PROMO SECTION
         ========================================= */}
      <section className="bg-[#f4e4d4] py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 order-2 md:order-1 w-full">
            <div className="relative h-[300px] md:h-[500px] w-full rounded-t-full overflow-hidden border-4 border-white shadow-2xl">
              <Image
                src={getSafeImage(promoSection?.image)}
                alt="Promo Model"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2 space-y-4 md:space-y-6 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-serif text-[#0a1f1c] leading-tight">
              {siteText?.promoTitle || "Special Offer"}
            </h2>
            <p className="text-stone-700 text-sm md:text-base leading-relaxed max-w-md mx-auto md:mx-0">
              {siteText?.promoText || "Limited time deals on our finest jewelry."}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 md:pt-4 max-w-sm mx-auto md:mx-0">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="bg-white p-2 rounded-full"><Star className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-current" /></div>
                <span className="text-xs md:text-sm font-bold text-[#0a1f1c]">Certified Quality</span>
              </div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="bg-white p-2 rounded-full"><Star className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-current" /></div>
                <span className="text-xs md:text-sm font-bold text-[#0a1f1c]">Zerimi Elite Edition</span>
              </div>
            </div>
            <Link href="/category/all" className="inline-block bg-[#0a1f1c] text-white px-8 md:px-10 py-3 md:py-4 mt-4 text-xs uppercase tracking-widest hover:bg-amber-700 transition">
              {siteText?.promoBtn || "Discover More"}
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================
          6. BLOG SECTION
         ========================================= */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-[#0a1f1c] mb-8 md:mb-12">
            {siteText?.blogTitle || "From Our Journal"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {blogs?.map((blog: any) => (
              <div key={blog.id} className="text-left group cursor-pointer">
                <Link href={`/blog/${blog.id}`} className="block">
                  <div className="relative h-56 md:h-64 w-full mb-4 overflow-hidden rounded-lg">
                    <Image
                      src={getSafeImage(blog.image)}
                      alt={blog.title || "Blog Post"}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-700"
                    />
                  </div>
                  <p className="text-[10px] md:text-xs text-amber-700 uppercase font-bold mb-2">{blog.category || "News"} • {blog.date}</p>
                  <h3 className="font-serif text-lg md:text-xl text-[#0a1f1c] leading-snug group-hover:text-amber-700 transition">
                    {blog.title || "Untitled Post"}
                  </h3>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}