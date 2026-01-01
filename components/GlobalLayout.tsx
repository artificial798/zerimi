"use client";
import CartDrawer from '@/components/CartDrawer';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingBag, X, Trash2, Menu, Search, User, Instagram, Facebook, Twitter, Lock, Check, Gift, Truck, ArrowRight, Ticket, Heart, ShieldCheck, Gem, Zap, TrendingDown, Eye, ShoppingCart, MapPin, Phone, Mail } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // ✅ 1. 'currentUser' aur 'as any' zaroor add karein
  const { 
    cart, 
    removeFromCart, 
    isCartOpen, 
    toggleCart, 
    currentUser, // <--- Ye Zaroori hai
    banner, 
    coupons, 
    wishlist, 
    toggleWishlist, 
    addToCart 
    
    
  } = useStore() as any; // <--- 'as any' lagayein taaki TypeScript error na de
// Is line ko baaki useState ke paas add karein
const [showEmptyWishlistToast, setShowEmptyWishlistToast] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Gift State
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [giftOccasion, setGiftOccasion] = useState('');

  // Social Proof Toast
  const [showToast, setShowToast] = useState(false);

  // Calc Totals
  // sum ko 'number' aur item ko 'any' bata dein
const subtotal = cart.reduce((sum: number, item: any) => sum + item.product.price * item.qty, 0);
  const shippingThreshold = 5000;
  const progress = Math.min((subtotal / shippingThreshold) * 100, 100);

  // --- PAGE CHECKS ---
  const isHomePage = pathname === '/';
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isTransparent = isHomePage && !isScrolled;

  const logoWhite = banner?.logoWhite || "/logo-white.png";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAdminPage || isAuthPage) return;
    const timer = setInterval(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 25000);
    return () => clearInterval(timer);
  }, [isAdminPage, isAuthPage]);

  const handleCheckout = () => { toggleCart(false); router.push('/checkout'); };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/category/all?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchIconClick = () => {
    if (isSearchOpen && searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/category/all?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setIsSearchOpen(!isSearchOpen);
    }
  };

  // --- HIDE LAYOUT FOR ADMIN & AUTH ---
  if (isAdminPage || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col">

      {/* COUPON STRIP */}
{/* COUPON STRIP */}
   {/* --- PREMIUM SCROLLING COUPON STRIP --- */}
   {/* ✅ FILTER LOGIC ADDED: Sirf Public Coupons Dikhao */}
{coupons.filter((c: any) => !c.allowedEmail).length > 0 && (
<div className="fixed top-0 left-0 w-full h-10 bg-[#020b09] border-b border-amber-500/20 z-50 overflow-hidden flex items-center">
  
  {/* Left Fade Gradient (Premium Look) */}
  <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-[#020b09] to-transparent z-10 pointer-events-none"></div>

  {/* Scrolling Content */}
  <div className="animate-marquee flex items-center">
    {/* ✅ FILTER APPLIED HERE TOO */}
    {(() => {
        const publicCoupons = coupons.filter((c: any) => !c.allowedEmail);
        // Repeat list 4 times for smooth infinite scroll
        return [...publicCoupons, ...publicCoupons, ...publicCoupons, ...publicCoupons].map((c, i) => (
          <div key={i} className="flex items-center gap-3 mx-8 group cursor-pointer">
            <Ticket className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-medium text-stone-300 tracking-[0.15em] uppercase whitespace-nowrap">
              Use Code 
              <span className="mx-2 text-[#0a1f1c] bg-amber-400 px-2 py-0.5 rounded font-bold shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                {c.code}
              </span>
              Get {c.type === 'percent' ? `${c.discount}%` : `₹${c.discount}`} OFF
            </span>
            <span className="text-white/10 text-xs mx-2">•</span>
          </div>
        ));
    })()}
  </div>

  {/* Right Fade Gradient */}
  <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-[#020b09] to-transparent z-10 pointer-events-none"></div>
</div>
)}

      {/* NAVBAR */}
     {/* NAVBAR */}
      <header
        className={`fixed w-full z-40 transition-all duration-500 border-b ${isTransparent
          ? `bg-transparent py-4 border-transparent`
          : `bg-[#0a1f1c]/95 backdrop-blur-md py-3 border-white/10 shadow-xl`
          }`}
        style={{ top: coupons.length > 0 ? '36px' : '0px' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* 1. LEFT SIDE: Hamburger & Nav Links */}
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-full transition text-white hover:bg-white/20">
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden md:flex gap-8 text-xs font-medium tracking-[0.15em] uppercase text-white/90">
              <Link href="/category/all" className="hover:text-amber-400 transition-colors relative group">
                New Arrivals
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/category/Ring" className="hover:text-amber-400 transition-colors relative group">
                Rings
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/category/Necklace" className="hover:text-amber-400 transition-colors relative group">
                Necklaces
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/category/Earring" className="hover:text-amber-400 transition-colors relative group">
                Earrings
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          </div>

          {/* 2. CENTER: Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="relative h-10 w-28 md:h-12 md:w-40 cursor-pointer">
                <Image src={logoWhite} alt="ZERIMI" fill className="object-contain" />
              </div>
            </Link>
          </div>

          {/* 3. RIGHT SIDE: Search, Profile, Cart */}
          <div className="flex items-center justify-end gap-3 md:gap-6 flex-1">
            
            {/* SEARCH ICON */}
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'bg-white/10 rounded-full px-3 py-1 border border-white/20' : ''}`}>
              {isSearchOpen && (
                <input autoFocus type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-20 md:w-32 mr-2 text-white placeholder-white/50 font-sans" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchSubmit} />
              )}
              <Search onClick={handleSearchIconClick} className="w-5 h-5 cursor-pointer text-white hover:text-amber-400 transition" />
            </div>

            {/* WISHLIST (Desktop Only - Mobile space bachane ke liye hide rakha hai) */}
            <div className="relative group hidden md:block">
              <Heart 
                onClick={() => {
                  if (wishlist.length === 0) {
                    toast("Your wishlist is empty!", { icon: '💎', style: { background: '#0a1f1c', color: '#fbbf24' } });
                  } else {
                    setIsWishlistOpen(true);
                  }
                }} 
                className="w-5 h-5 cursor-pointer text-white hover:text-red-400 transition" 
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold pointer-events-none">
                  {wishlist.length}
                </span>
              )}
            </div>

            {/* ✅ PROFILE LOGIC (MOBILE + DESKTOP) */}
            {currentUser ? (
              // SCENARIO 1: LOGGED IN (Dashboard Link)
              <div className="relative">
                {/* Mobile View: Circular Avatar */}
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="relative md:hidden w-8 h-8 rounded-full overflow-hidden border border-white/40 flex items-center justify-center bg-amber-500 text-[#0a1f1c] font-bold text-[10px]"
                >
                  {currentUser.profileImage ? (
                    <Image src={currentUser.profileImage} alt="Profile" fill className="object-cover rounded-full" />
                  ) : (
                    currentUser.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </button>

                {/* Desktop View: Name Badge */}
                <button onClick={() => router.push('/dashboard')} className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest px-3 py-1 rounded-full border border-white/30 text-white hover:bg-white/10 transition">
                  <User className="w-3 h-3" /> {currentUser.name.split(' ')[0]}
                </button>
              </div>
            ) : (
              // SCENARIO 2: NOT LOGGED IN (Login Link)
              <Link href="/login" className="flex items-center">
                 {/* Ab 'hidden md:block' hata diya taaki mobile par bhi dikhe */}
                 <User className="w-5 h-5 cursor-pointer text-white hover:text-amber-400 transition" />
              </Link>
            )}

            {/* CART ICON */}
            <button onClick={() => toggleCart(true)} className="relative group">
              <ShoppingBag className="w-5 h-5 text-white group-hover:text-amber-400 transition" />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">{cart.reduce((a: number, b: any) => a + b.qty, 0)}</span>}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 left-6 z-40 bg-white/90 backdrop-blur border border-stone-200 p-4 rounded-lg shadow-2xl flex items-center gap-4 max-w-xs">
            <div className="relative w-12 h-12 bg-stone-100 rounded overflow-hidden"><Image src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=100" alt="Product" fill className="object-cover" /></div>
            <div><p className="text-xs text-stone-500 mb-1 flex items-center gap-1"><Eye className="w-3 h-3 text-green-500" /> 18 people viewing</p><p className="text-sm font-serif text-[#0a1f1c]">Someone just bought <span className="font-bold">Royal Emerald</span></p></div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-grow ${coupons.length > 0 ? 'pt-9' : 'pt-0'}`}>
        {children}
      </main>

      {/* --- COMPACT PREMIUM TRUST STRIP (FIXED) --- */}
      <section className="bg-[#faf9f6] py-8 md:py-16 border-t border-[#e5e0d8]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-12">
            
            {/* 1. Warranty */}
            <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4 group text-left md:text-center p-2 md:p-0 bg-white md:bg-transparent rounded-lg md:rounded-none border border-stone-100 md:border-none shadow-sm md:shadow-none">
              <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 rounded-full border border-amber-600/20 bg-[#faf9f6] md:bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-all duration-300">
                <ShieldCheck className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-xs md:text-base text-[#0a1f1c] font-bold md:font-medium tracking-wide leading-tight">12-Mo Warranty</h4>
                <p className="hidden md:block text-[10px] md:text-xs text-stone-500 mt-1.5">Plating & stone cover</p>
                <p className="md:hidden text-[9px] text-stone-400 mt-0.5">Plating & Stone</p>
              </div>
            </div>

            {/* 2. Authenticity */}
            <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4 group text-left md:text-center p-2 md:p-0 bg-white md:bg-transparent rounded-lg md:rounded-none border border-stone-100 md:border-none shadow-sm md:shadow-none">
              <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 rounded-full border border-amber-600/20 bg-[#faf9f6] md:bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-all duration-300">
                <Gem className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-xs md:text-base text-[#0a1f1c] font-bold md:font-medium tracking-wide leading-tight">100% Authentic</h4>
                <p className="hidden md:block text-[10px] md:text-xs text-stone-500 mt-1.5">Original Designs</p>
                <p className="md:hidden text-[9px] text-stone-400 mt-0.5">Original Designs</p>
              </div>
            </div>

            {/* 3. Shipping (ERROR FIXED HERE) */}
            <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4 group text-left md:text-center p-2 md:p-0 bg-white md:bg-transparent rounded-lg md:rounded-none border border-stone-100 md:border-none shadow-sm md:shadow-none">
              <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 rounded-full border border-amber-600/20 bg-[#faf9f6] md:bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-all duration-300">
                <Truck className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-xs md:text-base text-[#0a1f1c] font-bold md:font-medium tracking-wide leading-tight">Free Shipping</h4>
                <p className="hidden md:block text-[10px] md:text-xs text-stone-500 mt-1.5">Above ₹1000</p>
                {/* ✅ Fixed: '>' changed to '&gt;' */}
                <p className="md:hidden text-[9px] text-stone-400 mt-0.5">Orders &gt; ₹1000</p>
              </div>
            </div>

            {/* 4. Returns */}
            <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4 group text-left md:text-center p-2 md:p-0 bg-white md:bg-transparent rounded-lg md:rounded-none border border-stone-100 md:border-none shadow-sm md:shadow-none">
              <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 rounded-full border border-amber-600/20 bg-[#faf9f6] md:bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-all duration-300">
                <Check className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-xs md:text-base text-[#0a1f1c] font-bold md:font-medium tracking-wide leading-tight">Easy Returns</h4>
                <p className="hidden md:block text-[10px] md:text-xs text-stone-500 mt-1.5">3-Day Policy</p>
                <p className="md:hidden text-[9px] text-stone-400 mt-0.5">3-Day Policy</p>
              </div>
            </div>

             {/* 5. Secure */}
             <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4 group text-left md:text-center p-2 md:p-0 bg-white md:bg-transparent rounded-lg md:rounded-none border border-stone-100 md:border-none shadow-sm md:shadow-none">
              <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 rounded-full border border-amber-600/20 bg-[#faf9f6] md:bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-all duration-300">
                <Lock className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-xs md:text-base text-[#0a1f1c] font-bold md:font-medium tracking-wide leading-tight">100% Secure</h4>
                <p className="hidden md:block text-[10px] md:text-xs text-stone-500 mt-1.5">Encrypted</p>
                <p className="md:hidden text-[9px] text-stone-400 mt-0.5">Encrypted</p>
              </div>
            </div>

             {/* 6. Gift */}
             <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4 group text-left md:text-center p-2 md:p-0 bg-white md:bg-transparent rounded-lg md:rounded-none border border-stone-100 md:border-none shadow-sm md:shadow-none">
              <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 rounded-full border border-amber-600/20 bg-[#faf9f6] md:bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-all duration-300">
                <Gift className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-xs md:text-base text-[#0a1f1c] font-bold md:font-medium tracking-wide leading-tight">Gift Ready</h4>
                <p className="hidden md:block text-[10px] md:text-xs text-stone-500 mt-1.5">Premium Pack</p>
                <p className="md:hidden text-[9px] text-stone-400 mt-0.5">Premium Pack</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER (All 5 Columns Intact) --- */}
      <footer className="bg-[#0a1f1c] text-stone-400 pt-20 pb-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">

          <div className="space-y-6">
            <div className="relative h-10 w-32"><Image src={logoWhite} alt="ZERIMI" fill className="object-contain opacity-90" /></div>
            <p className="text-sm leading-relaxed text-stone-500">Luxury artificial jewelry crafted for elegance. Bridging the gap between traditional artistry and modern aesthetics.</p>
            <div className="flex gap-4">
              <Link href="https://www.instagram.com/zerimi.luxury" target="_blank" className="hover:text-white transition-colors">
                <Instagram className="w-4 h-4 cursor-pointer" />
              </Link>
              <Link href="https://www.facebook.com/profile.php?id=61584024450925" target="_blank" className="hover:text-white transition-colors">
                <Facebook className="w-4 h-4 cursor-pointer" />
              </Link>
              
            </div>
          </div>

          <div>
            <h4 className="text-white font-serif mb-6 tracking-widest text-sm">DISCOVER</h4>
            <ul className="space-y-4 text-sm tracking-wide">
              <li><Link href="/category/all" className="hover:text-amber-500 transition">Collections</Link></li>
              <li><Link href="/category/rings" className="hover:text-amber-500 transition">Best Sellers</Link></li>
              <li><Link href="/about" className="hover:text-amber-500 transition">Our Story</Link></li>
              <li><Link href="/contact" className="hover:text-amber-500 transition">Book Appointment</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif mb-6 tracking-widest text-sm">CUSTOMER CARE</h4>
            <ul className="space-y-4 text-sm tracking-wide">
              <li><Link href="/dashboard" className="hover:text-amber-500 transition">My Account</Link></li>
              <li><Link href="/track-order" className="hover:text-amber-500 transition">Track Order</Link></li>
              <li><Link href="/returns" className="hover:text-amber-500 transition">Return Policy</Link></li>
              <li><Link href="/terms" className="hover:text-amber-500 transition">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-amber-500 transition">Privacy Policy</Link></li>
              <li><Link href="/faq" className="hover:text-amber-500 transition">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif mb-6 tracking-widest text-sm">REACH US</h4>
            <ul className="space-y-4 text-sm tracking-wide text-stone-400">
              <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-amber-600 flex-shrink-0" /><span>Luxury Lane, Fashion Street,<br />Mumbai, India - 400001</span></li>
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-amber-600 flex-shrink-0" /><span>+91 98765 43210</span></li>
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-amber-600 flex-shrink-0" /><span>support@zerimi.com</span></li>
              <li className="pt-2"><Link href="/contact" className="text-amber-500 underline text-xs uppercase font-bold">Open Contact Page</Link></li>
            </ul>
          </div>

          {/* Newsletter Section Replacement */}
<div>
  <h4 className="text-white font-serif mb-6 tracking-widest text-sm">NEWSLETTER</h4>
  <p className="text-xs text-stone-500 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
  
  {/* Functional Form */}
  <form 
    onSubmit={(e) => {
      e.preventDefault();
      const input = e.currentTarget.querySelector('input');
      if (input && input.value.trim()) {
         toast.success("Welcome to ZERIMI Insider!", {
            icon: '📩',
            style: { background: '#0a1f1c', color: '#fbbf24', border: '1px solid #fbbf24' }
         });
         input.value = ''; // Input clear karein
      }
    }}
    className="flex border-b border-stone-700 pb-2"
  >
    <input type="email" required placeholder="Email Address" className="bg-transparent w-full outline-none text-stone-300 text-sm" />
    <button type="submit" className="text-stone-400 hover:text-white uppercase text-xs font-bold">Join</button>
  </form>
</div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-stone-800 flex justify-center items-center text-xs text-stone-600">
          <p>&copy; {new Date().getFullYear()} ZERIMI Jewelry. All rights reserved.</p>
        </div>
      </footer>

      {/* DRAWERS */}
      <AnimatePresence>
        {isWishlistOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWishlistOpen(false)} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a1f1c] text-white z-50 shadow-2xl flex flex-col border-l border-white/10">
              <div className="p-6 border-b border-white/10 bg-[#0f2925]">
                <div className="flex justify-between items-center mb-4"><h2 className="font-serif text-2xl tracking-wide text-amber-50">Your Wishlist</h2><button onClick={() => setIsWishlistOpen(false)} className="hover:rotate-90 transition duration-300 p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button></div>
                <p className="text-xs text-stone-400 uppercase tracking-widest">{wishlist.length} Items Saved</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-500"><Heart className="w-16 h-16 mb-4 opacity-20" /><p className="text-lg font-serif mb-6">Your wishlist is empty</p><button onClick={() => setIsWishlistOpen(false)} className="px-8 py-3 border border-amber-500 text-amber-500 text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-[#0a1f1c] transition">Start Exploring</button></div>
                ) : (
                  wishlist.map((product: any) => (
                    <div key={product.id} className="flex gap-4 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition">
                      <div className="relative w-20 h-24 bg-white/5 rounded-lg flex-shrink-0 overflow-hidden"><Image src={product.image} alt={product.name} fill className="object-cover" /></div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div><div className="flex justify-between"><h3 className="font-medium text-white font-serif">{product.name}</h3><button onClick={() => toggleWishlist(product)} className="text-stone-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button></div><p className="text-xs text-stone-400 mt-1">{product.category}</p></div>
                        <div className="flex justify-between items-center"><span className="font-bold text-amber-400">₹{product.price.toLocaleString()}</span><button onClick={() => { addToCart(product); toggleWishlist(product); }} className="bg-white/10 hover:bg-amber-500 hover:text-[#0a1f1c] text-white p-2 rounded-full transition"><ShoppingCart className="w-4 h-4" /></button></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '-100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '-100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 bg-[#0a1f1c] flex flex-col text-white">
            <div className="p-6 flex justify-between items-center border-b border-white/10"><div className="relative h-10 w-32"><Image src={logoWhite} alt="ZERIMI" fill className="object-contain" /></div><button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6 text-white" /></button></div>
            <div className="flex-1 p-8 flex flex-col gap-8 text-2xl font-serif">
              <Link href="/category/all" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-amber-400 transition-colors">New Arrivals</Link>
              <Link href="/category/necklace" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-amber-400 transition-colors">Necklaces</Link>
              <Link href="/category/earrings" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-amber-400 transition-colors">Earrings</Link>
              <Link href="/category/all" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-amber-400 text-amber-400 transition-colors font-bold">Collections</Link>
              <button onClick={() => { setIsMobileMenuOpen(false); setIsWishlistOpen(true); }} className="text-left hover:text-amber-400 transition-colors flex items-center gap-2"><Heart className="w-5 h-5" /> Wishlist</button>
            </div>
            {/* ✅ UPDATED MOBILE FOOTER (Clickable Profile) */}
            <div className="p-8 border-t border-white/10 bg-black/20">
              {currentUser ? (
                // 🔹 SCENARIO 1: USER LOGIN HAI
                <div className="flex flex-col gap-4">
                    
                    {/* 👇 YAHAN CHANGE KIYA: Poore section ko <Link> bana diya */}
                   <Link 
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-2 -ml-2 rounded-xl hover:bg-white/10 transition cursor-pointer group"
                    >
                        {/* ✅ UPDATED AVATAR with IMAGE SUPPORT */}
                        <div className="relative w-12 h-12 rounded-full bg-amber-500 text-[#0a1f1c] flex items-center justify-center font-bold text-xl shadow-lg border-2 border-white/10 group-hover:scale-105 transition overflow-hidden">
                            {currentUser.profileImage ? (
                                <Image 
                                    src={currentUser.profileImage} 
                                    alt="Profile" 
                                    fill 
                                    className="object-cover"
                                />
                            ) : (
                                currentUser.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        
                        {/* Name & Email */}
                        <div>
                            <p className="text-lg font-serif font-bold text-white tracking-wide group-hover:text-amber-400 transition">
                                Hello, {currentUser.name?.split(' ')[0]}
                            </p>
                            <p className="text-xs text-white/50 group-hover:text-white/80 transition">
                                {currentUser.email}
                            </p>
                            <p className="text-[10px] text-amber-500 mt-1 font-bold uppercase tracking-widest">
                                Click to view Dashboard
                            </p>
                        </div>
                    </Link>

                </div>
              ) : (
                // 🔹 SCENARIO 2: USER LOGOUT HAI
                <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-white/60 hover:text-amber-400 mb-4 transition group"
                >
                    <div className="p-2 rounded-full bg-white/10 group-hover:bg-amber-400 group-hover:text-black transition">
                        <User className="w-5 h-5" /> 
                    </div>
                    <span className="text-lg font-serif tracking-wide">Login / Register</span>
                </Link>
              )}
              
              <p className="text-[10px] text-white/30 mt-6 uppercase tracking-[0.2em]">&copy; 2025 ZERIMI.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}