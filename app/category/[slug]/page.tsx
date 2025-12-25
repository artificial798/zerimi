"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';
import { 
  Filter, ChevronDown, X, Search, Home, 
  ArrowUpDown, SlidersHorizontal, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ 1. FIXED: Filter Component ko BAHAR nikala taaki re-render hone par focus na hatae
const FilterSidebar = ({ 
    searchQuery, setSearchQuery, 
    categories, rawSlug, 
    setShowMobileFilters, 
    priceRange, setPriceRange,
    sortBy, setSortBy, 
    isMobile = false 
}: any) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Search Input */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-500 transition"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Categories */}
            <div>
                <h3 className="font-serif text-lg text-[#0a1f1c] mb-4 flex items-center justify-between">
                    Collections 
                    <span className="text-xs text-stone-400 font-sans font-normal">{categories.length}</span>
                </h3>
                <ul className="space-y-2 text-sm text-stone-600">
                    <li>
                        <Link href="/category/all" onClick={() => setShowMobileFilters(false)} className={`flex items-center justify-between p-2 rounded-lg transition ${rawSlug === 'all' ? 'bg-[#0a1f1c] text-white font-bold' : 'hover:bg-stone-100'}`}>
                            All Jewelry
                            {rawSlug === 'all' && <Check className="w-3 h-3"/>}
                        </Link>
                    </li>
                    {categories?.map((c: any) => {
                        const isActive = rawSlug.includes(c.title.toLowerCase().slice(0,3));
                        return (
                            <li key={c.id}>
                                <Link href={`/category/${c.title.toLowerCase()}`} onClick={() => setShowMobileFilters(false)} className={`flex items-center justify-between p-2 rounded-lg transition ${isActive ? 'bg-[#0a1f1c] text-white font-bold' : 'hover:bg-stone-100'}`}>
                                    {c.title}
                                    {isActive && <Check className="w-3 h-3"/>}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* Price Slider */}
            <div>
                <h3 className="font-serif text-lg text-[#0a1f1c] mb-4">Price Range</h3>
                <input 
                    type="range" 
                    min="0" max="100000" step="500"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0a1f1c]"
                />
                <div className="flex justify-between text-xs text-stone-500 mt-3 font-medium bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <span>₹0</span>
                    <span>Max: ₹{priceRange.toLocaleString()}</span>
                </div>
            </div>

            {/* Mobile Only: Sort Options inside Drawer */}
            {isMobile && (
                <div>
                    <h3 className="font-serif text-lg text-[#0a1f1c] mb-4">Sort By</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Newest', val: 'newest' },
                            { label: 'Price: Low to High', val: 'low-high' },
                            { label: 'Price: High to Low', val: 'high-low' }
                        ].map((opt) => (
                            <button 
                                key={opt.val}
                                onClick={() => { setSortBy(opt.val); setShowMobileFilters(false); }} 
                                className={`px-4 py-2 text-xs rounded-full border transition ${sortBy === opt.val ? 'bg-[#0a1f1c] text-white border-[#0a1f1c]' : 'bg-white text-stone-500 border-stone-200'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params.slug as string; 
  
  // ✅ Data Fetch
  const store = useStore() as any;
  const products = store.products || [];
  const categories = store.categories || [];

  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Filter States
  const [sortBy, setSortBy] = useState('newest'); 
  const [priceRange, setPriceRange] = useState(100000); 
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- CORE FILTER LOGIC ---
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
        let result = [...products];

        // A. Category Filter
        if (rawSlug && rawSlug !== 'all') {
            result = result.filter((p: any) => {
                const pCat = p.category ? p.category.toLowerCase() : "";
                const urlCat = rawSlug.toLowerCase();
                
                if (urlCat.includes('ring') && pCat.includes('ring')) return true;
                if (urlCat.includes('neck') && pCat.includes('neck')) return true;
                if (urlCat.includes('ear') && pCat.includes('ear')) return true;
                if (urlCat.includes('brace') && pCat.includes('brace')) return true;
                return pCat === urlCat;
            });
        }

        // B. Price Filter
        result = result.filter((p: any) => p.price <= priceRange);

        // C. Search Filter
        if (searchQuery) {
            result = result.filter((p: any) => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // D. Sorting Logic
        if (sortBy === 'low-high') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'high-low') {
            result.sort((a, b) => b.price - a.price);
        } else {
            result.reverse(); 
        }

        setFilteredProducts(result);
        setLoading(false);
    }, 300); // 300ms Debounce

    return () => clearTimeout(timer);
  }, [products, rawSlug, sortBy, priceRange, searchQuery]);

  const pageTitle = rawSlug === 'all' ? 'All Collections' : rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1);

  return (
    <div className="min-h-screen bg-stone-50/50 pt-20 md:pt-28 pb-20">
      
      {/* --- HEADER --- */}
      <div className="bg-white py-8 md:py-10 px-6 border-b border-stone-100">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-stone-400 uppercase tracking-widest mb-3">
                <Link href="/" className="hover:text-[#0a1f1c] flex items-center gap-1 transition"><Home className="w-3 h-3"/> Home</Link>
                <span>/</span>
                <span className="text-[#0a1f1c] font-bold">{pageTitle}</span>
            </div>
            
            <h1 className="font-serif text-3xl md:text-4xl text-[#0a1f1c] mb-2">
                {pageTitle}
            </h1>
            <p className="text-stone-500 text-xs md:text-sm max-w-xl leading-relaxed">
                {rawSlug === 'all' 
                 ? "Browse our exclusive inventory of premium jewelry." 
                 : `Explore our hand-picked collection of ${pageTitle}, crafted for perfection.`}
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 mt-8">
        
        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-32 h-fit bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            {/* ✅ Passing Props to External Component */}
            <FilterSidebar 
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                categories={categories} rawSlug={rawSlug}
                setShowMobileFilters={setShowMobileFilters}
                priceRange={priceRange} setPriceRange={setPriceRange}
            />
        </aside>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1">
            
            {/* Active Filters & Desktop Sort */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                
                {/* Active Badges */}
                <div className="flex flex-wrap gap-2">
                    {priceRange < 100000 && (
                        <span className="bg-[#0a1f1c] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
                            Under ₹{priceRange.toLocaleString()} 
                            <X onClick={() => setPriceRange(100000)} className="w-3 h-3 cursor-pointer hover:text-red-400"/>
                        </span>
                    )}
                    {searchQuery && (
                         <span className="bg-[#0a1f1c] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
                            "{searchQuery}"
                            <X onClick={() => setSearchQuery('')} className="w-3 h-3 cursor-pointer hover:text-red-400"/>
                        </span>
                    )}
                </div>

                {/* Desktop Sort Dropdown */}
                <div className="hidden lg:flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Sort:</span>
                    <div className="relative group">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none bg-white border border-stone-200 py-2 pl-4 pr-10 rounded-lg text-xs font-bold text-[#0a1f1c] outline-none cursor-pointer focus:border-[#0a1f1c] uppercase"
                        >
                            <option value="newest">Newest Arrivals</option>
                            <option value="low-high">Price: Low to High</option>
                            <option value="high-low">Price: High to Low</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500" />
                    </div>
                </div>
            </div>

            {/* --- PRODUCT GRID --- */}
            {loading ? (
                // SKELETON LOADING
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 animate-pulse">
                            <div className="aspect-[3/4] bg-stone-200"></div>
                            <div className="p-4 space-y-2">
                                <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                                <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                                <div className="h-4 bg-stone-200 rounded w-1/3 mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                // REAL PRODUCTS
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pb-24">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                // EMPTY STATE
                <div className="text-center py-20 bg-white rounded-2xl border border-stone-100 shadow-sm">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-serif text-[#0a1f1c]">No matches found</h3>
                    <p className="text-sm text-stone-400 max-w-xs mx-auto mt-2">We couldn't find any jewelry matching your current filters.</p>
                    <button onClick={() => {setPriceRange(100000); setSearchQuery('');}} className="mt-6 px-6 py-2 bg-[#0a1f1c] text-white text-xs font-bold uppercase rounded-lg hover:bg-amber-600 transition">
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* --- MOBILE STICKY ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 z-40 lg:hidden flex pb-safe safe-area-bottom">
            <button 
                onClick={() => setShowMobileFilters(true)}
                className="flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0a1f1c] active:bg-stone-50"
            >
                <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <div className="w-px bg-stone-200 my-3"></div>
            <button 
                onClick={() => setShowMobileFilters(true)}
                className="flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0a1f1c] active:bg-stone-50"
            >
                <ArrowUpDown className="w-4 h-4" /> Sort By
            </button>
      </div>

      {/* --- MOBILE FILTER DRAWER --- */}
      <AnimatePresence>
        {showMobileFilters && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowMobileFilters(false)}
                    className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm lg:hidden"
                />
                <motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[70] lg:hidden max-h-[85vh] overflow-y-auto flex flex-col"
                >
                    <div className="p-5 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="font-serif text-xl text-[#0a1f1c]">Refine Results</h3>
                        <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100">
                            <X className="w-5 h-5 text-stone-500" />
                        </button>
                    </div>
                    
                    <div className="p-6 pb-32 overflow-y-auto flex-1">
                        {/* ✅ Reusing the External Component */}
                        <FilterSidebar 
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            categories={categories} rawSlug={rawSlug}
                            setShowMobileFilters={setShowMobileFilters}
                            priceRange={priceRange} setPriceRange={setPriceRange}
                            sortBy={sortBy} setSortBy={setSortBy}
                            isMobile={true}
                        />
                    </div>

                    <div className="p-4 border-t border-stone-100 bg-white sticky bottom-0 flex gap-4">
                        <button onClick={() => {setPriceRange(100000); setSortBy('newest');}} className="flex-1 py-3 border border-stone-200 rounded-xl text-xs font-bold uppercase text-stone-500">Reset</button>
                        <button onClick={() => setShowMobileFilters(false)} className="flex-[2] py-3 bg-[#0a1f1c] text-white rounded-xl text-xs font-bold uppercase shadow-lg">Show Items</button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

    </div>
  );
}