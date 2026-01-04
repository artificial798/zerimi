import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, query, orderBy,
    getDocs, arrayUnion, arrayRemove
} from "firebase/firestore";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile
} from "firebase/auth";
import { auth, db } from './firebase';

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

export type Product = {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    description: string;
    image: string;
    hoverImage: string;
    images: string[];
    stock?: number;
    tags?: string[];
    colors?: string[];   // E.g., ["#000000", "#FF0000"] used for swatches
    // 👇 YE 3 NAYI LINES ZAROORI HAIN DATA SAVE KARNE KE LIYE
    sku?: string;
  hsn?: string;
    material?: string;
    warranty?: string;
    care?: string;
    reviews?: Review[];
};
export type Review = { id: string; productId: string; userName: string; rating: number; comment: string; date: string; verified?: boolean; image?: string | null; };
export type BlogPost = { id: string; title: string; category: string; image: string; date: string; content: string; };
export type CategoryCard = { id: string; title: string; image: string; name?: string; };
export type FeaturedSection = { title: string; subtitle: string; image: string; };
export type PromoSection = { title: string; description: string; image: string; };
export type Banner = { title: string; subtitle: string; image: string; logoDark: string; logoWhite: string; };

// ✅ NEW: Message Type for Contact Form
export type Message = { id: string; name: string; email: string; phone: string; subject: string; message: string; date: string; isRead: boolean; };

export type Address = { id: string; street: string; city: string; state: string; pincode: string; phone: string; isDefault?: boolean; };

export type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
    addresses: Address[];
    tier: string;
    role: string;
    points: number;
    joinedDate: string;
    dob?: string;
    gender?: string;
    alternatePhone?: string;
};

export type Notification = { 
    id: string; 
    userId: string; 
    title: string; 
    message: string; 
    date: string; 
    isRead: boolean; 
    createdAt?: string; // ✅ YE LINE ADD KAREIN
};
export type Coupon = {
    id: string;
    code: string;
    description?: string;
    discount: number;
    type: 'percent' | 'flat';
    minOrderValue: number;
    expiryDate?: string;
    allowedEmail?: string; // ✅ YE LINE ADD KAREIN (Lock feature ke liye)
};
export type Order = { id: string; customerName: string; customerEmail?: string; address: Address; total: number; subtotal: number; tax: number; discount: number; couponDiscount?: number; 
    pointsDiscount?: number; shipping: number; status: string; date: string; items: any[]; paymentMethod: string; invoiceNo: string; // ✅ YE 3 LINES ADD KAREIN:
    isGift?: boolean;
    giftMessage?: string;
    giftWrapPrice?: number; };
export type Warranty = { id: string; userEmail: string; productName: string; expiryDate: string; certificateId: string; image: string; purchaseDate: string; };
export type SystemSettings = {
    maintenanceMode: boolean;
    siteName: string;
    currencySymbol: string;
    taxRate: number;
    shippingThreshold: number;
    globalAlert: string;
    shippingCost?: number;
giftModeCost?: number;
// 👇 Points Redemption Rate (Ex: 1 Point = ₹0.50)
    pointValue?: number; 

    // 👇 NEW: ADMIN CONTROL FOR TIERS (Thresholds & Multipliers)
    tierConfig?: {
        goldThreshold: number;      // e.g., 1000
        platinumThreshold: number;  // e.g., 5000
        solitaireThreshold: number; // e.g., 10000
        goldMultiplier: number;     // e.g., 1.5x
        platinumMultiplier: number; // e.g., 2x
        solitaireMultiplier: number; // e.g., 3x
    };
    // ✅ UPDATED PAYMENT STRUCTURE
    payment?: {
        // Instamojo Keys
        instamojoApiKey?: string;
        instamojoAuthToken?: string;
        instamojoEnabled?: boolean;

        // Razorpay Keys
        razorpay?: { enabled: boolean; keyId: string; keySecret: string; };

        // PayU Keys
        payu?: { enabled: boolean; merchantKey: string; merchantSalt: string; };
    };
    // 👇 NEW: INVOICE SETTINGS ADD KAREIN
    invoice?: {
        companyName: string;
        address: string;
        gstin: string;
        terms: string;
        logoUrl: string;
    };
};

export type SiteText = {
    heroTitle: string;
    heroSubtitle: string;
    heroBtnText: string;
    newArrivalsTitle: string;
    newArrivalsSub: string;
    featuredTitle: string;
    featuredSub: string;
    promoTitle: string;
    promoText: string;
    promoBtn: string;
    blogTitle: string;
    secretGiftBadge: string;
    secretGiftTitle: string;
    secretGiftSub: string;
    secretGiftQuote: string;
    secretGiftImage?: string;
};

// Default Data
const DEFAULT_BANNER = { title: 'Timeless Luxury', subtitle: 'Collection 2025', image: "", logoDark: '/logo-dark.png', logoWhite: '/logo-white.png' };
const DEFAULT_TEXT: SiteText = {
    heroTitle: "Timeless Elegance",
    heroSubtitle: "The ZERIMI Privilege",
    heroBtnText: "Explore Now",
    newArrivalsTitle: "New Arrivals",
    newArrivalsSub: "Curated specifically for the modern you.",
    featuredTitle: "Diamonds & Engagement Rings",
    featuredSub: "Experience brilliance.",
    promoTitle: "Special Offer",
    promoText: "Limited time deals on our finest jewelry.",
    promoBtn: "Discover More",
    blogTitle: "From Our Journal",
    secretGiftBadge: "New Feature",
    secretGiftTitle: "The Art of Secret Gifting",
    secretGiftSub: "Surprise your loved ones with luxury...",
    secretGiftQuote: "I wanted to see you smile...",
    secretGiftImage: "" // ✅ NEW: Default Empty
};

// ==========================================
// 2. STORE INTERFACE
// ==========================================

type Store = {
    // Data
    products: Product[];
    reviews: Review[];
    blogs: BlogPost[];
    coupons: Coupon[];
    orders: Order[];
    warranties: Warranty[];
    notifications: Notification[];
    allUsers: User[];
    messages: Message[]; // ✅ NEW: Messages List for Admin
    

    // CMS
    banner: Banner;
    categories: CategoryCard[];
    featuredSection: FeaturedSection;
    promoSection: PromoSection;
    siteText: SiteText;

    // App State
    cart: { product: Product; qty: number; selectedSize?: string; selectedColor?: string }[];
    wishlist: Product[];
    isCartOpen: boolean;
    currentUser: User | null;
    authCheckComplete: boolean;
    systemSettings: SystemSettings;
    loading: boolean;
    appliedCoupon: Coupon | null; // ✅ Naya State
    couponDiscount: number;       // ✅ Naya State
// 👇 YE 4 LINES ADD KAREIN (Loyalty State)
    pointsRedeemed: number;   
    pointsDiscount: number;   
    redeemLoyaltyPoints: (points: number) => void; 
    removeLoyaltyPoints: () => void;
    // Cart Actions
   addToCart: (product: Product, qty?: number, size?: string, color?: string) => void;
    removeFromCart: (id: string) => void;
    toggleCart: (status: boolean) => void;
    toggleWishlist: (product: Product) => void;
    clearCart: () => void;
    applyCoupon: (code: string) => { success: boolean; message: string };
    removeCoupon: () => void;            // ✅ Function definition

    // Auth Actions
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name: string) => Promise<void>;
    logout: () => Promise<void>;

    // User Actions
    addUserAddress: (uid: string, address: Address) => Promise<void>;
    removeUserAddress: (uid: string, address: Address) => Promise<void>;
    updateUserProfile: (uid: string, data: Partial<User>) => Promise<void>;

    // Order Actions
   placeOrder: (details: any) => Promise<string>;

    // Admin Actions
    addProduct: (p: Product) => void;
    updateProduct: (id: string, data: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    updateOrderStatus: (id: string, status: string) => void;
    // ✅ ADD THIS LINE HERE:
    deleteOrder: (id: string) => Promise<void>;
    updateUserRole: (email: string, role: string) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    // CMS Actions
    updateBanner: (data: Banner) => void;
    updateCategories: (data: CategoryCard[]) => void;
    updateFeatured: (data: FeaturedSection) => void;
    updatePromo: (data: PromoSection) => void;
    updateSiteText: (data: SiteText) => void;
    updateSystemConfig: (data: any) => Promise<void>;

    addBlog: (blog: BlogPost) => void;
    deleteBlog: (id: string) => void;

    addCoupon: (c: Coupon) => void;
    deleteCoupon: (id: string) => void;

    addReview: (review: Review) => Promise<void>;

    // ✅ NEW: Contact Message Actions
    sendMessage: (data: { name: string; email: string; phone: string; subject: string; message: string; }) => Promise<void>;
    markMessageRead: (id: string) => Promise<void>;
    deleteMessage: (id: string) => Promise<void>;

    sendNotification: (email: string, title: string, message: string) => void;
    markNotificationRead: (id: string) => void;
    nukeDatabase: () => void;
};

// ==========================================
// 3. STORE IMPLEMENTATION
// ==========================================

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            // Initial State
            appliedCoupon: null, // ✅ Default Value
            couponDiscount: 0,   // ✅ Default Value
            pointsRedeemed: 0,
            pointsDiscount: 0,
            products: [],

            reviews: [],
            blogs: [],
            coupons: [],
            orders: [],
            warranties: [],
            notifications: [],
            allUsers: [],
            messages: [], // ✅ NEW

            banner: DEFAULT_BANNER,
            categories: [],
            featuredSection: { title: "", subtitle: "", image: "" },
            promoSection: { title: "", description: "", image: "" },
            siteText: DEFAULT_TEXT,

            cart: [],
            wishlist: [],
            isCartOpen: false,
            currentUser: null,
            authCheckComplete: false,
            systemSettings: { maintenanceMode: false, siteName: 'ZERIMI', currencySymbol: '₹', taxRate: 3, shippingThreshold: 5000, globalAlert: '' },
            loading: true,
            // ✅ NEW: COUPON LOGIC (PERSONALIZED)
            applyCoupon: (code: string) => {
                const state = get();
                const subtotal = state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

                // 1. Find Coupon
                const coupon = state.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());

                if (!coupon) {
                    // ❌ Alert hataya, Return lagaya
                    return { success: false, message: "Invalid Coupon Code" };
                }

                // 2. CHECK: Personalized Email Lock 🔒
                if (coupon.allowedEmail) {
                    if (!state.currentUser) {
                        return { success: false, message: "Please Login to use this exclusive coupon." };
                    }
                    if (state.currentUser.email.toLowerCase() !== coupon.allowedEmail.toLowerCase()) {
                        // 🔒 Security: Generic message (Email hide kiya)
                        return { success: false, message: "This coupon is not valid for your account." };
                    }
                }

                // 3. Min Order Value Check
                if (subtotal < coupon.minOrderValue) {
                    return { success: false, message: `Add items worth ₹${coupon.minOrderValue} to use this code.` };
                }

                // 4. Calculate Discount
                let discountAmount = 0;
                if (coupon.type === 'percent') {
                    discountAmount = Math.round((subtotal * coupon.discount) / 100);
                } else {
                    discountAmount = coupon.discount;
                }

                // 5. Apply
                set({ appliedCoupon: coupon, couponDiscount: discountAmount });

                // 🎉 Success Return
                return { success: true, message: `Coupon Applied! You saved ₹${discountAmount}` };
            },

            removeCoupon: () => set({ appliedCoupon: null, couponDiscount: 0 }),
            // 👇 YE DO NAYE FUNCTIONS PASTE KAREIN
            redeemLoyaltyPoints: (pointsToUse) => {
                const state = get();
                const userPoints = state.currentUser?.points || 0;
                
                // 1. Admin ki set ki hui Value lo (Default: 1 Point = ₹1)
                const rate = state.systemSettings.pointValue || 1; 

                // 2. Validation
                if (pointsToUse > userPoints) {
                    alert("Insufficient Points!");
                    return;
                }

                // 3. Discount Calculate Karo
                const discountValue = Math.floor(pointsToUse * rate); 

                // 4. Cart Total Check (Discount total se zyada na ho)
                const subtotal = state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
                
                if (discountValue >= subtotal) {
                    alert("Points discount cannot exceed cart total.");
                    return;
                }

                // 5. Apply
                set({ 
                    pointsRedeemed: pointsToUse, 
                    pointsDiscount: discountValue 
                });
            },

            removeLoyaltyPoints: () => set({ pointsRedeemed: 0, pointsDiscount: 0 }),
            // --- CART & WISHLIST ---
            // ✅ NAYA CODE (Stock Check ke saath)
           // ✅ FIXED: addToCart Logic (Checks ID + Size + Color)
            addToCart: (product, qty = 1, size, color) => {
                if (!product.stock || product.stock < qty) {
                    alert(`Sorry, "${product.name}" is currently Out of Stock!`);
                    return;
                }

                set((state) => {
                    // Check if SAME item (ID + Size + Color) exists
                    const existingItemIndex = state.cart.findIndex(
                        (item) => 
                            item.product.id === product.id && 
                            item.selectedSize === size && 
                            item.selectedColor === color
                    );

                    let newCart = [...state.cart];

                    if (existingItemIndex > -1) {
                        if (newCart[existingItemIndex].qty + qty > (product.stock || 0)) {
                            alert("Cannot add more. You reached the stock limit.");
                            return state;
                        }
                        newCart[existingItemIndex].qty += qty;
                    } else {
                        newCart.push({ 
                            product, 
                            qty, 
                            selectedSize: size, 
                            selectedColor: color // ✅ Added Color
                        });
                    }

                    return { cart: newCart, isCartOpen: true };
                });
            },

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.product.id !== id)
            })),
            toggleCart: (status) => set({ isCartOpen: status }),
            clearCart: () => set({ cart: [] }),
            toggleWishlist: (product) => set((state) => {
                const exists = state.wishlist.find((p) => p.id === product.id);
                return { wishlist: exists ? state.wishlist.filter((p) => p.id !== product.id) : [...state.wishlist, product] };
            }),

            // --- AUTH ---
            login: async (email, pass) => {
                try {
                    await signInWithEmailAndPassword(auth, email, pass);
                } catch (e: any) {
                    alert("Login Failed: " + e.message);
                    throw e;
                }
            },
            register: async (email, pass, name) => {
                try {
                    const res = await createUserWithEmailAndPassword(auth, email, pass);
                    await updateProfile(res.user, { displayName: name });

                    await setDoc(doc(db, "users", res.user.uid), {
                        id: res.user.uid,
                        name: name,
                        email: email,
                        role: 'customer',
                        tier: 'Silver',
                        points: 0,
                        joinedDate: new Date().toLocaleDateString(),
                        addresses: [],
                        profileImage: ""
                    });
                } catch (e: any) {
                    alert("Registration Failed: " + e.message);
                }
            },
            logout: async () => {
                await signOut(auth);
                set({ currentUser: null, authCheckComplete: true });
            },

            // --- USER ACTIONS ---
            addUserAddress: async (uid, address) => {
                try {
                    const userRef = doc(db, "users", uid);
                    await updateDoc(userRef, { addresses: arrayUnion(address) });
                } catch (e) { console.error("Add Address Failed:", e); throw e; }
            },
            removeUserAddress: async (uid, address) => {
                try {
                    const userRef = doc(db, "users", uid);
                    await updateDoc(userRef, { addresses: arrayRemove(address) });
                } catch (e) { console.error("Remove Address Failed:", e); throw e; }
            },
            updateUserProfile: async (uid, data) => {
                try {
                    await updateDoc(doc(db, "users", uid), data);
                    set((state) => ({ currentUser: state.currentUser ? { ...state.currentUser, ...data } : null }));
                } catch (error) { console.error("Profile Update Error:", error); throw error; }
            },

            // --- ORDERS ---
            // ✅ NAYA CODE (Login + Stock Check + Inventory Update)
          // --- ORDERS ---
            // ✅ UPDATED: Ab ye Checkout Page se aayi hui exact values save karega
          // ✅ FIXED: placeOrder Logic (Saves Size & Color correctly)
// ✅ FIXED PLACE ORDER LOGIC (Auto-Calculate Discount)
            placeOrder: async (details) => {
                const state = get();

                if (!state.currentUser && !details.email) {
                    alert("🔒 Email is required to place an order.");
                    throw new Error("EMAIL_REQUIRED");
                }

                // --- 1. ID GENERATION ---
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const uniqueSuffix = Math.floor(1000 + Math.random() * 9000).toString();

                const orderId = `ZER-${year}${month}${day}-${uniqueSuffix}`;
                const invoiceNo = `INV/${year}/${uniqueSuffix}`;

                // --- 2. CALCULATE TOTAL DISCOUNT (Coupon + Points) ---
                // Hum UI se aayi value par bharosa nahi karenge, Store State use karenge
               // --- 2. CALCULATE DISCOUNTS ---
                const cDiscount = state.couponDiscount || 0;
                const pDiscount = state.pointsDiscount || 0;
                const totalDiscount = cDiscount + pDiscount;

                // ✅ Data Preparation
                const { name, email, address, total, subtotal, tax, shipping, items, paymentMethod, isGift, giftMessage, giftWrapPrice } = details;

                const newOrder: Order = {
                    id: orderId,
                    invoiceNo: invoiceNo,
                    customerName: name,
                    customerEmail: email,
                    address: address,
                    total: total || 0,
                    subtotal: subtotal || 0,
                    tax: tax || 0,
                    shipping: shipping || 0,

                    // ✅ FIX: Ab hum Total bhi bhejenge aur Breakdown bhi
                    discount: totalDiscount,      // Total Discount (Compatibility ke liye)
                    couponDiscount: cDiscount,    // Alag se save kiya
                    pointsDiscount: pDiscount,    // Alag se save kiya

                    isGift: isGift || false,
                    giftMessage: giftMessage || '',
                    giftWrapPrice: giftWrapPrice || 0,
                    status: 'Pending',
                    date: new Date().toISOString(),
                    items: items || state.cart.map(item => ({
                        name: item.product.name,
                        qty: item.qty,
                        price: item.product.price,
                        image: item.product.image,
                        selectedSize: item.selectedSize || 'N/A',
                        selectedColor: item.selectedColor || null
                    })),
                    paymentMethod: paymentMethod || 'COD',
                };
                // 3. Database Save
                await setDoc(doc(db, "orders", orderId), newOrder);

                // --- 4. LOYALTY LOGIC (Points Earn/Burn) ---
                if (state.currentUser) {
                    const currentPoints = state.currentUser.points || 0;
                    const usedPoints = state.pointsRedeemed || 0; // Jitne points use kiye

                    // Admin Settings Load
                    const config = state.systemSettings.tierConfig || {
                        goldThreshold: 1000, platinumThreshold: 5000, solitaireThreshold: 10000,
                        goldMultiplier: 1.5, platinumMultiplier: 2, solitaireMultiplier: 3
                    };

                    // Multiplier Calculation
                    let multiplier = 1;
                    if (currentPoints >= config.solitaireThreshold) multiplier = config.solitaireMultiplier;
                    else if (currentPoints >= config.platinumThreshold) multiplier = config.platinumMultiplier;
                    else if (currentPoints >= config.goldThreshold) multiplier = config.goldMultiplier;

                    // Earned Points (Spent Amount / 100 * Multiplier)
                    const basePoints = Math.floor((details.total || 0) / 100);
                    const earnedPoints = Math.floor(basePoints * multiplier);

                    // Final Points Logic: (Purane + Kamaye - Kharch Kiye)
                    const newTotalPoints = Math.max(0, currentPoints + earnedPoints - usedPoints);

                    // Update Tier
                    let newTierName = 'Silver';
                    if (newTotalPoints >= config.solitaireThreshold) newTierName = 'Solitaire';
                    else if (newTotalPoints >= config.platinumThreshold) newTierName = 'Platinum';
                    else if (newTotalPoints >= config.goldThreshold) newTierName = 'Gold';

                    // Update User in DB
                    const userRef = doc(db, "users", state.currentUser.id);
                    await updateDoc(userRef, { points: newTotalPoints, tier: newTierName });

                    // Update Local User State
                    set((prev) => ({
                        currentUser: prev.currentUser ? { ...prev.currentUser, points: newTotalPoints, tier: newTierName } : null
                    }));
                }

                // Notification
                await addDoc(collection(db, "notifications"), {
                    userId: email, title: 'Order Placed', message: `Order #${orderId} confirmed.`,
                    date: new Date().toLocaleDateString('en-IN'), createdAt: new Date().toISOString(), isRead: false
                });

                // ✅ RESET ALL STATES (Points bhi reset hone chahiye)
                set({ 
                    cart: [], 
                    appliedCoupon: null, 
                    couponDiscount: 0,
                    pointsRedeemed: 0,  // 👈 Fix: Points reset
                    pointsDiscount: 0   // 👈 Fix: Points discount reset
                });
                
                return orderId;
            },

            // --- ADMIN ACTIONS ---
            addProduct: async (p) => { await setDoc(doc(db, "products", p.id), p); },
            updateProduct: async (id, data) => { await updateDoc(doc(db, "products", id), data); },
            deleteProduct: async (id) => { await deleteDoc(doc(db, "products", id)); },

            updateOrderStatus: async (id, status) => { await updateDoc(doc(db, "orders", id), { status }); },
// ✅ ADD THIS FUNCTION HERE:
            deleteOrder: async (id) => {
                if (!id) return;
                try {
                    // 1. Delete from Firebase
                    await deleteDoc(doc(db, "orders", id));
                    
                    // 2. Update Local State immediately (so it disappears from UI)
                    set((state) => ({ 
                        orders: state.orders.filter((o) => o.id !== id) 
                    }));
                } catch (e) { 
                    console.error("Delete Order Failed:", e); 
                    throw e; 
                }
            },
            updateUserRole: async (email, role) => {
                const state = get();
                const user = state.allUsers.find((u) => u.email === email);
                if (user && user.id) {
                    try { await updateDoc(doc(db, "users", user.id), { role }); } catch (e) { console.error("Role Update Failed:", e); }
                }
            },

            deleteUser: async (id) => {
                if (!id) return;
                try {
                    await deleteDoc(doc(db, "users", id));
                    set((state) => ({ allUsers: state.allUsers.filter((u) => u.id !== id) }));
                } catch (e) { console.error("Delete User Failed:", e); throw e; }
            },

            // --- CMS ACTIONS ---
            updateBanner: async (data) => { await setDoc(doc(db, "cms", "banner"), data); },
            updateCategories: async (data) => { await setDoc(doc(db, "cms", "categories"), { list: data }); },
            updateFeatured: async (data) => { await setDoc(doc(db, "cms", "featured"), data); },
            updatePromo: async (data) => { await setDoc(doc(db, "cms", "promo"), data); },
            updateSiteText: async (data) => { await setDoc(doc(db, "cms", "siteText"), data); },

           updateSystemConfig: async (data) => {
                try {
                    // 1. Database mein Save karo
                    await setDoc(doc(db, "cms", "config"), data);

                    // 2. Local State Update (Complete Data ke sath)
                    set((state) => ({
                        systemSettings: {
                            ...state.systemSettings,
                            pointValue: Number(data.store?.pointValue) || 1,

                // 👇 NEW: Tier Config Load Logic
                tierConfig: {
                    goldThreshold: Number(data.store?.tierConfig?.goldThreshold) || 1000,
                    platinumThreshold: Number(data.store?.tierConfig?.platinumThreshold) || 5000,
                    solitaireThreshold: Number(data.store?.tierConfig?.solitaireThreshold) || 10000,
                    
                    goldMultiplier: Number(data.store?.tierConfig?.goldMultiplier) || 1.5,
                    platinumMultiplier: Number(data.store?.tierConfig?.platinumMultiplier) || 2,
                    solitaireMultiplier: Number(data.store?.tierConfig?.solitaireMultiplier) || 3,
                },
                            // Store Basic Rules
                            taxRate: Number(data.store?.taxRate) || 3,
                            shippingCost: Number(data.store?.shippingCost) || 150,
                            shippingThreshold: Number(data.store?.freeShippingThreshold) || 5000,
                            // ✅ YE LINE ADD KAREIN:
                            giftModeCost: Number(data.store?.giftModeCost) || 50,
                            maintenanceMode: data.store?.maintenanceMode || false,
                            globalAlert: data.store?.globalAlert || '',

                            // ✅ PAYMENT SETTINGS UPDATE (Ye Missing Tha)
                            payment: {
                                ...state.systemSettings.payment,
                                ...data.payment, // Instamojo keys
                                razorpay: data.razorpay, // Razorpay Object
                                payu: data.payu          // PayU Object
                            },

                            // ✅ INVOICE SETTINGS UPDATE (Ye Bhi Missing Tha)
                            invoice: data.invoice || {
                                companyName: 'ZERIMI JEWELS',
                                address: '',
                                gstin: '',
                                terms: '',
                                logoUrl: ''
                            }
                        }
                    }));
                } catch (e) { console.error("Config Save Failed:", e); throw e; }
            },

            addBlog: async (blog) => { await setDoc(doc(db, "blogs", blog.id), blog); },
            deleteBlog: async (id) => { await deleteDoc(doc(db, "blogs", id)); },

            addCoupon: async (c) => { await setDoc(doc(db, "coupons", c.id), c); },
            deleteCoupon: async (id) => { await deleteDoc(doc(db, "coupons", id)); },

            addReview: async (review) => {
                try { await setDoc(doc(db, "reviews", review.id), review); }
                catch (e) { console.error("Add Review Failed:", e); alert("Failed to submit review"); }
            },

            // ✅ NEW: MESSAGE ACTIONS (Send, Read, Delete)
            sendMessage: async (data) => {
                try {
                    await addDoc(collection(db, "messages"), {
                        ...data,
                        date: new Date().toISOString(),
                        isRead: false
                    });
                } catch (e) {
                    console.error("Message Failed:", e);
                    throw e;
                }
            },
            markMessageRead: async (id) => { await updateDoc(doc(db, "messages", id), { isRead: true }); },
            deleteMessage: async (id) => { await deleteDoc(doc(db, "messages", id)); },

           sendNotification: async (email, title, message) => {
    await addDoc(collection(db, "notifications"), { 
        userId: email, 
        title, 
        message, 
        date: new Date().toLocaleDateString(), 
        createdAt: new Date().toISOString(), // ✅ YE LINE ZAROORI HAI SORTING KE LIYE
        isRead: false 
    });
},
            markNotificationRead: async (id) => { await updateDoc(doc(db, "notifications", id), { isRead: true }); },

          nukeDatabase: async () => {
                try {
                    // ✅ SIRF IN COLLECTIONS KO DELETE KARENGE (Operations & Growth)
                    // ❌ Users, Settings, aur CMS (Design) ko hath nahi lagayenge
                    const collectionsToDelete = [
                        "products",       // Inventory (Operations)
                        "orders",         // Orders (Operations)
                        "messages",       // Inbox (Operations)
                        "coupons",        // Coupons (Growth)
                        "notifications",  // Marketing (Growth)
                        "reviews",        // Reviews
                        "warranties",     // Warranties
                        "blogs"           // Blogs
                    ];

                    for (const colName of collectionsToDelete) {
                        const q = query(collection(db, colName));
                        const snapshot = await getDocs(q);
                        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                        await Promise.all(deletePromises);
                    }

                    // ✅ LOCAL STATE RESET (Sirf deleted data ko clear karein)
                    set({
                        products: [], 
                        orders: [], 
                        coupons: [],
                        warranties: [], 
                        notifications: [], 
                        blogs: [], 
                        reviews: [], 
                        messages: [],
                        // users: [],  <-- ISKO COMMENT KAR DIYA (Users Safe rahenge)
                    });
                    
                    console.log("💥 Operational Data Wiped Successfully. Users & Settings Preserved.");
                } catch (e) { 
                    console.error("Nuke Failed:", e); 
                    throw e; 
                }
            },
        }),
        {
            name: 'zerimi-local-cart',
            // ✅ currentUser add kar diya taaki refresh hone par data na ude
            partialize: (state) => ({
                cart: state.cart,
                wishlist: state.wishlist,
                currentUser: state.currentUser,
                appliedCoupon: state.appliedCoupon,
                couponDiscount: state.couponDiscount,
                pointsRedeemed: state.pointsRedeemed,
                pointsDiscount: state.pointsDiscount
            }),
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ==========================================
// 4. REAL-TIME LISTENERS
// ==========================================

let listenersInitialized = false;

const initListeners = () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    // Data Collections
    onSnapshot(collection(db, "products"), (snap) => useStore.setState({ products: snap.docs.map(d => d.data() as Product) }));
    onSnapshot(query(collection(db, "orders"), orderBy("date", "desc")), (snap) => useStore.setState({ orders: snap.docs.map(d => d.data() as Order) }));
    onSnapshot(collection(db, "reviews"), (snap) => useStore.setState({ reviews: snap.docs.map(d => d.data() as Review) }));

    // ✅ NEW: Messages Listener (For Admin Inbox)
    onSnapshot(query(collection(db, "messages"), orderBy("date", "desc")), (snap) => useStore.setState({
        messages: snap.docs.map(d => ({ ...d.data(), id: d.id }) as Message)
    }));

    onSnapshot(collection(db, "users"), (snap) => useStore.setState({
        allUsers: snap.docs.map(d => ({ ...d.data(), id: d.id }) as User)
    }));

    // CMS Documents
  // CMS Documents
    const cmsKeys = ["banner", "categories", "featured", "promo", "siteText", "config"];
    
    cmsKeys.forEach(key => {
        onSnapshot(doc(db, "cms", key), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();

                if (key === 'categories') {
                    useStore.setState({ categories: data.list });
                } 
                else if (key === 'siteText') {
                    useStore.setState({ siteText: data as SiteText });
                } 
                else if (key === 'banner') {
                    useStore.setState({ banner: data as Banner });
                } 
                else if (key === 'featured') {
                    useStore.setState({ featuredSection: data as FeaturedSection });
                } 
                else if (key === 'promo') {
                    useStore.setState({ promoSection: data as PromoSection });
                } 
                else if (key === 'config') {
                    // ✅ COMPLETE CONFIG LOAD LOGIC
                    useStore.setState({
                        systemSettings: {
                            maintenanceMode: data.store?.maintenanceMode || false,
                            siteName: 'ZERIMI',
                            currencySymbol: data.store?.currency || '₹',
                            taxRate: Number(data.store?.taxRate) || 3,
                            shippingThreshold: Number(data.store?.freeShippingThreshold) || 5000,
                            shippingCost: Number(data.store?.shippingCost) || 150,
                            // ✅ YE LINE ADD KAREIN:
                            giftModeCost: Number(data.store?.giftModeCost) || 50,
                            globalAlert: data.store?.globalAlert || '',
// 👇 YE PART ADD KAREIN (Isse Admin Settings Customer tak pahunchengi)
            pointValue: Number(data.store?.pointValue) || 1,
            tierConfig: {
                goldThreshold: Number(data.store?.tierConfig?.goldThreshold) || 1000,
                platinumThreshold: Number(data.store?.tierConfig?.platinumThreshold) || 5000,
                solitaireThreshold: Number(data.store?.tierConfig?.solitaireThreshold) || 10000,
                goldMultiplier: Number(data.store?.tierConfig?.goldMultiplier) || 1.5,
                platinumMultiplier: Number(data.store?.tierConfig?.platinumMultiplier) || 2,
                solitaireMultiplier: Number(data.store?.tierConfig?.solitaireMultiplier) || 3,
            },
                            // Payment Data Load
                            payment: {
                                instamojoApiKey: data.store?.payment?.instamojoApiKey,
                                instamojoAuthToken: data.store?.payment?.instamojoAuthToken,
                                instamojoEnabled: data.store?.payment?.instamojoEnabled,
                                razorpay: data.razorpay, // Direct Root se load
                                payu: data.payu          // Direct Root se load
                            },

                            // ✅ INVOICE DATA LOAD (Ye Add kiya hai)
                            invoice: data.invoice || {
                                companyName: 'ZERIMI JEWELS',
                                address: '',
                                gstin: '',
                                terms: '',
                                logoUrl: ''
                            }
                        }
                    });
                }
            }
        });
    });

    // Auth & User Profile Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    useStore.setState({
                        currentUser: { ...userData, id: user.uid } as User,
                        authCheckComplete: true
                    });
                } else {
                    const fallbackUser = {
                        id: user.uid, name: user.displayName || 'User', email: user.email!,
                        role: 'customer', tier: 'Silver', points: 0,
                        joinedDate: new Date().toLocaleDateString(), addresses: [], profileImage: ""
                    };
                    useStore.setState({ currentUser: fallbackUser, authCheckComplete: true });
                }
            });
        } else {
            useStore.setState({ currentUser: null, authCheckComplete: true });
        }
        useStore.setState({ loading: false });
    });

    // Secondary Collections
    onSnapshot(collection(db, "warranties"), (snap) => useStore.setState({ warranties: snap.docs.map(d => d.data() as Warranty) }));
  // ✅ FIX: OrderBy 'desc' (Newest First) aur ID Mapping
onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snap) => useStore.setState({ 
    notifications: snap.docs.map(d => ({ ...d.data(), id: d.id }) as Notification) 
}));
    onSnapshot(collection(db, "coupons"), (snap) => useStore.setState({ coupons: snap.docs.map(d => d.data() as Coupon) }));
    onSnapshot(collection(db, "blogs"), (snap) => useStore.setState({ blogs: snap.docs.map(d => d.data() as BlogPost) }));
};

// Start Syncing on Client Side
if (typeof window !== 'undefined') {
    initListeners();
}