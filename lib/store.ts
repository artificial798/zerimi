import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, query, orderBy,
    getDocs, arrayUnion, arrayRemove, getDoc,writeBatch, where, // 👈 Ye zaroori hai Bulk Update ke liye
  increment
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
    sizes?: string[];
    // 👇 YE 3 NAYI LINES ZAROORI HAIN DATA SAVE KARNE KE LIYE
    sku?: string;
  hsn?: string;
  gstRate?: number;
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
   email: string | null;
    phone?: string;
    phoneNumber?: string;
    profileImage?: string;
    addresses: Address[];
    tier: string;
    role: string;
    points: number;
    // 👇 YE ADD KAREIN (Locked Points)
    pendingPoints?: number;
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
    pointsDiscount?: number; pointsAwarded?: boolean; pointsUnlockDate?: string; // Kab unlock honge (Delivery + 7 Days)
    pointsConverted?: boolean; shipping: number; status: string; date: string; items: any[]; paymentMethod: string; invoiceNo: string; // ✅ YE 3 LINES ADD KAREIN:
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
        state: string;
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
    abandonedCarts: any[];

    // CMS
    banner: Banner;
    categories: CategoryCard[];
    featuredSection: FeaturedSection;
    promoSection: PromoSection;
    siteText: SiteText;

    // App State
   cart: { 
    product: Product; 
    qty: number; 
    selectedSize?: string; 
    selectedColor?: string; 
    isGift?: boolean; // 👈 NEW: Add this optional property
}[];
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
   addToCart: (product: Product, qty?: number, size?: string, color?: string, isGift?: boolean) => void;
    removeFromCart: (id: string) => void;
    // ✅ NEW: Checkout Page ke liye Silent Update Function
    updateQuantity: (productId: string, change: number) => void;
    // Store type definition ke andar (approx line 150-180 ke beech)
    requestReturn: (orderId: string, type: 'Return' | 'Exchange', reason: string) => Promise<void>;
    toggleCart: (status: boolean) => void;
    toggleWishlist: (product: Product) => void;
    clearCart: () => void;
    applyCoupon: (code: string) => { success: boolean; message: string };
    removeCoupon: () => void;            // ✅ Function definition

    // Auth Actions
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
completeProfile: (name: string, email: string) => Promise<void>;
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
    checkAndUnlockPoints: (userId: string) => Promise<void>;
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
abandonedCarts: [],
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
                    return { success: false, message: "Invalid Coupon Code" };
                }

                // 2. CHECK: Personalized Email Lock 🔒
                if (coupon.allowedEmail) {
                    if (!state.currentUser) {
                        return { success: false, message: "Please Login to use this exclusive coupon." };
                    }
                    
                    // 🔥 FIX: Error hatane ke liye ye line zaroori hai
                    // Agar email null hai to empty string "" maano (Logic same rahega)
                    const userEmail = state.currentUser.email || ""; 

                    if (userEmail.toLowerCase() !== coupon.allowedEmail.toLowerCase()) {
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
        // ✅ FIXED: addToCart Logic (Handles Unique ID for Color/Size & Stock Check)
          // ✅ CORRECTED addToCart (Fixes 'reading price' error)
// ✅ UPDATED addToCart (Supports Gift Mode)
addToCart: (product: any, qty: number = 1, size: string = '', color: string = '', isGift: boolean = false) => {
    set((state: any) => {
      // Check if item exists with same ID + Size + Color + Gift Status
      const existingItem = state.cart.find((item: any) => 
        item.product.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color &&
        item.isGift === isGift // 👈 Match gift status too
      );

      if (existingItem) {
        // ✅ Match Found: Update Quantity
        return {
          cart: state.cart.map((item: any) => 
            (item.product.id === product.id && 
             item.selectedSize === size && 
             item.selectedColor === color && 
             item.isGift === isGift)
              ? { ...item, qty: item.qty + qty }
              : item
          ),
          isCartOpen: true
        };
      } else {
        // ✅ New Item: Add to Cart with Gift Status
        return {
          cart: [...state.cart, { 
              product, 
              qty, 
              selectedSize: size, 
              selectedColor: color, 
              isGift: isGift // 👈 Save gift status
          }],
          isCartOpen: true
        };
      }
    });
},
// ✅ NEW: SILENT QUANTITY UPDATE (Checkout Page ke liye)
          // ✅ SILENT QUANTITY UPDATE (Drawer nahi kholega)
  updateQuantity: (productId: string, delta: number, size: string = '', color: string = '') => {
    set((state: any) => ({
      cart: state.cart.map((item: any) => 
        // Sirf wahi item update karo jo ID, Size aur Color match kare
        (item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
          ? { ...item, qty: Math.max(1, item.qty + delta) } // Quantity +1/-1
          : item
      ),
      // ❌ Note: Humne yahan isCartOpen: true NAHI lagaya hai
    }));
  },
           removeFromCart: (productId: string, size: string = '', color: string = '') => {
    set((state: any) => ({
      cart: state.cart.filter((item: any) => 
        // Item tabhi rakho agar ID, Size ya Color match NA kare (yani dusra item ho)
        !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
      )
    }));
  },
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
completeProfile: async (name, email) => {
                const user = auth.currentUser;
                if (!user) return;

                const userData = {
                    id: user.uid,
                    name: name,
                    email: email, // Ab user ne email de diya
                    phone: user.phoneNumber || "",
                    phoneNumber: user.phoneNumber || "",
                    role: 'customer',
                    tier: 'Silver',
                    points: 0,
                    joinedDate: new Date().toLocaleDateString(),
                    addresses: [],
                    profileImage: ""
                };

                try {
                    // Database me save karein
                    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
                    
                    // Auth Profile bhi update karein
                    await updateProfile(user, { displayName: name }); // (Email update requires verification, skipping for now)

                    // Store update karein
                    // @ts-ignore
                    set({ currentUser: userData });
                } catch (e: any) {
                    console.error("Profile Complete Error:", e);
                    throw e;
                }
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
         // ✅ FIXED: placeOrder Logic (Invoice Number Empty Rakhega)
          placeOrder: async (details) => {
                const state = get();

                if (!state.currentUser && !details.email) {
                    alert("🔒 Email is required to place an order.");
                    throw new Error("EMAIL_REQUIRED");
                }

                // 1. ID GENERATION
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const uniqueSuffix = Math.floor(1000 + Math.random() * 9000).toString();

                const orderId = `ZER-${year}${month}${day}-${uniqueSuffix}`;
                
                // 🛑 CHANGE: Pehle yahan Random Invoice ban raha tha, ab ise Empty rakhenge
                const invoiceNo = ""; // ✅ Leave Empty for Admin Series Generation

                // 2. DISCOUNTS
                const cDiscount = state.couponDiscount || 0;
                const pDiscount = state.pointsDiscount || 0;
                const totalDiscount = cDiscount + pDiscount;

                const { name, email, address, total, subtotal, tax, shipping, items, paymentMethod, isGift, giftMessage, giftWrapPrice } = details;

                const newOrder: Order = {
                    id: orderId,
                    invoiceNo: invoiceNo, // ✅ Empty jayega (Admin Panel baad mein bharega)
                    customerName: name,
                    customerEmail: email,
                    address: address,
                    total: total || 0,
                    subtotal: subtotal || 0,
                    tax: tax || 0,
                    shipping: shipping || 0,
                    
                    discount: totalDiscount,      
                    couponDiscount: cDiscount,    
                    pointsDiscount: pDiscount,    

                    // Secret Gift Data
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
                        selectedColor: item.selectedColor || null,
                        
                        hsn: item.product.hsn || "7117", 
                        gstRate: item.product.gstRate || state.systemSettings.taxRate || 3
                    })),
                    
                    paymentMethod: paymentMethod || 'COD',
                };

                // 3. SAVE TO DB
                await setDoc(doc(db, "orders", orderId), newOrder);

                // 4. LOYALTY POINTS DEDUCTION
                if (state.currentUser && state.pointsRedeemed > 0) {
                    const currentPoints = state.currentUser.points || 0;
                    const usedPoints = state.pointsRedeemed || 0;
                    const newWalletBalance = Math.max(0, currentPoints - usedPoints);

                    await updateDoc(doc(db, "users", state.currentUser.id), { points: newWalletBalance });
                    
                    set((prev) => ({
                        currentUser: prev.currentUser ? { ...prev.currentUser, points: newWalletBalance } : null
                    }));
                }

                // 5. NOTIFICATION
                await addDoc(collection(db, "notifications"), {
                    userId: email, title: 'Order Placed', message: `Order #${orderId} confirmed.`,
                    date: new Date().toLocaleDateString('en-IN'), createdAt: new Date().toISOString(), isRead: false
                });

                // 6. RESET STATE
                set({ 
                    cart: [], 
                    appliedCoupon: null, 
                    couponDiscount: 0,
                    pointsRedeemed: 0,
                    pointsDiscount: 0
                });
                
                return orderId;
            },
            // ✅ NEW: RETURN REQUEST LOGIC (Reason Save Karega)
            requestReturn: async (orderId, type, reason) => {
                const state = get();
                
                try {
                    // 1. Database Update
                    await updateDoc(doc(db, "orders", orderId), { 
                        status: type === 'Return' ? 'Return Requested' : 'Exchange Requested',
                        returnReason: reason, // ✅ Ye field zaroori hai
                        returnDate: new Date().toISOString()
                    });
                    
                    // 2. Local State Update (Taaki UI turant badle)
                    set(prev => ({
                        orders: prev.orders.map(o => o.id === orderId ? { 
                            ...o, 
                            status: type === 'Return' ? 'Return Requested' : 'Exchange Requested',
                            returnReason: reason 
                        } : o)
                    }));
                    
                    alert(`${type} request submitted successfully!`);
                } catch (e) {
                    console.error("Return Error:", e);
                    alert("Failed to submit request.");
                }
            },
// ✅ CHECK & UNLOCK POINTS (Runs on App Load)
            checkAndUnlockPoints: async (userId: string) => {
                const state = get();
                // User ke delivered orders dhundho jinke points abhi convert nahi huye
                const pendingOrders = state.orders.filter(o => 
                    o.status === 'Delivered' && 
                    o.pointsAwarded === true && 
                    o.pointsConverted === false &&
                    // Ensure order belongs to current user email lookup
                    state.allUsers.find(u => u.id === userId)?.email === o.customerEmail
                );

                if (pendingOrders.length === 0) return;

                const userRef = doc(db, "users", userId);
                const userSnapshot = await getDoc(userRef);
                if (!userSnapshot.exists()) return;
                
                const userData = userSnapshot.data() as User;
                let currentPoints = userData.points || 0;
                let currentPending = userData.pendingPoints || 0;
                let updated = false;
                const now = new Date();

                // Orders Loop
                for (const order of pendingOrders) {
                    if (order.pointsUnlockDate && new Date(order.pointsUnlockDate) <= now) {
                        // 🎉 7 Din Poore Ho Gaye!
                        const config = state.systemSettings.tierConfig; // Load config
                        // Re-calculate points (Safety)
                        const base = Math.floor((order.total || 0) / 100);
                        // NOTE: Multiplier wahi use karein jo order time pe tha ya current tier
                        // Simple rakhte hain: Current Tier logic
                        let multiplier = 1; 
                        if (userData.tier === 'Gold') multiplier = config?.goldMultiplier || 1.5;
                        // ... logic ...
                        const pointsToUnlock = Math.floor(base * multiplier);

                        // Move: Pending -> Main
                        currentPoints += pointsToUnlock;
                        currentPending = Math.max(0, currentPending - pointsToUnlock);
                        
                        // Mark Order as Converted
                        await updateDoc(doc(db, "orders", order.id), { pointsConverted: true });
                        updated = true;

                        // Notify User
                        await addDoc(collection(db, "notifications"), {
                            userId: userData.email, 
                            title: 'Points Unlocked! 🔓', 
                            message: `${pointsToUnlock} points are now available to use.`,
                            date: new Date().toLocaleDateString(), createdAt: new Date().toISOString(), isRead: false
                        });
                    }
                }

                if (updated) {
                    // Update User Balance & Tier Logic Here (Copy Tier Logic from previous step)
                    // ... (Simplification: Just update points for now)
                    await updateDoc(userRef, { points: currentPoints, pendingPoints: currentPending });
                    
                    // Local Update
                    set(state => ({
                        currentUser: state.currentUser ? { ...state.currentUser, points: currentPoints, pendingPoints: currentPending } : null
                    }));
                }
            },
            // --- ADMIN ACTIONS ---
            addProduct: async (p) => { await setDoc(doc(db, "products", p.id), p); },
            updateProduct: async (id, data) => { await updateDoc(doc(db, "products", id), data); },
            deleteProduct: async (id) => { await deleteDoc(doc(db, "products", id)); },

           // ✅ SMART STATUS UPDATE (Points Add/Remove on Delivery/Return)
          // ✅ UPDATE ORDER STATUS (With 7-Day Lock Logic)
            updateOrderStatus: async (id, status) => {
                const state = get();
                const orderDoc = state.orders.find(o => o.id === id); 
                if (!orderDoc || orderDoc.status === status) return;

                const orderRef = doc(db, "orders", id);
                await updateDoc(orderRef, { status });

                if (!orderDoc.customerEmail) {
                     set(prev => ({ orders: prev.orders.map(o => o.id === id ? { ...o, status } : o) }));
                     return;
                }
                
                const userSnapshot = state.allUsers.find(u => u.email === orderDoc.customerEmail);
                if (!userSnapshot) {
                    set(prev => ({ orders: prev.orders.map(o => o.id === id ? { ...o, status } : o) }));
                    return;
                }

                const userId = userSnapshot.id;
                const currentPending = userSnapshot.pendingPoints || 0;
                const currentPoints = userSnapshot.points || 0; // Usable

                // Settings & Multiplier Logic (Same as before)
                const config = state.systemSettings.tierConfig || { goldThreshold: 1000, platinumThreshold: 5000, solitaireThreshold: 10000, goldMultiplier: 1.5, platinumMultiplier: 2, solitaireMultiplier: 3 };
                const currentTier = userSnapshot.tier || 'Silver';
                let multiplier = 1;
                if (currentTier === 'Solitaire') multiplier = config.solitaireMultiplier;
                else if (currentTier === 'Platinum') multiplier = config.platinumMultiplier;
                else if (currentTier === 'Gold') multiplier = config.goldMultiplier;

                const basePoints = Math.floor((orderDoc.total || 0) / 100); 
                const orderPoints = Math.floor(basePoints * multiplier);

                // ===============================================
                // A. DELIVERED -> MOVE TO PENDING (Lock for 7 Days)
                // ===============================================
                if (status === 'Delivered' && !orderDoc.pointsAwarded) {
                    // 1. Calculate Unlock Date (Today + 7 Days)
                    const unlockDate = new Date();
                    unlockDate.setDate(unlockDate.getDate() + 7); 

                    // 2. Add to PENDING POINTS (Not Usable)
                    const newPending = currentPending + orderPoints;

                    await updateDoc(doc(db, "users", userId), { pendingPoints: newPending });
                    await updateDoc(orderRef, { 
                        pointsAwarded: true, 
                        pointsUnlockDate: unlockDate.toISOString(),
                        pointsConverted: false 
                    });

                    // Local Update
                    set(prev => ({
                        allUsers: prev.allUsers.map(u => u.id === userId ? { ...u, pendingPoints: newPending } : u),
                        orders: prev.orders.map(o => o.id === id ? { ...o, status, pointsAwarded: true, pointsConverted: false } : o)
                    }));
                }

                // ===============================================
                // B. RETURN APPROVED -> REMOVE FROM PENDING
                // ===============================================
                else if (status === 'Return Approved' && orderDoc.pointsAwarded) {
                    // Check karein points abhi Pending hain ya Main mein ja chuke hain
                    if (orderDoc.pointsConverted) {
                        // Agar Main Balance mein thay (7 din baad return hua - Rare Case)
                        const newMain = Math.max(0, currentPoints - orderPoints);
                        await updateDoc(doc(db, "users", userId), { points: newMain });
                    } else {
                        // Agar Pending mein thay (Normal Return)
                        const newPending = Math.max(0, currentPending - orderPoints);
                        await updateDoc(doc(db, "users", userId), { pendingPoints: newPending });
                    }

                    await updateDoc(orderRef, { pointsAwarded: false, pointsConverted: false });
                    
                    // Local Update (Simplification for immediate UI)
                    set(prev => ({
                        orders: prev.orders.map(o => o.id === id ? { ...o, status, pointsAwarded: false } : o)
                    }));
                } 
                else {
                    set(prev => ({ orders: prev.orders.map(o => o.id === id ? { ...o, status } : o) }));
                }
            },
            // 1. ✅ BULK UPDATE (Ek sath multiple orders change karne ke liye)
  bulkUpdateOrderStatus: async (orderIds: string[], status: string) => {
    try {
      const batch = writeBatch(db); // Firebase Batch (Fast)
      orderIds.forEach((id) => {
        const ref = doc(db, 'orders', id);
        batch.update(ref, { status });
      });
      await batch.commit();

      // Local State Update
      set((state: any) => ({
        orders: state.orders.map((o: any) => 
          orderIds.includes(o.id) ? { ...o, status } : o
        ),
        selectedOrders: [] // Clear selection
      }));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  // 2. ✅ TRACKING SAVE (Shiprocket AWB save karne ke liye)
  updateOrderTracking: async (orderId: string, trackingData: any) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      tracking: trackingData,
      status: 'Shipped', // Auto mark Shipped
      shippedAt: new Date().toISOString()
    });
    // Local Update
    set((state: any) => ({
      orders: state.orders.map((o: any) => 
        o.id === orderId ? { ...o, status: 'Shipped', tracking: trackingData } : o
      )
    }));
  },

  // 3. ✅ INTERNAL NOTES (Staff ke personal notes ke liye)
  updateOrderNote: async (orderId: string, note: string) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { internalNote: note });
    // Local Update
    set((state: any) => ({
      orders: state.orders.map((o: any) => 
        o.id === orderId ? { ...o, internalNote: note } : o
      )
    }));
  },
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

// ==========================================
// 4. SMART REAL-TIME LISTENERS (FIXED)
// ==========================================

// ==========================================
// 4. SMART REAL-TIME LISTENERS (FIXED FOR RULES)
// ==========================================

let unsubscribers: Function[] = [];

const initListeners = () => {
    // 1. PUBLIC DATA (Always Listen)
    onSnapshot(collection(db, "products"), (snap) => useStore.setState({ products: snap.docs.map(d => d.data() as Product) }));
    onSnapshot(collection(db, "reviews"), (snap) => useStore.setState({ reviews: snap.docs.map(d => d.data() as Review) }));
    onSnapshot(collection(db, "coupons"), (snap) => useStore.setState({ coupons: snap.docs.map(d => d.data() as Coupon) }));
    onSnapshot(collection(db, "blogs"), (snap) => useStore.setState({ blogs: snap.docs.map(d => d.data() as BlogPost) }));
    // ... (Warranty/CMS listeners same rahenge) ...

    // CMS Listeners (Shortened for brevity - Same as before)
    const cmsKeys = ["banner", "categories", "featured", "promo", "siteText", "config"];
    cmsKeys.forEach(key => {
        onSnapshot(doc(db, "cms", key), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (key === 'config') {
                     // ... (Config logic same as before) ...
                     useStore.setState({
                        systemSettings: {
                            // ... purana config logic ...
                            maintenanceMode: data.store?.maintenanceMode || false,
                            siteName: 'ZERIMI',
                            currencySymbol: data.store?.currency || '₹',
                            taxRate: Number(data.store?.taxRate) || 3,
                            shippingThreshold: Number(data.store?.freeShippingThreshold) || 5000,
                            shippingCost: Number(data.store?.shippingCost) || 150,
                            giftModeCost: Number(data.store?.giftModeCost) || 50,
                            globalAlert: data.store?.globalAlert || '',
                            pointValue: Number(data.store?.pointValue) || 1,
                            tierConfig: data.store?.tierConfig || {},
                            payment: { ...data.store?.payment, razorpay: data.razorpay, payu: data.payu },
                            invoice: data.invoice
                        }
                    });
                } else if (key === 'categories') useStore.setState({ categories: data.list });
                else if (key === 'siteText') useStore.setState({ siteText: data as SiteText });
                else if (key === 'banner') useStore.setState({ banner: data as Banner });
                else if (key === 'featured') useStore.setState({ featuredSection: data as FeaturedSection });
                else if (key === 'promo') useStore.setState({ promoSection: data as PromoSection });
            }
        });
    });

    // 2. AUTH LISTENER
    onAuthStateChanged(auth, (user) => {
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];

        if (user) {
            const userUnsub = onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    useStore.setState({ currentUser: { ...userData, id: user.uid } as User, authCheckComplete: true });
                    
                    useStore.getState().checkAndUnlockPoints(user.uid);

                    // --- ADMIN / MANAGER LOGIC ---
                    if (['admin', 'manager'].includes(userData.role)) {
                        console.log("💎 Admin Access Granted");
                        
                        // Admin sab kuch dekh sakta hai (No 'where' clause needed because rules allow admin)
                        unsubscribers.push(onSnapshot(query(collection(db, "orders"), orderBy("date", "desc")), (snap) => 
                            useStore.setState({ orders: snap.docs.map(d => d.data() as Order) })
                        ));
                        unsubscribers.push(onSnapshot(collection(db, "users"), (snap) => 
                            useStore.setState({ allUsers: snap.docs.map(d => ({ ...d.data(), id: d.id }) as User) })
                        ));
                        unsubscribers.push(onSnapshot(query(collection(db, "messages"), orderBy("date", "desc")), (snap) => 
                            useStore.setState({ messages: snap.docs.map(d => ({ ...d.data(), id: d.id }) as Message) })
                        ));
                         unsubscribers.push(onSnapshot(collection(db, "abandoned_carts"), (snap) => 
                            useStore.setState({ abandonedCarts: snap.docs.map(d => ({ ...d.data(), id: d.id })) })
                        ));
                    } 
                    // --- CUSTOMER LOGIC (CRITICAL FIX 🛠️) ---
                    else {
                        // Fix 1: Orders - Sirf apne orders mangao (Rules Compatible)
                        // Agar user ke paas email hai to email se dhundo, nahi to empty array
                    // ✅ Fix: Email check ko strict banayein
if (userData && userData.email) {
    const myOrdersQuery = query(
        collection(db, "orders"), 
        where("customerEmail", "==", userData.email)
    );
    
    unsubscribers.push(onSnapshot(myOrdersQuery, (snap) => {
        const myOrders = snap.docs.map(d => d.data() as Order);
        // Date sorting fix
        myOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        useStore.setState({ orders: myOrders });
    }, (error) => {
        // 🔥 Error ko console me flood hone se rokein
        console.log("Order Listener Waiting...", error.code);
    }));
} else {
    useStore.setState({ orders: [] });
}
                    }
                } else {
                    // Fallback for Guest/New Phone User
                    useStore.setState({ 
                        currentUser: { 
                            id: user.uid, 
                            name: user.displayName || 'Guest', 
                            email: user.email || null, 
                            phoneNumber: user.phoneNumber,
                            role: 'customer', 
                            tier: 'Silver', 
                            points: 0, 
                            joinedDate: new Date().toLocaleDateString(), 
                            addresses: [] 
                        } as User, 
                        authCheckComplete: true 
                    });
                }
            });
            unsubscribers.push(userUnsub);

            // Fix 2: Notifications - Sirf apni notifications (Rules Compatible)
            // UID ya Email dono check karenge
            const myId = user.email || user.uid; // Fallback to UID for phone users
            
            // Note: Rules me humne UID aur Email dono allow kiya hai.
            // Best practice: Query specific field se karein.
            // Hum yahan client-side filter use karenge lekin query ko 'broad' hone se bachaenge
            
            // Abhi ke liye Notifications ka 'where' query hata kar sirf tab load karein jab user admin ho
            // Ya fir client side sorting ke sath specific query lagayein
            
            // CUSTOMER NOTIFICATION QUERY:
            if (user.uid) { // UID hamesha hoti hai
                // Hum notification me 'userId' field use kar rahe hain jo email bhi ho sakta hai
                // Isliye hum store me dono check nahi kar sakte query me (OR operator limitations)
                
                // Safe approach: Agar email hai to email se dhundo
                const targetId = user.email || user.uid;
                
                unsubscribers.push(onSnapshot(
                    query(collection(db, "notifications"), where("userId", "==", targetId)),
                    (snap) => {
                        const notifs = snap.docs.map(d => ({ ...d.data(), id: d.id }) as Notification);
                        notifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                        useStore.setState({ notifications: notifs });
                    }
                ));
            }

        } else {
            // Logout
            useStore.setState({ currentUser: null, authCheckComplete: true, orders: [], messages: [], allUsers: [] });
        }
        useStore.setState({ loading: false });
    });
};
// Start Syncing on Client Side
if (typeof window !== 'undefined') {
    initListeners();
}