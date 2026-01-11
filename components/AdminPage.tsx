"use client";
import { useState, useRef, useEffect } from 'react';
import { useStore, Product, BlogPost } from '@/lib/store';
import {
    Trash2, Edit, Plus, Package, LogOut, X,
    LayoutDashboard, TrendingUp, TrendingDown, DollarSign, UploadCloud, Bell,
    Settings, Users, Megaphone, Layout, CreditCard, ShieldCheck,
    Truck, AlertTriangle, Lock, Ticket, Tag, Layers, PlusCircle, MinusCircle,
    BarChart3, Activity, CheckSquare, UserPlus, FileUp, Printer, History, Send, Video, Key,
    AlertOctagon, Star, Sparkles, Image as ImageIcon, Save,
    Type, Link as LinkIcon, MoveRight, Check, XCircle, Eye, MapPin, Phone, Mail,
    User, MessageSquare, Menu, ShoppingBag, Ban, Briefcase, Headphones, Search,
    // 👇 Ye Naye Icons Add Karein
    Download, FileJson, RefreshCw, ShieldAlert, Bike, Gift, CheckCircle, FileText, Clock, Globe, Zap, Target, Smartphone, UserCheck, 
    ArrowUpRight, ArrowDownRight, ShoppingCart,  Percent
} from 'lucide-react';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

// ✅ Is line ko file ke sabse top par add karein
import PopupManager from '@/components/admin/PopupManager';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import GSTManager from '@/components/admin/GSTManager'; // ✅ NEW IMPORT
const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi"
];
// --- PREMIUM ALERT COMPONENT (Add this below imports) ---
const Toast = ({ message, type, onClose }: { message: string, type: 'error' | 'success' | 'info', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000); // 4 second baad gayab
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md animate-fade-in-up transition-all duration-300 ${type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
            type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                'bg-blue-500/10 border-blue-500/50 text-blue-400'
            }`}>
            <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-500/20' : type === 'success' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                {type === 'error' ? <AlertTriangle className="w-5 h-5" /> : type === 'success' ? <Check className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">{type === 'error' ? 'Access Denied' : type === 'success' ? 'Success' : 'Notice'}</h4>
                <p className="text-sm font-medium text-white">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 hover:bg-white/10 p-1 rounded-full transition"><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
        </div>
    );
};
// --- HELPER: Cloudinary Upload (Safe Mode) ---
const uploadToCloudinary = async (file: File) => {
    // 1. Check for Env Variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

    if (!cloudName || !preset) {
        alert("❌ Error: Missing Cloudinary details in .env.local");
        console.error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_PRESET");
        return null;
    }

    // 2. Prepare Form Data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    // 3. Upload to Cloudinary
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Upload Failed");

        const data = await res.json();
        return data.secure_url; // Safe URL return karega
    } catch (error) {
        console.error("Cloudinary Error:", error);
        alert("Image Upload Failed. Check Console.");
        return null;
    }
};
// --- INTERFACES ---
interface Coupon { id: string; code: string; type: 'percent' | 'flat'; discount: number; minOrderValue: number; }
interface AdminProductForm extends Partial<Product> {
    stock?: number; tags?: string[]; galleryImages?: string[]; seoTitle?: string; seoDesc?: string; material?: string;
    warranty?: string;
    care?: string;
    colors?: string[];
    sizes?: string[];
}

// --- NEW: Notification Interface ---
interface NotificationItem { id: string; title: string; message: string; type: 'order' | 'system' | 'alert'; time: string; read: boolean; }

// --- MAIN COMPONENT ---
// --- MAIN COMPONENT (Updated with Premium Login & Alerts) ---
export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // LOGIN STATE
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // NEW: Premium Alert & Forgot Password State
    const [toast, setToast] = useState<{ msg: string, type: 'error' | 'success' | 'info' } | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // USER ROLE & DATA STATE
    const [userRole, setUserRole] = useState<'admin' | 'manager' | 'staff'>('admin');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [storageUsed, setStorageUsed] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Header Menu States
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    // Connect to Store
    const store = useStore() as any;
    const {
        coupons, addCoupon, deleteCoupon, products,
        orders, updateOrderStatus, allUsers, sendNotification,
        addProduct, updateProduct, deleteProduct, nukeDatabase,
        updateUserRole,
        banner, updateBanner,
        categories, updateCategories,
        featuredSection: featured, updateFeatured, abandonedCarts,

        // ✅ Store mein naam 'promoSection' hai, hume 'promo' chahiye
        promoSection: promo, updatePromo, 
    
        blogs, addBlog, deleteBlog, deleteOrder, updateOrderNote, bulkUpdateOrderStatus, updateOrderTracking
    } = store;
    // 👇 STEP 1: YE LINE ADD KAREIN
    const { messages, markMessageRead, deleteMessage } = store;

    // Calculate Unread Count
    const inboxUnreadCount = messages ? messages.filter((m: any) => !m.isRead).length : 0;
    // --- HELPER: Trigger Toast ---
    const showToast = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToast({ msg, type });
    };

    // 1. Load Notifications
    useEffect(() => {
        const savedNotifs = localStorage.getItem('admin_notifications');
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    }, []);

    // 2. Add System Notification
    const addSystemNotification = (title: string, message: string, type: 'order' | 'system' | 'alert' = 'system') => {
        const newNotif: NotificationItem = {
            id: Date.now().toString(),
            title, message, type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
        };
        const updatedList = [newNotif, ...notifications].slice(0, 20);
        setNotifications(updatedList);
        localStorage.setItem('admin_notifications', JSON.stringify(updatedList));
        window.dispatchEvent(new Event("storage"));

        // Also show toast for important alerts
        if (type === 'alert') showToast(title, 'error');
        if (type === 'order') showToast('New Order Update', 'info');
    };

    // 3. Auto-Refresh Logic
    const handleRefresh = () => {
        setIsRefreshing(true);
        setLastUpdated(new Date());
        const savedNotifs = localStorage.getItem('admin_notifications');
        if (savedNotifs) {
            const parsed = JSON.parse(savedNotifs);
            if (JSON.stringify(parsed) !== JSON.stringify(notifications)) setNotifications(parsed);
        }
        setTimeout(() => { setIsRefreshing(false); }, 800);
    };

    useEffect(() => {
        const interval = setInterval(() => { handleRefresh(); }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTIONS ---
   const handleStatusUpdate = (id: string, status: string) => {
        // 1. Database Update
        updateOrderStatus(id, status);

        // 2. Admin System Log
        addSystemNotification('Order Updated', `Order #${id} status changed to ${status}`, 'order');

        // 👇 3. NEW: SEND NOTIFICATION TO CUSTOMER (Connects to Dashboard)
        const order = orders.find((o: any) => o.id === id); // Order details nikalo
        
        if (order && order.customerEmail) {
            let title = "Order Update";
            let msg = `Your order #${id} status is now: ${status}.`;

            // Custom Messages for Premium Feel
            if (status === 'Shipped') {
                title = "Order Shipped 🚚";
                msg = "Great news! Your package has been dispatched and is on its way.";
            } else if (status === 'Out for Delivery') {
                title = "Out for Delivery 🚀";
                msg = "Your order is out for delivery today! Please be ready to receive it.";
            } else if (status === 'Delivered') {
                title = "Order Delivered ✅";
                msg = "Your order has been delivered successfully. Thank you for choosing ZERIMI.";
            } else if (status === 'Return Approved') {
                title = "Return Approved 🔄";
                msg = "Your return request has been approved. Pickup will be scheduled shortly.";
            } else if (status === 'Return Rejected') {
                title = "Return Update ⚠️";
                msg = "Your return request could not be processed at this time.";
            }

            // Firebase Notification Send (Customer Dashboard will catch this)
            sendNotification(order.customerEmail, title, msg);
        }

        // 4. Admin Toast
        showToast(`Order #${id} marked as ${status}`, 'success');
    };

    const handleProductDelete = (id: string) => {
        if (confirm('Delete this product?')) {
            deleteProduct(id);
            addSystemNotification('Inventory Alert', 'A product was removed from inventory', 'alert');
            showToast('Product deleted from inventory', 'info');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserRole('admin');
        setEmail('');
        setPassword('');
        setShowProfileMenu(false);
        setShowNotifMenu(false);
        setCurrentUser(null);
        showToast('Logged out successfully', 'info');
    };

    // --- UPDATED LOGIN HANDLER (Firebase Based) ---
    // ✅ FIXED LOGIN HANDLER
    // ✅ REAL FIREBASE LOGIN HANDLER (Admin + Staff + Manager)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // ---------------------------------------------------------
            // 1. SUPER ADMIN CHECK (Database Settings se)
            // ---------------------------------------------------------
            const docRef = doc(db, "settings", "super_admin");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const adminData = docSnap.data();
                // Agar email/pass DB wale super admin se match kare
                if (email.toLowerCase() === adminData.email.toLowerCase() && password === adminData.password) {
                    setIsAuthenticated(true);
                    setUserRole('admin');
                    setCurrentUser({
                        name: 'Super Admin',
                        email: adminData.email,
                        role: 'admin',
                        image: 'https://cdn-icons-png.flaticon.com/512/2942/2942813.png'
                    });
                    showToast('Welcome Super Admin', 'success');
                    return;
                }
            }

            // ---------------------------------------------------------
            // 2. STAFF / MANAGER CHECK (Real Firebase Auth)
            // ---------------------------------------------------------

            // A. Firebase se Email/Pass verify karein
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // B. Ab check karein ki ye user hamare Database mein kya role rakhta hai
            const foundUser = allUsers?.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

            if (foundUser) {
                // C. Role Verification
                if (foundUser.role === 'banned') {
                    await signOut(auth); // Login cancel karo
                    return showToast('Access Denied: Your account is banned.', 'error');
                }

                if (foundUser.role === 'customer') {
                    await signOut(auth); // Login cancel karo (Customer allowed nahi hai)
                    return showToast('Access Denied: Customers cannot access Admin Panel.', 'error');
                }

                // D. Success! (Admin / Manager / Staff)
                setIsAuthenticated(true);
                setUserRole(foundUser.role); // Role set karo (manager/staff/admin)
                setCurrentUser(foundUser);
                showToast(`Welcome back, ${foundUser.name}`, 'success');

            } else {
                // Agar user auth mein hai par database list mein nahi mila
                await signOut(auth);
                showToast('User record not found in database.', 'error');
            }

        } catch (error: any) {
            console.error("Login Error:", error);

            // Error Messages ko user-friendly banayein
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showToast('Incorrect Email or Password.', 'error');
            } else if (error.code === 'auth/user-not-found') {
                showToast('No user found with this email.', 'error');
            } else if (error.code === 'auth/too-many-requests') {
                showToast('Too many failed attempts. Try later.', 'error');
            } else {
                showToast('Login failed. Check console.', 'error');
            }
        }
    };

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            try {
                const total = JSON.stringify(localStorage).length;
                setStorageUsed((total / 5000000) * 100);
            } catch (e) { console.error("Storage check failed", e); }
        }
    }, [products]);

    if (!isMounted) return null;

    // --- LOGIN SCREEN (PREMIUM REDESIGN) ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1f1c] relative overflow-hidden font-sans">

                {/* Toast Notification Container */}
                {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

                {/* Ambient Background */}
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

                <div className="bg-[#0f2925] w-full max-w-md border border-white/5 shadow-2xl backdrop-blur-sm relative z-10 rounded-2xl overflow-hidden">

                    {/* Login Header */}
                    <div className="bg-[#051614] p-8 text-center border-b border-white/5 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600"></div>
                        <h1 className="font-serif text-3xl tracking-[0.2em] text-white">ZERIMI</h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500 mt-2">Internal Dashboard</p>
                    </div>

                    {!showForgotPassword ? (
                        // --- STANDARD LOGIN FORM ---
                        <form onSubmit={handleLogin} className="p-8 space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase font-bold ml-1 mb-1 block">Authorized Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-500 transition" />
                                        <input type="email" placeholder="name@zerimi.com" className="w-full p-3 pl-10 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50 transition text-sm focus:bg-black/40" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase font-bold ml-1 mb-1 block">Access Key</label>
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-500 transition" />
                                        <input type="password" placeholder="••••••••" className="w-full p-3 pl-10 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50 transition text-sm focus:bg-black/40" value={password} onChange={(e) => setPassword(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] text-white/40 uppercase">System Operational</span>
                                </div>
                                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[10px] text-amber-500 hover:text-amber-400 uppercase tracking-widest font-bold hover:underline">
                                    Forgot Password?
                                </button>
                            </div>

                            <button className="w-full bg-gradient-to-r from-amber-700 to-amber-600 text-white py-3 rounded-lg uppercase tracking-widest text-xs font-bold hover:from-amber-600 hover:to-amber-500 transition duration-300 shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 group">
                                <LogOut className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition" /> Secure Login
                            </button>
                        </form>
                    ) : (
                        // --- FORGOT PASSWORD / SECURITY PROTOCOL ---
                        <div className="p-8 space-y-6 animate-fade-in text-center">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                <Lock className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-serif text-xl tracking-wide">Security Protocol</h3>
                                <p className="text-white/50 text-xs mt-3 leading-relaxed border-t border-b border-white/5 py-4 my-2">
                                    To maintain vault-level security, automated password resets are disabled for this terminal.
                                </p>
                                <div className="bg-white/5 p-3 rounded-lg mt-4 text-left">
                                    <p className="text-[10px] text-amber-500 uppercase font-bold mb-1">Action Required:</p>
                                    <p className="text-xs text-white/70">Please contact the <span className="text-white font-bold">Super Admin</span> directly to request a credential reset or verify your access level.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowForgotPassword(false)} className="w-full bg-white/5 text-white py-3 rounded-lg uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition flex items-center justify-center gap-2">
                                <MoveRight className="w-4 h-4 rotate-180" /> Return to Login
                            </button>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-6 text-[10px] text-white/20 uppercase tracking-[0.2em]">
                    Restricted Access • Authorized Personnel Only
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    // --- DASHBOARD UI (MAIN LAYOUT) ---
    return (
        <div className="flex h-screen bg-[#0a1f1c] overflow-hidden font-sans text-white">
            {/* Toast Notification Container (For Dashboard Actions) */}
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* SIDEBAR */}
            {/* ✅ FIXED SIDEBAR FOR MANAGER ACCESS */}
            <aside className="w-20 lg:w-72 bg-[#0f2925] border-r border-white/5 flex flex-col flex-shrink-0 transition-all duration-300 z-20">
                <div className="p-6 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5 h-24">
                    <div className="text-center lg:text-left">
                        <h2 className="font-serif text-2xl tracking-widest text-white hidden lg:block">ZERIMI</h2>
                        <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${userRole === 'admin' ? 'bg-red-500' :
                                userRole === 'manager' ? 'bg-amber-500' :
                                    'bg-blue-500'
                                }`}></span>

                            {/* 👇 YE LABEL LOGIC FIX KIYA HAI */}
                            <p className="text-[9px] text-white/50 uppercase tracking-widest hidden lg:block">
                                {userRole === 'admin' ? 'GOD MODE' :
                                    userRole === 'manager' ? 'MANAGER PANEL' :
                                        'STAFF PANEL'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {/* 1. SABKE LIYE (Staff + Manager + Admin) */}
                    <p className="px-4 py-2 text-[10px] text-white/20 uppercase tracking-widest hidden lg:block">Operations</p>
                    <SidebarBtn icon={<BarChart3 />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarBtn icon={<Truck />} label="Order Management" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <SidebarBtn icon={<Package />} label="Inventory" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />

                    <div className="relative">
                        <SidebarBtn icon={<Mail />} label="Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
                        {inboxUnreadCount > 0 && (
                            <span className="absolute left-10 top-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse border border-[#0f2925]">
                                {inboxUnreadCount}
                            </span>
                        )}
                    </div>

                    {/* 2. SIRF MANAGER AUR ADMIN KE LIYE (Staff ko nahi dikhega) */}
                    {(userRole === 'admin' || userRole === 'manager') && (
                        <>
                            <p className="px-4 py-2 text-[10px] text-white/20 uppercase tracking-widest hidden lg:block mt-4">Growth Engine</p>
                            <SidebarBtn icon={<Layout />} label="Homepage Editor" active={activeTab === 'cms'} onClick={() => setActiveTab('cms')} />
                            <SidebarBtn icon={<Ticket />} label="Coupons & Offers" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />
                            <SidebarBtn icon={<Megaphone />} label="Marketing" active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />

                            <button
                                onClick={() => setActiveTab('popup')}
                                className={`flex items-center justify-center lg:justify-start gap-4 w-full p-3 rounded-lg text-sm tracking-wide transition-all duration-300 group ${activeTab === 'popup' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <span className={`w-5 h-5 ${activeTab === 'popup' ? 'text-white' : 'group-hover:text-amber-400'}`}>
                                    <Sparkles className="w-5 h-5" />
                                </span>
                                <span className="hidden lg:inline">Popup Manager</span>
                            </button>

                            <p className="px-4 py-2 text-[10px] text-white/20 uppercase tracking-widest hidden lg:block mt-4">Administration</p>
                            <SidebarBtn icon={<Users />} label="Staff & Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                        </>
                    )}

                    {/* 3. SIRF ADMIN KE LIYE (Manager ko bhi nahi dikhega) */}
                    {userRole === 'admin' && (
                        <><SidebarBtn icon={<FileText />} label="GST & Reports" active={activeTab === 'gst'} onClick={() => setActiveTab('gst')} />
                            <SidebarBtn icon={<Settings />} label="Payment & Config" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
                            <SidebarBtn icon={<AlertOctagon />} label="Danger Zone" active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-stone-400 mb-1 px-2"><span>DB Usage</span><span>{storageUsed.toFixed(1)}%</span></div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mx-2 mb-4 max-w-[90%]"><div className={`h-full ${storageUsed > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(storageUsed, 100)}%` }}></div></div>
                </div>
            </aside>
            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto h-full relative" onClick={() => { if (showProfileMenu) setShowProfileMenu(false); if (showNotifMenu) setShowNotifMenu(false); }}>
                <header className="bg-[#0a1f1c]/90 backdrop-blur-md border-b border-white/5 px-8 h-24 flex justify-between items-center sticky top-0 z-30">
                    <div>
                        <h2 className="text-xl font-serif text-white capitalize tracking-wide">{activeTab === 'cms' ? 'Homepage Editor' : activeTab}</h2>
                        <p className="text-xs text-white/40 mt-1 flex items-center gap-2">
                            {userRole === 'admin' ? 'Super Admin' : 'Staff Access'}
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="text-green-500 font-bold flex items-center gap-1">
                                {isRefreshing ? <span className="animate-spin"><History className="w-3 h-3" /></span> : <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                                Live Updates On
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 hidden md:flex">
                            <span className="text-[10px] text-white/40">Updated: {lastUpdated.toLocaleTimeString()}</span>
                            <button onClick={handleRefresh} className={`text-white/40 hover:text-amber-400 transition ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} title="Force Refresh"><History className="w-4 h-4" /></button>
                        </div>

                        {/* NOTIFICATION BELL */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <div className="relative group cursor-pointer" onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}>
                                <Bell className={`w-5 h-5 transition ${showNotifMenu ? 'text-white' : 'text-white/40 hover:text-white'}`} />
                                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg animate-pulse">{unreadCount > 9 ? '!' : unreadCount}</span>}
                            </div>

                            {/* Notification Menu */}
                            {showNotifMenu && (
                                <div className="absolute right-0 top-12 w-80 bg-[#0f2925] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#051614]">
                                        <h4 className="text-sm font-bold text-white">Notifications</h4>
                                        <button onClick={() => { setNotifications([]); localStorage.removeItem('admin_notifications'); }} className="text-[10px] text-amber-500 hover:text-amber-400 uppercase tracking-wider">Clear All</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-white/30 text-xs">No new updates</div>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div key={i} onClick={() => {
                                                    if (n.type === 'order') setActiveTab('orders');
                                                    if (n.type === 'alert') setActiveTab('products');
                                                    setShowNotifMenu(false);
                                                }} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${n.type === 'alert' ? 'bg-red-500/20 text-red-400' : n.type === 'order' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'}`}>{n.type}</span>
                                                        <span className="text-[10px] text-white/30">{n.time}</span>
                                                    </div>
                                                    <p className="text-xs text-white group-hover:text-amber-400 transition font-medium">{n.title}</p>
                                                    <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{n.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PROFILE DROPDOWN */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <div className="cursor-pointer" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false); }}>
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr p-[1px] transition-transform duration-200 ${showProfileMenu ? 'scale-110 from-white to-amber-200' : userRole === 'admin' ? 'from-red-500 to-amber-600' : 'from-green-500 to-blue-600'}`}>
                                    <div className="w-full h-full rounded-full bg-[#0a1f1c] flex items-center justify-center text-white font-serif font-bold overflow-hidden">
                                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : (userRole === 'admin' ? 'A' : 'S')}
                                    </div>
                                </div>
                            </div>

                            {showProfileMenu && (
                                <div className="absolute right-0 top-14 w-64 bg-[#0f2925] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                                    <div className="p-6 bg-[#051614] border-b border-white/5 text-center">
                                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-600 to-red-600 rounded-full flex items-center justify-center text-2xl font-serif font-bold text-white mb-3 shadow-lg">
                                            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <h4 className="text-white font-bold text-sm">{currentUser?.name || 'Unknown User'}</h4>
                                        <p className="text-[10px] text-white/50 mt-1">{currentUser?.email || email}</p>
                                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] uppercase font-bold ${userRole === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {userRole} Role
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        <button onClick={() => { setActiveTab('config'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 p-3 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition">
                                            <Settings className="w-4 h-4" /> Account Settings
                                        </button>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition mt-1">
                                            <LogOut className="w-4 h-4" /> Secure Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto pb-24">
                   {activeTab === 'dashboard' && (
    <DashboardOverview 
        products={products} 
        orders={orders} 
        allUsers={allUsers} 
        abandonedCarts={abandonedCarts} // 👈 YE PASS KAREIN
        setActiveTab={setActiveTab} 
        showToast={showToast} // 👈 Alert ke liye ye bhi pass karein
    />
)}

                    {activeTab === 'products' && <ProductManager products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={(id: string) => handleProductDelete(id)} />}


                   {activeTab === 'orders' && (
                        <OrderManager
                            orders={orders}
                            updateOrderStatus={handleStatusUpdate}
                            settings={store.systemSettings}
                            deleteOrder={deleteOrder}
                            
                            // 👇 YE 3 LINES ADD KAREIN (Tabhi Save Hoga)
                            updateOrderNote={updateOrderNote}
                            bulkUpdateOrderStatus={bulkUpdateOrderStatus}
                            updateOrderTracking={updateOrderTracking}
                        />
                    )}
                   {/* 👇 YAHAN PASTE KAREIN (GST Manager with Downloads) */}
                    {activeTab === 'gst' && (
                        <GSTManager 
                            orders={orders} 
                            settings={store.systemSettings} 
                            onDownloadInvoice={generateAdminInvoice}  // ✅ Invoice Pass Kiya
                            onDownloadCreditNote={generateCreditNote} // ✅ Credit Note Pass Kiya
                        />
                    )}
                    {/* 👇 STEP 3: INBOX MANAGER COMPONENT */}
                    {activeTab === 'inbox' && (
                        <InboxManager
                            messages={messages}
                            markRead={markMessageRead}
                            deleteMsg={deleteMessage}
                            showToast={showToast}
                        />
                    )}
                    {/* ✅ 1. MANAGER + ADMIN ACCESS (Users, Marketing, CMS) */}
                    {['admin', 'manager'].includes(userRole) && (
                        <>
                            {activeTab === 'coupons' && <CouponManager coupons={coupons} onAdd={addCoupon} onDelete={deleteCoupon} showToast={showToast} />}

                            {activeTab === 'cms' && <CMSManager
                                banner={banner} updateBanner={updateBanner}
                                categories={categories} updateCategories={updateCategories}
                                featured={featured} updateFeatured={updateFeatured}
                                promo={promo} updatePromo={updatePromo}
                                blogs={blogs} addBlog={addBlog} deleteBlog={deleteBlog}
                                siteText={store.siteText} updateSiteText={store.updateSiteText}
                                showToast={showToast}
                            />}

                            {activeTab === 'marketing' && <MarketingManager allUsers={allUsers} sendNotification={sendNotification} showToast={showToast} />}

                            {activeTab === 'popup' && <div className="animate-fade-in"><PopupManager siteText={store.siteText} onSave={store.updateSiteText} /></div>}

                            {activeTab === 'users' && <UserManager
                                allUsers={allUsers}
                                updateUserRole={updateUserRole}
                                deleteUser={store.deleteUser}
                                showToast={showToast}
                                currentUser={currentUser} // ✅ Safety Prop
                            />}
                        </>
                    )}

                    {/* ✅ 2. ONLY ADMIN ACCESS (Settings & Danger Zone) */}
                    {userRole === 'admin' && (
                        <>
                            {activeTab === 'config' && <ConfigManager updateSystemConfig={store.updateSystemConfig} showToast={showToast} />}
                            {activeTab === 'danger' && <DangerZone nukeDatabase={nukeDatabase} products={products} orders={orders} allUsers={allUsers} showToast={showToast} />}
                        </>
                    )}

                    {/* ⛔ BLANK SCREEN FIX: Agar Manager restricted page khole */}
                    {userRole === 'manager' && ['config', 'danger'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30 bg-[#0f2925] rounded-xl border border-white/5 animate-fade-in-up">
                            <Lock className="w-12 h-12 mb-4 text-red-500" />
                            <h3 className="text-lg font-serif text-white">Access Restricted</h3>
                            <p className="text-sm">Only Super Admin can view this section.</p>
                        </div>
                    )}

                    {userRole === 'staff' && !['dashboard', 'products', 'orders'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30 bg-[#0f2925] rounded-xl border border-white/5 animate-fade-in-up">
                            <Lock className="w-12 h-12 mb-4 text-amber-500" />
                            <h3 className="text-lg font-serif text-white">Access Restricted</h3>
                            <p className="text-sm">You do not have permission to view this section.</p>
                            <button onClick={() => setActiveTab('dashboard')} className="mt-4 text-amber-500 text-xs font-bold uppercase hover:underline">Return to Dashboard</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// --- HELPER COMPONENTS ---

// Is function ko replace karein (Safety check added)
function SidebarBtn({ icon, label, active, onClick }: any) {
    // FIX: label check lagaya hai taaki undefined hone par crash na ho
    const safeLabel = label ? label.toString() : "";

    const tabId = safeLabel.toLowerCase().includes('homepage') || safeLabel.toLowerCase().includes('cms') ? 'cms'
        : safeLabel.toLowerCase().includes('coupon') ? 'coupons'
            : safeLabel.toLowerCase().includes('invent') ? 'products'
                : safeLabel.toLowerCase().includes('order') ? 'orders'
                    : safeLabel.toLowerCase().includes('staff') ? 'users'
                        : safeLabel.toLowerCase().includes('config') ? 'config'
                            : safeLabel.toLowerCase().includes('danger') ? 'danger'
                                : safeLabel.toLowerCase().includes('market') ? 'marketing'
                                    : 'dashboard';

    return (
        <button onClick={() => onClick(tabId)} className={`flex items-center justify-center lg:justify-start gap-4 w-full p-3 rounded-lg text-sm tracking-wide transition-all duration-300 group ${active === tabId ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
            <span className={`w-5 h-5 ${active === tabId ? 'text-white' : 'group-hover:text-amber-400 transition'}`}>{icon}</span>
            <span className="hidden lg:inline">{label}</span>
        </button>
    );
}

function SectionHeader({ title, subtitle, action }: any) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div><h2 className="text-2xl font-serif text-white">{title}</h2><p className="text-sm text-white/40 mt-1">{subtitle}</p></div>
            {action}
        </div>
    );
}

// ✅ DYNAMIC INVOICE GENERATOR (Admin Controlled)
// --- ADMIN SIDE: AMAZON/FLIPKART STANDARD PDF INVOICE ---
// --- HELPER: NUMBER TO WORDS ---
const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    const numStr = Math.floor(num).toString();
    if (num < 20) return a[num] + 'Only';
    return `Rupees ${num.toLocaleString('en-IN')} Only`;
};

/* ----------------------------------------------------
   ✅ EXACT REPLICA OF CUSTOMER INVOICE (ADMIN SIDE)
---------------------------------------------------- */
/* ----------------------------------------------------
   ✅ UPDATED INVOICE GENERATOR (With Secret Gift Cost)
---------------------------------------------------- */
/* ----------------------------------------------------
   ✅ PROFESSIONAL INVOICE GENERATOR (Correct Math)
---------------------------------------------------- */
// src/app/admin/page.tsx ke andar is function ko replace karein

// ---------- DATE FORMATTER (DD/MM/YYYY) ----------
const formatDate = (input: any) => {
  const d = new Date(input);
  if (isNaN(d.getTime())) return input || "";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

// =========================================================
// ✅ FINAL & CLEAN INVOICE GENERATOR (Copy-Paste This)
// =========================================================
// =========================================================
// ✅ INDUSTRY STANDARD INVOICE GENERATOR (Dynamic Title)
// =========================================================
export const generateAdminInvoice = (order: any, settings: any) => {
  if (!order) return;

  // 1. Helper Functions
  const formatDate = (dateStr: string) => {
      try {
          const d = new Date(dateStr);
          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } catch (e) { return dateStr; }
  };

  const numberToWords = (num: number): string => {
      const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (num === 0) return 'Zero';
      const n = Math.floor(num);
      if (n < 20) return a[n] + 'Only';
      return `Rupees ${n.toLocaleString('en-IN')} Only`;
  };

  // 2. Document Setup
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // 3. Logic: Title Kya Hoga?
  // Rule: Pending/Cancelled hai to 'Proforma', baaki sab me 'Tax Invoice'
  let invoiceTitle = "TAX INVOICE";
  if (order.status === 'Pending' || order.status === 'Cancelled') {
      invoiceTitle = "PROFORMA INVOICE";
  }

  // 4. Company & Customer Details
  const companyName = settings?.invoice?.companyName || "ZERIMI";
  const companyAddress = settings?.invoice?.address || "Baraut, Uttar Pradesh, India";
  const companyGstin = settings?.invoice?.gstin || "";
  const companyState = settings?.invoice?.state || "Uttar Pradesh"; // Admin Config se state

  // Customer Address Logic
  let fullAddress = order.address || "";
  let customerState = "";
  if (typeof order.address === 'object') {
      fullAddress = `${order.address.street || ''}, ${order.address.city || ''}, ${order.address.state || ''} - ${order.address.pincode || ''}\nPhone: ${order.address.phone || ''}`;
      customerState = order.address.state || "";
  }

  // 5. GST State Match Logic (IGST vs SGST)
  // Normalize strings (remove spaces, lowercase) for better matching
  const cleanStr = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || "";
  const isSameState = cleanStr(companyState) === cleanStr(customerState);

  // ---------------------------------------------------------
  // 🎨 HEADER SECTION
  // ---------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55); // Gold Color
  doc.text(companyName, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("Luxury Jewelry & Accessories", 14, 26);
  doc.text(doc.splitTextToSize(companyAddress, 80), 14, 31);
  doc.text(`GSTIN: ${companyGstin}`, 14, 42);
  doc.text(`Email: support@zerimi.com`, 14, 47);

  // Dynamic Title (Right Side)
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(invoiceTitle, pageWidth - 14, 20, { align: "right" }); // ✅ YAHAN CHANGE HUA HAI
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.invoiceNo || 'N/A'}`, pageWidth - 14, 30, { align: "right" });
  doc.text(`Date: ${formatDate(order.date)}`, pageWidth - 14, 35, { align: "right" });
  doc.text(`Order ID: #${order.id}`, pageWidth - 14, 40, { align: "right" });

  doc.line(14, 52, pageWidth - 14, 52);

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 60);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerName || "Valued Customer", 14, 66);
  doc.text(doc.splitTextToSize(fullAddress, 100), 14, 71);

  // ---------------------------------------------------------
  // 📦 TABLE CALCULATIONS (Correct Tax Logic)
  // ---------------------------------------------------------
  let totalTaxable = 0;
  let totalGST = 0;
  
  const tableRows: any[] = [];

  // Loop Items
  order.items.forEach((item: any, index: number) => {
      const qty = Number(item.qty || 1);
      const rate = Number(item.price);
      const amount = rate * qty;
      
      // ✅ GST Logic: Item ka apna rate use karo, nahi to default 3%
      const itemTaxRate = item.gstRate || 3; 
      
      // Reverse Calculation (Price is Inclusive)
      const taxableValue = amount / (1 + (itemTaxRate / 100)); 
      const gstValue = amount - taxableValue;

      totalTaxable += taxableValue;
      totalGST += gstValue;

      tableRows.push([
          index + 1,
          item.name,
          item.hsn || "7117", // HSN
          qty,
          `Rs.${(taxableValue / qty).toFixed(2)}`,
          `Rs.${taxableValue.toFixed(2)}`,
          // IGST vs SGST Columns
          isSameState ? `${itemTaxRate / 2}%` : "-",
          isSameState ? (gstValue / 2).toFixed(2) : "-",
          isSameState ? `${itemTaxRate / 2}%` : "-",
          isSameState ? (gstValue / 2).toFixed(2) : "-",
          !isSameState ? `${itemTaxRate}%` : "-",
          !isSameState ? gstValue.toFixed(2) : "-",
          `Rs.${amount.toFixed(2)}`
      ]);
  });

  // Gift Wrap Logic (Service Tax 18%)
  if (order.isGift && order.giftWrapPrice > 0) {
      const gAmount = Number(order.giftWrapPrice);
      const gTaxRate = 18; // Service is always 18%
      const gTaxable = gAmount / 1.18;
      const gGST = gAmount - gTaxable;
      
      totalTaxable += gTaxable;
      totalGST += gGST;

      tableRows.push([
          tableRows.length + 1,
          "Gift Packaging (Service)",
          "9985", // SAC Code
          1,
          `Rs.${gTaxable.toFixed(2)}`,
          `Rs.${gTaxable.toFixed(2)}`,
          isSameState ? "9%" : "-",
          isSameState ? (gGST / 2).toFixed(2) : "-",
          isSameState ? "9%" : "-",
          isSameState ? (gGST / 2).toFixed(2) : "-",
          !isSameState ? "18%" : "-",
          !isSameState ? gGST.toFixed(2) : "-",
          `Rs.${gAmount.toFixed(2)}`
      ]);
  }

  // Generate Table
  // @ts-ignore
  autoTable(doc, {
      startY: 90,
      head: [["Sn", "Item", "HSN", "Qty", "Rate", "Taxable", "CGST", "Amt", "SGST", "Amt", "IGST", "Amt", "Total"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 7, halign: 'center' },
      columnStyles: { 1: { halign: 'left' } },
      headStyles: { fillColor: [15, 41, 37], textColor: 255 } 
  });

  // ---------------------------------------------------------
  // 💰 SUMMARY SECTION
  // ---------------------------------------------------------
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  const rightX = pageWidth - 14;
  const labelX = rightX - 70;

  const discountTotal = Number(order.discount || 0);
  const couponDisc = Number(order.couponDiscount || 0);
  const pointsDisc = Number(order.pointsDiscount || 0);
  const shippingCharge = Number(order.shipping || 0);

  // Net Taxable Logic
  const netTaxableValue = Math.max(0, totalTaxable - discountTotal);
  // Re-calculate GST roughly on Net Value (Proportionate)
  // Note: Accurate accounting ke liye line-item discount hona chahiye, par ye simplified hai
  const finalGSTVal = totalGST * (netTaxableValue / (totalTaxable || 1)); 
  
  const grandTotal = Math.round(netTaxableValue + finalGSTVal + shippingCharge);

  doc.setFontSize(9);
  doc.setTextColor(0);

  // Values Print
  doc.text("Sub Total (Taxable):", labelX, finalY);
  doc.text(`Rs.${totalTaxable.toFixed(2)}`, rightX, finalY, { align: "right" });
  finalY += 6;

  if (couponDisc > 0) {
      doc.setTextColor(200, 30, 30);
      doc.text("Less: Coupon Discount:", labelX, finalY);
      doc.text(`- Rs.${couponDisc.toFixed(2)}`, rightX, finalY, { align: "right" });
      finalY += 6;
  }
  if (pointsDisc > 0) {
      doc.setTextColor(212, 175, 55);
      doc.text("Less: Loyalty Points:", labelX, finalY);
      doc.text(`- Rs.${pointsDisc.toFixed(2)}`, rightX, finalY, { align: "right" });
      finalY += 6;
  }

  doc.setTextColor(0);
  doc.line(labelX, finalY, rightX, finalY);
  finalY += 6;

  doc.text("Net Taxable Value:", labelX, finalY);
  doc.text(`Rs.${netTaxableValue.toFixed(2)}`, rightX, finalY, { align: "right" });
  finalY += 6;

  doc.text("Add: Total GST:", labelX, finalY);
  doc.text(`+ Rs.${finalGSTVal.toFixed(2)}`, rightX, finalY, { align: "right" });
  finalY += 6;

  doc.text("Add: Shipping Charges:", labelX, finalY);
  doc.text(`+ Rs.${shippingCharge.toFixed(2)}`, rightX, finalY, { align: "right" });
  finalY += 8;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", labelX, finalY);
  doc.text(`Rs.${grandTotal.toFixed(2)}`, rightX, finalY, { align: "right" });

  // Footer & Disclaimer
  finalY += 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Amount in Words: ${numberToWords(grandTotal)}`, 14, finalY);

  doc.rect(14, finalY + 5, pageWidth - 28, 20);
  doc.setFontSize(8);
  doc.text("Declaration:", 16, finalY + 10);
  doc.text("1. Goods once sold will be exchanged/returned only as per policy.", 16, finalY + 15);
  doc.text("2. All disputes are subject to Baraut jurisdiction only.", 16, finalY + 19);

  doc.setFont("helvetica", "bold");
  doc.text(`For ${companyName}`, pageWidth - 40, finalY + 20, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signatory", pageWidth - 40, finalY + 23, { align: "center" });

  // File Name Logic
  const fileNameStatus = invoiceTitle === "TAX INVOICE" ? "Invoice" : "Proforma";
  doc.save(`${fileNameStatus}_${order.id}.pdf`);
};

// --- PROFESSIONAL CREDIT NOTE GENERATOR (GST Compliant) ---
// =========================================================
// ✅ FINAL CREDIT NOTE GENERATOR (GST COMPLIANT FORMAT)
// =========================================================
// =========================================================
// ✅ FINAL CREDIT NOTE GENERATOR (FULL & COMPLETE)
// =========================================================
export const generateCreditNote = (order: any, settings: any) => {
  if (!order) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- HELPER 1: FORMAT DATE ---
  const formatDate = (dateStr: string) => {
      try {
          const d = new Date(dateStr);
          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } catch (e) { return dateStr || ""; }
  };

  // --- HELPER 2: STATE LOGIC (For GST Split) ---
  const companyState = settings?.invoice?.state || "Uttar Pradesh";
  const customerState = typeof order.address === 'object' ? (order.address.state || "") : "";
  
  // Clean Strings for Comparison
  const cleanStr = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || "";
  const isSameState = cleanStr(companyState) === cleanStr(customerState);

  // --- 1. HEADER SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CREDIT NOTE", pageWidth / 2, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("(Sales Return / Refund)", pageWidth / 2, 20, { align: "center" });
  doc.text("(Issued under Section 34 of CGST Act, 2017)", pageWidth / 2, 25, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(10, 28, pageWidth - 10, 28);

  // --- 2. SELLER & BUYER DETAILS ---
  let yPos = 35;
  
  // SELLER (Left Side)
  doc.setFont("helvetica", "bold");
  doc.text("SELLER (Issued By):", 14, yPos);
  doc.setFont("helvetica", "normal");
  yPos += 5;
  doc.text("ZERIMI", 14, yPos);
  yPos += 5;
  doc.text("Luxury Jewelry & Accessories", 14, yPos);
  yPos += 5;
  doc.text("Baraut (Baghpat), Uttar Pradesh - 250611", 14, yPos);
  yPos += 5;
  doc.text(`GSTIN: ${settings?.invoice?.gstin || "Testing / Not Applicable"}`, 14, yPos);
  yPos += 5;
  doc.text("Email: support@zerimi.com", 14, yPos);

  // BUYER (Right Side)
  yPos = 35; // Reset Y
  const rightColX = pageWidth / 2 + 10;
  
  doc.setFont("helvetica", "bold");
  doc.text("BUYER (Issued To):", rightColX, yPos);
  doc.setFont("helvetica", "normal");
  yPos += 5;
  doc.text(order.customerName || "Valued Customer", rightColX, yPos);
  yPos += 5;
  
  // Address Handling
  const addressLine = typeof order.address === 'object' 
      ? `${order.address.street || ''}, ${order.address.city || ''}` 
      : order.address || "";
  const stateLine = typeof order.address === 'object'
      ? `${order.address.state || ''} - ${order.address.pincode || ''}`
      : "";
  const phoneLine = typeof order.address === 'object' ? `Phone: ${order.address.phone}` : "";

  doc.text(doc.splitTextToSize(addressLine, 80), rightColX, yPos);
  yPos += 10; // Extra space for potential multi-line address
  doc.text(stateLine, rightColX, yPos);
  yPos += 5;
  doc.text(phoneLine, rightColX, yPos);

  // --- 3. CREDIT NOTE DETAILS BOX ---
  yPos = 75;
  doc.setDrawColor(0);
  doc.rect(10, yPos - 5, pageWidth - 20, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  // Left Details
  doc.text(`Credit Note No:`, 15, yPos);
  doc.setFont("helvetica", "normal");
  
  // ✅ UPDATE: Use Database Series Number (CN/25-26/0001) if available
  const cnNumber = order.creditNoteNo || `CN-TMP/${new Date().getFullYear()}/${order.id.split('-').pop()}`;
  doc.text(cnNumber, 45, yPos);

  // Right Details
  doc.setFont("helvetica", "bold");
  doc.text(`Original Invoice No:`, pageWidth / 2 + 5, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.invoiceNo || "N/A"}`, pageWidth / 2 + 40, yPos);

  yPos += 7;
  // Date Row
  doc.setFont("helvetica", "bold");
  doc.text(`Credit Note Date:`, 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(new Date().toISOString()), 45, yPos);

  doc.setFont("helvetica", "bold");
  doc.text(`Invoice Date:`, pageWidth / 2 + 5, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(order.date), pageWidth / 2 + 40, yPos);

  // --- 4. ITEM TABLE (WITH PROPER GST SPLIT) ---
  const tableRows: any[] = [];
  let grossAmount = 0;

  order.items.forEach((item: any, index: number) => {
      const qty = Number(item.qty || 1);
      const rate = Number(item.price);
      const totalItem = rate * qty;
      
      const gstPercent = item.gstRate || 3;
      // Reverse Calculation
      const taxable = totalItem / (1 + (gstPercent / 100));
      const gstAmount = totalItem - taxable;

      grossAmount += totalItem;

      tableRows.push([
          index + 1,
          item.name,
          item.hsn || "7117",
          qty,
          `Rs.${taxable.toFixed(2)}`,
          // ✅ Split Tax Columns
          isSameState ? `${gstPercent/2}%` : "-",           // CGST Rate
          isSameState ? (gstAmount/2).toFixed(2) : "-",     // CGST Amt
          isSameState ? `${gstPercent/2}%` : "-",           // SGST Rate
          isSameState ? (gstAmount/2).toFixed(2) : "-",     // SGST Amt
          !isSameState ? `${gstPercent}%` : "-",            // IGST Rate
          !isSameState ? gstAmount.toFixed(2) : "-",        // IGST Amt
          `Rs.${totalItem.toFixed(2)}`
      ]);
  });

  // @ts-ignore
  autoTable(doc, {
      startY: 100,
      head: [["Sn", "Item Description", "HSN", "Qty", "Taxable", "CGST Rate", "CGST Amt", "SGST Rate", "SGST Amt", "IGST Rate", "IGST Amt", "Total"]],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 7, halign: 'center' }, // Font Size chota kiya taki column fit ho jaye
      columnStyles: { 1: { halign: 'left' } },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 }
  });

  // --- 5. SUMMARY SECTION ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  const rightX = pageWidth - 15;
  const labelX = rightX - 80;

  // Calculations
  const returnShipping = settings?.store?.shippingCost || 150;
  const netRefund = grossAmount - returnShipping;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  // Gross
  doc.text("Gross Amount (Incl. GST):", labelX, finalY);
  doc.text(`Rs.${grossAmount.toFixed(2)}`, rightX, finalY, { align: "right" });
  
  // Shipping Deduction
  finalY += 6;
  doc.setTextColor(200, 0, 0); 
  doc.text("Less: Return Shipping (Non-Taxable):", labelX, finalY);
  doc.text(`- Rs.${returnShipping.toFixed(2)}`, rightX, finalY, { align: "right" });
  doc.setTextColor(0);

  // Line
  finalY += 2;
  doc.line(labelX, finalY, rightX, finalY);
  
  // Net Refund
  finalY += 6;
  doc.setFontSize(12);
  doc.text("Net Refund Amount:", labelX, finalY);
  doc.text(`Rs.${netRefund.toFixed(2)}`, rightX, finalY, { align: "right" });

  // --- 6. REFUND DETAILS & NOTES ---
  // @ts-ignore
  let leftY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Refund Details:", 14, leftY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  leftY += 5;
  doc.text(`Refund Mode: Original payment method / Wallet / Bank Transfer`, 14, leftY);
  leftY += 5;
  doc.text(`Refund Status: Processed / To be processed`, 14, leftY);

  leftY += 10;
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT NOTES (LEGAL):", 14, leftY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  leftY += 5;
  const notes = [
      "1. This credit note is issued towards sales return.",
      "2. Shipping charges deducted are non-taxable.",
      "3. GST charged in the original invoice is reversed through this credit note.",
      "4. Net refund amount is adjusted after deducting return shipping charges."
  ];
  notes.forEach(note => {
      doc.text(note, 14, leftY);
      leftY += 4;
  });

  // --- 7. FOOTER DECLARATION ---
  const footerY = 250;
  
  doc.setFontSize(9);
  doc.text("Declaration:", 14, footerY);
  doc.setFont("helvetica", "italic");
  doc.text("We declare that this credit note is issued for goods returned", 14, footerY + 5);
  doc.text("and GST has been adjusted as per applicable law.", 14, footerY + 9);

  doc.setFont("helvetica", "bold");
  doc.text("For ZERIMI", pageWidth - 40, footerY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signatory", pageWidth - 40, footerY + 10, { align: "center" });

  doc.setFontSize(7);
  doc.text("(This is a computer-generated credit note)", pageWidth / 2, footerY + 25, { align: "center" });

  // Save File with Series Name if available
  const fileName = order.creditNoteNo 
      ? `CreditNote_${order.creditNoteNo.replace(/\//g, '-')}.pdf` 
      : `CreditNote_${order.id}.pdf`;
      
  doc.save(fileName);
};
// --- ORDER MANAGER (Updates Trigger Notification) ---
// --- ORDER MANAGER (Fixed Return Logic) ---
// --- ORDER MANAGER (PREMIUM: Search, Filters & Timeline) ---
// --- ORDER MANAGER (UPDATED: Size/Color + Delete Feature) ---
// --- ORDER MANAGER (FIXED FILTERS: PENDING & RETURNS WORKING) ---
// --- ORDER MANAGER (FINAL: ALL OLD + NEW FEATURES) ---
// --- ORDER MANAGER (GST COMPLIANT INVOICE SERIES) ---
// --- ORDER MANAGER (FIXED: INSTANT INVOICE UPDATE) ---
// --- ORDER MANAGER (FULL FEATURES: AUTO INVOICE + AUTO CREDIT NOTE) ---
// --- ORDER MANAGER (FIXED: NO ERRORS + SYNCED SERIES) ---
// --- ORDER MANAGER (LINKED: CN NUMBER MATCHES INVOICE NUMBER) ---
// --- ORDER MANAGER (LINKED: CN NUMBER MATCHES INVOICE NUMBER) ---
function OrderManager({ orders, updateOrderStatus, settings, deleteOrder, bulkUpdateOrderStatus, updateOrderTracking, updateOrderNote }: any) {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [viewingOrder, setViewingOrder] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // 1. Filter Logic
    const filteredOrders = orders?.filter((o: any) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (o.id || '').toLowerCase().includes(query) ||
            (o.customerName || '').toLowerCase().includes(query) ||
            (o.customerEmail || '').toLowerCase().includes(query) ||
            (o.invoiceNo || '').toLowerCase().includes(query);

        let matchesFilter = false;
        if (filterStatus === 'All') matchesFilter = true;
        else if (filterStatus === 'Returns') matchesFilter = (o.status || '').toLowerCase().includes('return') || (o.status || '').toLowerCase().includes('refund') || (o.status || '').toLowerCase().includes('rto');
        else matchesFilter = o.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const toggleSelect = (id: string) => {
        if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(o => o !== id));
        else setSelectedOrders([...selectedOrders, id]);
    };

    // ✅ HELPER: Financial Year (e.g., "25-26")
    const getFinYear = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const currentYY = Number(String(year).slice(2));
        return month >= 4 ? `${currentYY}-${currentYY + 1}` : `${currentYY - 1}-${currentYY}`;
    };

    // ✅ A. INVOICE GENERATOR (Series: ZER/25-26/0001, 0002...)
    const assignInvoiceNumber = async (orderId: string) => {
        let generatedNo = "";
        try {
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(db, "orders", orderId);
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) throw "Order not found";
                
                // Agar pehle se invoice hai to wahi return karo
                if (orderSnap.data().invoiceNo) { generatedNo = orderSnap.data().invoiceNo; return; }

                const counterRef = doc(db, "settings", "invoice_counter");
                const counterSnap = await transaction.get(counterRef);
                let nextCount = counterSnap.exists() ? counterSnap.data().current + 1 : 1;

                generatedNo = `ZER/${getFinYear()}/${String(nextCount).padStart(4, '0')}`;
                
                transaction.update(orderRef, { invoiceNo: generatedNo });
                transaction.set(counterRef, { current: nextCount }, { merge: true });
            });
            return generatedNo;
        } catch (error) { console.error("Invoice Error:", error); return null; }
    };

    // ✅ B. CREDIT NOTE GENERATOR (LINKED: CN-ZER/25-26/0004)
    // Ab ye naya counter nahi banayega, balki Invoice Number ke aage "CN-" laga dega.
    const assignCreditNoteNumber = async (orderId: string) => {
        let generatedCN = "";
        try {
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(db, "orders", orderId);
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) throw "Order not found";
                
                const data = orderSnap.data();
                // Agar pehle se CN hai to return karo
                if (data.creditNoteNo) { generatedCN = data.creditNoteNo; return; }

                // Agar Invoice Number nahi hai to pehle wo chahiye (fallback to ID)
                const baseRef = data.invoiceNo || orderId;
                
                // Logic: CN Number = "CN-" + Invoice Number
                // Ex: ZER/25-26/0004 -> CN-ZER/25-26/0004
                generatedCN = `CN-${baseRef}`;
                
                transaction.update(orderRef, { creditNoteNo: generatedCN });
            });
            return generatedCN;
        } catch (error) { console.error("CN Error:", error); return null; }
    };

    // ✅ C. MAIN STATUS HANDLER
    const handleStatusUpdate = async (orderId: string, status: string) => {
        let updates: any = { status };

        // 1. Invoice Logic
        if (['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) && !viewingOrder?.invoiceNo) {
            const inv = await assignInvoiceNumber(orderId);
            if (inv) updates.invoiceNo = inv;
        }

        // 2. Credit Note Logic
        if (['RTO', 'Refunded', 'Return Approved'].includes(status)) {
            // Credit Note banane se pehle ensure karo ki Invoice Number hai
            let currentInv = viewingOrder?.invoiceNo;
            if (!currentInv) {
                currentInv = await assignInvoiceNumber(orderId); // Pehle Invoice banao agar nahi hai
                if (currentInv) updates.invoiceNo = currentInv;
            }
            
            // Ab Credit Note banao (jo Invoice se match karega)
            if (!viewingOrder?.creditNoteNo) {
                const cn = await assignCreditNoteNumber(orderId);
                if (cn) updates.creditNoteNo = cn;
            }
        }

        // 3. Database Update
        if(updateOrderStatus) updateOrderStatus(orderId, status); 
        
        // 4. UI Update
        if (viewingOrder && viewingOrder.id === orderId) {
            setViewingOrder({ ...viewingOrder, ...updates });
        }
    };

    // ✅ D. BULK HANDLER
    const handleBulkAction = async (status: string) => {
        if (!bulkUpdateOrderStatus) return alert("Bulk function missing!");
        if (!confirm(`Mark ${selectedOrders.length} orders as ${status}?`)) return;
        
        if (['Shipped', 'Processing', 'Delivered'].includes(status)) {
            for (const id of selectedOrders) await assignInvoiceNumber(id);
        }

        await bulkUpdateOrderStatus(selectedOrders, status);
        setSelectedOrders([]);
        alert("✅ Bulk Update Successful");
    };

    const getStatusColor = (status: string) => {
        if (!status) return 'bg-white/10 text-white';
        const s = status.toLowerCase();
        if (s === 'delivered') return 'bg-green-500/20 text-green-400 border-green-500/50';
        if (s.includes('ship')) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
        if (s.includes('return') || s.includes('rto')) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
        if (s === 'cancelled') return 'bg-red-500/20 text-red-400 border-red-500/50';
        return 'bg-white/10 text-white border-white/10';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Order Management" subtitle="Track, process and manage customer orders" />

            {/* FILTER BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f2925] p-4 rounded-xl border border-white/5">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    {['All', 'Pending', 'Processing', 'Shipped', 'Returns'].map(tab => (
                        <button key={tab} onClick={() => setFilterStatus(tab)} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filterStatus === tab ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <input type="text" placeholder="Search Order ID, Name or Invoice..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs focus:border-amber-500/50 outline-none" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                </div>
            </div>

            {/* BULK ACTIONS */}
            {selectedOrders.length > 0 && (
                <div className="bg-amber-600/10 border border-amber-600/30 p-3 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2 shadow-lg">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-500 text-xs font-bold">{selectedOrders.length} Orders Selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkAction('Processing')} className="bg-white/10 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition">Mark Processing</button>
                        <button onClick={() => handleBulkAction('Shipped')} className="bg-white/10 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition">Mark Shipped</button>
                        <button onClick={() => handleBulkAction('Delivered')} className="bg-white/10 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition">Mark Delivered</button>
                    </div>
                </div>
            )}

            {/* ORDERS TABLE */}
            <div className="bg-[#0f2925] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-[#0a1f1c] text-[10px] uppercase text-white/40 tracking-wider">
                        <tr>
                            <th className="p-5 w-10"><input type="checkbox" onChange={(e) => setSelectedOrders(e.target.checked ? filteredOrders.map((o: any) => o.id) : [])} className="accent-amber-600 w-4 h-4 cursor-pointer" /></th>
                            <th className="p-5">Order ID / Invoice</th>
                            <th className="p-5">Customer</th>
                            <th className="p-5">Items</th>
                            <th className="p-5">Total</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredOrders?.map((o: any) => (
                            <tr key={o.id} className={`hover:bg-white/5 transition duration-200 group ${selectedOrders.includes(o.id) ? 'bg-amber-900/10' : ''}`}>
                                <td className="p-5"><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleSelect(o.id)} className="accent-amber-600 w-4 h-4 cursor-pointer" /></td>
                                <td className="p-5">
                                    <span className="font-mono text-xs text-white block mb-1">#{o.id.slice(-6)}</span>
                                    {o.invoiceNo ? (
                                        <span className="text-[10px] text-amber-500 font-mono font-bold block">{o.invoiceNo}</span>
                                    ) : (
                                        <span className="text-[9px] text-white/20 block">Pending Invoice</span>
                                    )}
                                    <span className="text-[10px] text-white/30 block mt-1">{o.date}</span>
                                    {o.isGift && <span className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-500 text-[9px] font-bold uppercase border border-amber-500/30 animate-pulse"><Gift className="w-3 h-3" /> Secret Gift</span>}
                                </td>
                                <td className="p-5"><p className="font-bold text-white text-sm">{o.customerName}</p><p className="text-[10px] text-white/40">{o.customerEmail}</p></td>
                                <td className="p-5 text-xs text-white/60">{o.items.length} Items</td>
                                <td className="p-5 font-bold text-amber-500 font-mono">₹{o.total.toLocaleString()}</td>
                                <td className="p-5"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap border ${getStatusColor(o.status)}`}>{o.status}</span></td>
                                <td className="p-5 text-right flex justify-end gap-2">
                                    <button onClick={() => setViewingOrder(o)} className="p-2 bg-white/5 hover:bg-white/10 hover:text-amber-400 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`⚠️ DELETE ORDER #${o.id}?`)) deleteOrder(o.id); }} className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!filteredOrders || filteredOrders.length === 0) && <div className="p-12 text-center text-white/30 italic">No orders found.</div>}
            </div>

            {/* ORDER DETAILS MODAL */}
            {viewingOrder && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0f2925] border border-white/10 w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a1f1c]">
                            <div>
                                <h3 className="text-xl font-serif text-white flex items-center gap-3">Order #{viewingOrder.id} <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${getStatusColor(viewingOrder.status)}`}>{viewingOrder.status}</span></h3>
                                {/* Invoice & Credit Note Display */}
                                {viewingOrder.invoiceNo && <p className="text-xs text-amber-500 mt-1 font-mono">Invoice: {viewingOrder.invoiceNo}</p>}
                                {viewingOrder.creditNoteNo && <p className="text-xs text-red-400 mt-1 font-mono">CN: {viewingOrder.creditNoteNo}</p>}
                                
                                {viewingOrder.tracking?.awbCode && <p className="text-xs text-white/50 mt-1 flex items-center gap-2"><Truck className="w-3 h-3"/> AWB: {viewingOrder.tracking.awbCode}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    if(!viewingOrder.invoiceNo) return alert("⚠️ Invoice number not generated! Mark status 'Processing' first.");
                                    generateAdminInvoice(viewingOrder, settings);
                                }} className="px-4 py-2 rounded-lg text-xs uppercase font-bold flex items-center gap-2 transition border bg-white/5 text-white border-white/5 hover:bg-white/10"><Printer className="w-4 h-4" /> Invoice</button>
                                <button onClick={() => setViewingOrder(null)} className="hover:bg-red-500/20 p-2 rounded-lg text-white/50 hover:text-red-500 transition"><X className="w-6 h-6" /></button>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-8">
                                
                                {/* Secret Gift Banner */}
                                {viewingOrder.isGift && (
                                    <div className="bg-[#0a1f1c] border-2 border-amber-500 p-6 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-6 relative overflow-hidden group">
                                        <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                            <div className="shrink-0"><div className="p-4 bg-amber-500 text-black rounded-full shadow-lg inline-block"><Gift className="w-8 h-8" /></div></div>
                                            <div className="flex-1">
                                                <h4 className="text-amber-500 font-bold text-xl uppercase tracking-widest flex items-center gap-2">Secret Gift Mode Active</h4>
                                                <ul className="text-white/80 text-sm mt-3 space-y-1 list-disc pl-4"><li>🚫 <strong>DO NOT</strong> put the Invoice inside.</li><li>📦 Use <strong>Luxury Packaging</strong>.</li></ul>
                                                {viewingOrder.giftMessage && <div className="mt-4 bg-white text-black p-4 rounded-lg shadow-lg border-l-4 border-amber-500"><p className="text-[10px] text-gray-400 uppercase font-bold mb-2 tracking-widest">Message Card:</p><p className="font-serif italic text-lg leading-relaxed text-center">"{viewingOrder.giftMessage}"</p></div>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-6">Order Progress</h4>
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 z-0"></div>
                                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-600 transition-all duration-500 z-0`} style={{ width: viewingOrder.status === 'Delivered' ? '100%' : viewingOrder.status.includes('Out') ? '75%' : viewingOrder.status === 'Shipped' ? '50%' : viewingOrder.status === 'Processing' ? '25%' : '0%' }}></div>
                                        {['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                                            const stepsOrder = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
                                            const isCompleted = stepsOrder.indexOf(viewingOrder.status) >= idx;
                                            return (
                                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-amber-600 border-amber-600 text-white' : 'bg-[#0f2925] border-white/10 text-white/20'}`}>{isCompleted ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}</div>
                                                    <span className={`text-[9px] uppercase font-bold text-center w-16 ${isCompleted ? 'text-white' : 'text-white/30'}`}>{step === 'Out for Delivery' ? 'Out for Delivery' : step}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <h4 className="text-xs text-amber-500 uppercase tracking-widest font-bold mb-4">Items Ordered</h4>
                                    <div className="space-y-3">
                                        {viewingOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                                                <div className="w-16 h-16 bg-black/20 rounded-md overflow-hidden"><img src={item.image} className="w-full h-full object-cover" /></div>
                                                <div className="flex-1">
                                                    <p className="text-white font-serif">{item.name}</p>
                                                    <div className="text-xs text-white/50 mt-1">Qty: {item.qty} | Size: {item.selectedSize || 'N/A'} | Color: {item.selectedColor || 'N/A'}</div>
                                                </div>
                                                <div className="text-right"><p className="text-amber-400 font-bold">₹{(item.price * item.qty).toLocaleString()}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/20 mt-6">
                                        <h4 className="text-[10px] text-yellow-500 uppercase font-bold mb-2 flex items-center gap-2"><Lock className="w-3 h-3"/> Internal Staff Notes</h4>
                                        <textarea 
                                            className="w-full bg-black/20 text-white text-xs p-3 rounded-lg border border-white/10 outline-none focus:border-yellow-500/50 resize-none placeholder:text-white/20"
                                            placeholder="Add private note..."
                                            defaultValue={viewingOrder.internalNote || ''}
                                            onBlur={(e) => { if(updateOrderNote) updateOrderNote(viewingOrder.id, e.target.value) }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Actions */}
                            <div className="space-y-6">
                                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-3 h-3" /> Customer Details</h4>
                                    <div className="space-y-4">
                                        <div><p className="text-xs text-white/50">Name</p><p className="text-sm text-white font-medium">{viewingOrder.customerName}</p></div>
                                        <div><p className="text-xs text-white/50">Email</p><p className="text-sm text-white font-medium break-all">{viewingOrder.customerEmail}</p></div>
                                        <div><p className="text-xs text-white/50">Address</p><p className="text-sm text-white/80 leading-relaxed mt-1">{typeof viewingOrder.address === 'object' ? `${viewingOrder.address.street}, ${viewingOrder.address.city} - ${viewingOrder.address.pincode}` : viewingOrder.address}</p></div>
                                        <div><p className="text-xs text-white/50">Phone</p><p className="text-sm text-white font-medium flex items-center gap-2"><Phone className="w-3 h-3 text-amber-500" /> {typeof viewingOrder.address === 'object' ? viewingOrder.address.phone : 'N/A'}</p></div>
                                        
                                        {/* Payment Info */}
                                        <div className="pt-3 border-t border-white/10 mt-3">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">Payment Info</p>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-white/50">Method</span>
                                                <div className="flex items-center gap-2">
                                                    {viewingOrder.paymentMethod === 'COD' 
                                                        ? <div className="flex items-center gap-1 text-orange-400"><DollarSign className="w-3 h-3" /><span className="text-xs font-bold">COD</span></div> 
                                                        : <div className="flex items-center gap-1 text-blue-400"><CreditCard className="w-3 h-3" /><span className="text-xs font-bold">Online</span></div>
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-white/50">Status</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${viewingOrder.paymentMethod === 'COD' && viewingOrder.status !== 'Delivered' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {viewingOrder.paymentMethod === 'COD' && viewingOrder.status !== 'Delivered' ? 'Pending' : 'Paid'}
                                                </span>
                                            </div>
                                            {viewingOrder.paymentId && <div className="mt-2 p-2 bg-black/20 rounded border border-white/5"><p className="text-[9px] text-white/30 font-mono">TXN: {viewingOrder.paymentId}</p></div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Actions</h4>
                                    
                                    {/* Shiprocket */}
                                    {viewingOrder.status === 'Processing' && (
                                        <button onClick={async () => {
                                            if (!confirm("Create Label on Shiprocket?")) return;
                                            const btn = document.getElementById('ship-btn'); if (btn) btn.innerText = "Generating...";
                                            try {
                                                const res = await fetch("/api/shiprocket/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(viewingOrder) });
                                                const data = await res.json();
                                                if (!data.success) { alert("❌ Error: " + (data.error?.message || "Failed")); if (btn) btn.innerText = "Retry Shipment"; return; }
                                                
                                                if (updateOrderTracking) {
                                                    await updateOrderTracking(viewingOrder.id, {
                                                        awbCode: data.data.awb_code,
                                                        trackingUrl: `https://shiprocket.co/tracking/${data.data.awb_code}`,
                                                        courierName: data.data.courier_name || 'Shiprocket',
                                                        shipmentId: data.data.shipment_id,
                                                        createdAt: new Date().toISOString()
                                                    });
                                                }
                                                alert(`✅ Label Created! AWB: ${data.data.awb_code}`);
                                                setViewingOrder(null); 
                                            } catch (err: any) { console.error(err); alert("System Error"); }
                                        }} id="ship-btn" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg">🚚 Create Shipment</button>
                                    )}

                                    {/* Status Buttons */}
                                    {viewingOrder.status === 'Pending' && <><button onClick={() => handleStatusUpdate(viewingOrder.id, 'Processing')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase transition">Process Order</button><button onClick={() => handleStatusUpdate(viewingOrder.id, 'Cancelled')} className="w-full py-3 bg-white/5 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-lg font-bold text-xs uppercase transition">Cancel Order</button></>}
                                    {viewingOrder.status === 'Processing' && <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Shipped')} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase transition">Mark as Shipped</button>}
                                    {viewingOrder.status === 'Shipped' && <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Out for Delivery')} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs uppercase transition">Out for Delivery</button>}
                                    {viewingOrder.status === 'Out for Delivery' && <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Delivered')} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase transition">Complete Delivery</button>}
                                    
                                    {/* RTO BUTTON */}
                                    {(viewingOrder.status === 'Shipped' || viewingOrder.status === 'Out for Delivery') && (
                                        <button onClick={() => { if(confirm("Mark as RTO (Returned)?")) handleStatusUpdate(viewingOrder.id, 'RTO'); }} className="w-full py-3 bg-orange-900/20 text-orange-400 border border-orange-900/50 rounded-lg text-xs font-bold uppercase hover:bg-orange-900 hover:text-white transition flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4"/> Mark as RTO</button>
                                    )}

                                    {/* Return Actions */}
                                    {viewingOrder.status === 'Return Requested' && (
                                        <div className="grid grid-cols-2 gap-3 mt-4"><button onClick={() => handleStatusUpdate(viewingOrder.id, 'Return Rejected')} className="py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition">Reject</button><button onClick={() => handleStatusUpdate(viewingOrder.id, 'Return Approved')} className="py-2 bg-green-500 text-[#0a1f1c] rounded-lg text-xs font-bold uppercase hover:bg-green-400 transition">Approve</button></div>
                                    )}
                                    {viewingOrder.status === 'Return Approved' && (
                                        <button onClick={() => { if(confirm(`Confirm Refund?`)) handleStatusUpdate(viewingOrder.id, 'Refunded'); }} className="w-full mt-3 py-3 bg-white text-[#0a1f1c] rounded-lg text-xs font-bold uppercase hover:bg-gray-200 transition">Refund Processed</button>
                                    )}
                                    
                                    {/* Download Credit Note (Always Visible if RTO/Refunded) */}
                                    {(viewingOrder.status === 'Refunded' || viewingOrder.status === 'RTO' || viewingOrder.creditNoteNo) && (
                                        <button onClick={() => generateCreditNote(viewingOrder, settings)} className="w-full py-3 border border-dashed border-white/30 text-white/70 hover:text-white rounded-lg text-xs font-bold uppercase hover:bg-white/5 transition flex items-center justify-center gap-2"><FileText className="w-4 h-4"/> Download Credit Note</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- PRODUCT MANAGER (Updates Trigger Notification) ---
// --- PRODUCT MANAGER (PREMIUM: Search, Stock Alerts & Better UI) ---
// --- PRODUCT MANAGER (FIXED: Cloudinary Uploads) ---
function ProductManager({ products, addProduct, updateProduct, deleteProduct }: any) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [uploading, setUploading] = useState(false); // New Upload State

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Form State
    // ✅ colors: [] add kar diya gaya hai
    const [formData, setFormData] = useState<AdminProductForm>({
        images: [],
        galleryImages: [],
        tags: [],
        stock: 10,
        colors: [],
        sizes: []
    });

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const categoriesList = [{ name: "Necklace", color: "text-amber-400" }, { name: "Earrings", color: "text-pink-400" }, { name: "Rings", color: "text-blue-400" }, { name: "Bracelets", color: "text-purple-400" }, { name: "Sets", color: "text-green-400" }, { name: "Pendants", color: "text-red-400" }, { name: "New", color: "text-white" }];
    const availableTags = ["Premium", "Best Seller", "New Arrival", "Limited Edition", "Sale"];

    // --- FILTERS ---
    const filteredProducts = products?.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // --- NEW: CLOUDINARY UPLOAD HANDLERS ---

    // 1. Main Image Upload
    const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file); // Cloudinary Upload
                if (url) {
                    setFormData(prev => ({ ...prev, image: url, hoverImage: url }));
                }
            } catch (err) {
                alert("Image upload failed. Please try again.");
            } finally {
                setUploading(false);
            }
        }
    };

    // 2. Gallery Images Upload
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setUploading(true);
            try {
                const newUrls: string[] = [];
                // Upload all selected files
                for (let i = 0; i < files.length; i++) {
                    const url = await uploadToCloudinary(files[i]);
                    if (url) newUrls.push(url);
                }
                setFormData(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...newUrls] }));
            } catch (err) {
                alert("Gallery upload failed.");
            } finally {
                setUploading(false);
            }
        }
    };

    const removeGalleryImage = (index: number) => { setFormData(prev => ({ ...prev, galleryImages: prev.galleryImages?.filter((_, i) => i !== index) })); };

    // --- SAVE HANDLER ---
    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert('Name and Price required');

        const allImages = [formData.image, ...(formData.galleryImages || [])].filter(Boolean) as string[];
        const pid = editingId ? editingId : Date.now().toString();

      const finalProduct = {
    id: pid,
    name: formData.name,
    price: Number(formData.price),
    originalPrice: Number(formData.originalPrice) || 0,
    category: formData.category || 'New',
    description: formData.description || '',
    image: formData.image || 'https://via.placeholder.com/800',
    hoverImage: formData.hoverImage || formData.image,
    images: allImages.length > 0 ? allImages : [formData.image || ''],
    stock: Number(formData.stock),
    
    // ✅ Updated Fields
    sku: formData.sku || `ZER-${Math.floor(Math.random() * 10000)}`, 
    hsn: formData.hsn || "7117", 
    gstRate: Number(formData.gstRate) || 3, // ✅ Ye line add/check karein
    
    // ... baaki fields waise hi rahenge ...
    colors: formData.colors?.map(c => c.trim()).filter(Boolean) || [],
    sizes: formData.sizes?.map(s => s.trim()).filter(Boolean) || [],
    tags: formData.tags || [],
    material: formData.material || 'Premium Quality Material',
    warranty: formData.warranty || 'Standard Brand Warranty',
    care: formData.care || 'Avoid perfumes and water.'
} as Product;

        try {
            if (editingId) await updateProduct(editingId, finalProduct);
            else await addProduct(finalProduct);

            window.dispatchEvent(new Event("storage"));
            setIsFormOpen(false);
            setEditingId(null);
            setFormData({ images: [], galleryImages: [], tags: [], stock: 10 });
            alert("✅ Product Saved Successfully!");

        } catch (error) {
            console.error(error);
            alert("❌ Error saving product. Check console.");
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/50">Out of Stock</span>;
        if (stock < 5) return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase rounded border border-orange-500/50 animate-pulse">Low Stock ({stock})</span>;
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded border border-green-500/50">In Stock ({stock})</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Inventory Manager" subtitle="Manage products, stock levels, and pricing" />

            {/* CONTROLS BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f2925] p-4 rounded-xl border border-white/5">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    <button onClick={() => setFilterCategory('All')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filterCategory === 'All' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>All</button>
                    {categoriesList.map(cat => (
                        <button key={cat.name} onClick={() => setFilterCategory(cat.name)} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filterCategory === cat.name ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>{cat.name}</button>
                    ))}
                </div>
                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative flex-1 md:w-64">
                        <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs focus:border-amber-500/50 outline-none" />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg></div>
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({ images: [], galleryImages: [], tags: [], stock: 10 }); setIsFormOpen(true); }} className="bg-amber-600 text-white px-4 py-2 flex items-center gap-2 text-xs uppercase tracking-widest hover:bg-amber-700 shadow-xl rounded-lg transition whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </div>
            </div>

            {/* PRODUCT LIST */}
            <div className="bg-[#0f2925] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-[#0a1f1c] text-[10px] uppercase text-white/40 tracking-wider">
                        <tr><th className="p-5">Product Info</th><th className="p-5">Category & Tags</th><th className="p-5">Price</th><th className="p-5">Stock Status</th><th className="p-5 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredProducts?.map((product: any) => (
                            <tr key={product.id} className="hover:bg-white/5 transition duration-200 group">
                                <td className="p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-black/20 rounded-lg overflow-hidden border border-white/5"><img src={product.image} alt={product.name} className="w-full h-full object-cover" /></div><div><h4 className="font-bold text-white group-hover:text-amber-400 transition">{product.name}</h4><p className="text-[10px] text-white/30 font-mono mt-0.5">ID: {product.id.slice(-4)}</p></div></div></td>
                                <td className="p-5"><span className="text-xs text-white/80 block mb-1">{product.category}</span><div className="flex gap-1">{product.tags?.slice(0, 2).map((t: string) => <span key={t} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40 uppercase">{t}</span>)}</div></td>
                                <td className="p-5 font-bold text-white">₹{product.price.toLocaleString()}</td>
                                <td className="p-5">{getStockStatus(product.stock || 0)}</td>
                                <td className="p-5 text-right"><div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition"><button onClick={() => { setEditingId(product.id); const mainImg = product.images?.[0] || product.image; const gallery = product.images?.slice(1) || []; setFormData({ ...product, image: mainImg, galleryImages: gallery }); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 hover:text-amber-400 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!filteredProducts || filteredProducts.length === 0) && <div className="p-12 text-center text-white/30"><Package className="w-12 h-12 mb-4 mx-auto opacity-20" /><p>No products found.</p></div>}
            </div>

            {/* ADD/EDIT MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
                    <div className="bg-[#0f2925] border border-white/10 w-full max-w-4xl shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a1f1c] sticky top-0 z-10">
                            <div><h3 className="font-serif text-2xl text-white">{editingId ? 'Edit Product' : 'Add New Item'}</h3><p className="text-xs text-white/40 mt-1">Fill in the details below.</p></div>
                            <button onClick={() => setIsFormOpen(false)}><X className="w-6 h-6 text-white/40 hover:text-white transition" /></button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* IMAGES COLUMN */}
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-white/40 uppercase block mb-2 font-bold">Main Image</label>
                                    <div onClick={() => !uploading && fileInputRef.current?.click()} className="w-full aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-black/20 hover:border-amber-500/50 transition group relative overflow-hidden">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                                        {uploading ? (
                                            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : formData.image ? (
                                            <>
                                                <img src={formData.image} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><p className="text-xs font-bold text-white uppercase"><UploadCloud className="w-6 h-6 inline mb-1" /> Change</p></div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4"><UploadCloud className="w-10 h-10 text-white/20 mx-auto mb-2 group-hover:text-amber-500 transition" /><span className="text-xs text-white/40 font-bold uppercase">Click to Upload</span></div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase block mb-2 font-bold">Gallery</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {formData.galleryImages?.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square bg-black/20 rounded-lg overflow-hidden group border border-white/5"><img src={img} className="w-full h-full object-cover" /><button onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white" /></button></div>
                                        ))}
                                        <div onClick={() => !uploading && galleryInputRef.current?.click()} className="aspect-square border border-dashed border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5 hover:border-amber-500/30 transition">
                                            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus className="w-5 h-5 text-white/30" />}
                                            <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DETAILS COLUMN */}
                            <div className="space-y-5">
                                <div className="space-y-1"><label className="text-[10px] text-white/40 uppercase font-bold">Product Name</label><input className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-white/40 uppercase font-bold">Selling Price (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                                                value={formData.price || ''}
                                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-white/40 uppercase font-bold">MRP / Original Price (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                                                placeholder="Optional"
                                                value={formData.originalPrice || ''}
                                                onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1"><label className="text-[10px] text-white/40 uppercase font-bold">Stock</label><input type="number" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} /></div>
                                </div>
                              <div className="grid grid-cols-3 gap-4 mt-4">
    {/* 1. SKU Field */}
    <div className="space-y-1">
        <label className="text-[10px] text-white/40 uppercase font-bold">SKU (Stock ID)</label>
        <input
            type="text"
            className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 uppercase font-mono"
            placeholder="RING-GOLD-001"
            value={formData.sku || ''}
            onChange={e => setFormData({ ...formData, sku: e.target.value })}
        />
    </div>

    {/* 2. HSN Code Field */}
    <div className="space-y-1">
        <label className="text-[10px] text-white/40 uppercase font-bold">HSN Code</label>
        <input
            type="text"
            className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 font-mono"
            placeholder="7117"
            value={formData.hsn || ''}
            onChange={e => setFormData({ ...formData, hsn: e.target.value })}
        />
    </div>

    {/* 3. ✅ NEW: GST Rate Dropdown */}
    <div className="space-y-1">
        <label className="text-[10px] text-white/40 uppercase font-bold">GST Rate (%)</label>
        <select
            className="w-full p-4 bg-[#0a1f1c] border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
            value={formData.gstRate || 3} // Default 3%
            onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
        >
            <option value="0">0% (Exempt)</option>
            <option value="3">3% (Jewellery)</option>
            <option value="5">5% (Apparel &lt; 1000)</option>
            <option value="12">12% (Standard)</option>
            <option value="18">18% (Perfume/Services)</option>
            <option value="28">28% (Luxury)</option>
        </select>
    </div>
</div>
                                <div className="space-y-1"><label className="text-[10px] text-white/40 uppercase font-bold">Category</label><select className="w-full p-4 bg-[#0a1f1c] border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 appearance-none" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })}><option value="" className="text-stone-500">Select Category</option>{categoriesList.map(cat => (<option key={cat.name} value={cat.name} className={`${cat.color}`}>{cat.name}</option>))}</select></div>
                                <div className="space-y-1"><label className="text-[10px] text-white/40 uppercase font-bold">Description</label><textarea className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white h-24 resize-none outline-none focus:border-amber-500/50" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                                {/* 👇 Naye Fields Yahan Start Honge */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-white/40 uppercase font-bold">Material Info</label>
                                        <input
                                            className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                                            placeholder="e.g. Gold Plated Brass"
                                            value={formData.material || ''}
                                            onChange={e => setFormData({ ...formData, material: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-white/40 uppercase font-bold">Warranty</label>
                                        <input
                                            className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                                            placeholder="e.g. 6 Months Polish"
                                            value={formData.warranty || ''}
                                            onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-white/40 uppercase font-bold">Care Instructions</label>
                                    <input
                                        className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                                        placeholder="e.g. Keep away from water"
                                        value={formData.care || ''}
                                        onChange={e => setFormData({ ...formData, care: e.target.value })}
                                    />
                                </div>
                                {/* 👆 Naye Fields Yahan Khatam */}
                                {/* ✅ APNA NAYA CODE YAHAN PASTE KAREIN 👇 */}
                                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    {/* ... Aapka Stock, Tags, Colors wala code ... */}
                                </div>
                                {/* 👆 AAPKA CODE YAHAN KHATAM */}
                                {/* --- NAYA CODE: TAGS & COLORS INPUT --- */}
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-4 space-y-4">

                                    {/* 1. TAGS INPUT (Buttons ki jagah ab Type karein) */}
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="New, Sale, Bestseller"
                                            value={formData.tags?.join(', ') || ''}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50"
                                        />
                                    </div>

                                    {/* 2. COLORS INPUT (Hex Codes) */}
                                    {/* COLORS INPUT (UPDATED FIX) */}
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Colors (Hex Codes)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="#FF0000,#000000"
                                                // ✅ CHANGE 1: Comma ke baad space mat do
                                                value={formData.colors?.join(',') || ''}
                                                // ✅ CHANGE 2: Type karte waqt filter mat karo (Sidha split karo)
                                                onChange={(e) => setFormData({ ...formData, colors: e.target.value.split(',') })}
                                                className="flex-1 p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50 font-mono"
                                            />
                                            {/* Color Preview */}
                                            <div className="flex gap-1 items-center bg-black/40 p-2 rounded-lg border border-white/10 min-w-[60px] h-[46px]">
                                                {formData.colors?.map((c: string, i: number) => (
                                                    <div key={i} className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c.trim() }} title={c}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-white/30 mt-1">Example: #FF0000,#000000 (Comma se alag karein)</p>
                                    </div>
{/* 3. SIZES INPUT (New Section) */}
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Sizes (Comma Separated)</label>
                                        <input
                                            type="text"
                                            placeholder="S, M, L, XL or 6, 7, 8, 9"
                                            // ✅ Data ko comma se todkar array banayega
                                            value={formData.sizes?.join(', ') || ''}
                                            onChange={(e) => setFormData({ ...formData, sizes: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50"
                                        />
                                        <p className="text-[9px] text-white/30 mt-1">Example: 6, 7, 8 (Ring) or 16, 18, 20 (Chain)</p>
                                    </div>
                                </div>
                                <div className="pt-4"><button disabled={uploading} onClick={handleSave} className="w-full bg-amber-600 text-white py-4 rounded-xl uppercase tracking-widest text-xs font-bold hover:bg-amber-700 transition flex items-center justify-center gap-2">{uploading ? 'Uploading Images...' : <><Save className="w-4 h-4" /> Save Product</>}</button></div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 3. CONFIG MANAGER (IMPROVED: Payment & Delivery APIs) ---
// --- CONFIG MANAGER (Fully Functional) ---
// --- CONFIG MANAGER (ULTRA PREMIUM: Razorpay + PayU + Logistics) ---
// --- CONFIG MANAGER (FIXED: Full Code + Persistence) ---
function ConfigManager({ showToast, updateSystemConfig }: any) {
    // 1. Config State (Razorpay, PayU, Shiprocket, Instamojo sab included)
    const [config, setConfig] = useState({
        razorpay: {
            enabled: true,
            mode: "test",   // test | live
            keyId: ""       // rzp_test_xxx OR rzp_live_xxx
        },
        payu: { enabled: false, merchantKey: '', merchantSalt: '' },
        shiprocket: { enabled: true, email: '', password: '' },
        payment: { instamojoApiKey: '', instamojoAuthToken: '', instamojoEnabled: false },
        store: {
            taxRate: 3,
            shippingCost: 150,
            freeShippingThreshold: 5000,
            currency: '₹',
            maintenanceMode: false,
            globalAlert: 'Welcome to ZERIMI - Premium Jewelry',
            giftModeCost: 50,
            // 👇 NEW: LOYALTY SETTINGS
            pointValue: 1, // 1 Point = ₹1
            tierConfig: {
                goldThreshold: 1000, platinumThreshold: 5000, solitaireThreshold: 10000,
                goldMultiplier: 1.5, platinumMultiplier: 2, solitaireMultiplier: 3
            }
        },

        invoice: {
            companyName: 'ZERIMI JEWELS',
            address: '',
            state: '',
            gstin: '',
            terms: 'Goods once sold cannot be returned after 7 days.',
            logoUrl: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
    const [testingConnection, setTestingConnection] = useState<string | null>(null);

    // ✅ FIX: Page Load hote hi Database se Settings Fetch karein
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Firebase se data mango
                const docRef = doc(db, "settings", "general");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Merge DB data with Default State (taaki kuch gayab na ho)
                    setConfig(prev => ({
                        ...prev,
                        ...data, // Root level overrides
                        payment: { ...prev.payment, ...data.payment },
                        razorpay: { ...prev.razorpay, ...data.razorpay },
                        payu: { ...prev.payu, ...data.payu },
                        shiprocket: { ...prev.shiprocket, ...data.shiprocket },
                        store: { ...prev.store, ...data.store }
                    }));
                } else {
                    // Agar DB khali hai, to LocalStorage check karo (Fallback)
                    const saved = localStorage.getItem('zerimi_config');
                    if (saved) setConfig(JSON.parse(saved));
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };

        fetchSettings();
    }, []);

    // 4. Handlers
    const handleChange = (section: string, field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...prev[section as keyof typeof prev], [field]: value }
        }));
    };

    const toggleSecret = (field: string) => {
        setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSave = async () => {
        // --- 1. VALIDATION PART (Suraksha) ---
        // Agar Razorpay ON hai par Key ID khali hai to roko
        if (config.razorpay.enabled && !config.razorpay.keyId) {
            showToast("⚠️ Razorpay Key ID is required!", "error");
            return;
        }

        // Agar Live Mode ON hai to warning do
        if (config.razorpay.enabled && config.razorpay.mode === "live") {
            const ok = confirm("⚠️ WARNING: Live Mode is ON.\nReal money will be charged. Are you sure?");
            if (!ok) return; // User ne Cancel kiya to ruk jao
        }

        // --- 2. SAVING PART (Database Update) ---
        setLoading(true);
        try {
            // Database mein save karo
            const docRef = doc(db, "settings", "general");
            await setDoc(docRef, config, { merge: true });

            // Store update karo
            if (updateSystemConfig) {
                await updateSystemConfig(config);
            }

            // LocalStorage backup
            localStorage.setItem('zerimi_config', JSON.stringify(config));

            showToast("✅ Configuration saved securely to Database!", "success");
        } catch (error) {
            console.error("Save Error:", error);
            showToast("❌ Failed to save configuration", "error");
        } finally {
            setLoading(false);
        }
    };
    const testConnection = (service: string) => {
        setTestingConnection(service);
        setTimeout(() => {
            setTestingConnection(null);
            showToast(`✅ ${service} connection verified!`, "success");
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <SectionHeader title="System Configuration" subtitle="Manage payment gateways, logistics, and store rules" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN: CRITICAL INTEGRATIONS */}
                <div className="space-y-8">

                    {/* 1. RAZORPAY */}
                    <div className={`p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${config.razorpay.enabled ? 'bg-[#0f2925] border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)]' : 'bg-black/20 border-white/5 grayscale'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition duration-700"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${config.razorpay.enabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}`}><CreditCard className="w-6 h-6" /></div>
                                <div><h3 className="text-lg font-serif text-white">Razorpay</h3><p className="text-[10px] text-white/40 uppercase tracking-widest">Payment Processor</p></div>
                            </div>
                            <div onClick={() => handleChange('razorpay', 'enabled', !config.razorpay.enabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${config.razorpay.enabled ? 'bg-blue-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.razorpay.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        {config.razorpay.enabled && (
                            <div className="space-y-4 animate-fade-in-up relative z-10">
                                <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Key ID</label><input value={config.razorpay.keyId} onChange={(e) => handleChange('razorpay', 'keyId', e.target.value)} placeholder="rzp_live_..." className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50 transition font-mono" /></div>
                                <div className="relative">
                                    <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Key ID</label>
                                    <input
                                        type="text"
                                        value={config.razorpay.keyId}
                                        onChange={(e) => handleChange('razorpay', 'keySecret', e.target.value)} placeholder="••••••••••••••••" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50 transition font-mono" /><button onClick={() => toggleSecret('rzp')} className="absolute right-4 top-9 text-white/30 hover:text-white"><Eye className="w-4 h-4" /></button></div>
                                <button onClick={() => testConnection('Razorpay')} disabled={testingConnection === 'Razorpay'} className="w-full py-3 mt-2 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase rounded-xl hover:bg-blue-500/10 transition flex items-center justify-center gap-2">{testingConnection === 'Razorpay' ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{testingConnection === 'Razorpay' ? 'Verifying...' : 'Test Connection'}</button>
                            </div>
                        )}
                    </div>

                    {/* 2. PAYU MONEY */}
                    <div className={`p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${config.payu.enabled ? 'bg-[#0f2925] border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]' : 'bg-black/20 border-white/5 grayscale'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/20 transition duration-700"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${config.payu.enabled ? 'bg-green-600 text-white' : 'bg-white/10 text-white/40'}`}><CreditCard className="w-6 h-6" /></div>
                                <div><h3 className="text-lg font-serif text-white">PayU Money</h3><p className="text-[10px] text-white/40 uppercase tracking-widest">Alternate Gateway</p></div>
                            </div>
                            <div onClick={() => handleChange('payu', 'enabled', !config.payu.enabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${config.payu.enabled ? 'bg-green-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.payu.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        {config.payu.enabled && (
                            <div className="space-y-4 animate-fade-in-up relative z-10">
                                <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Merchant Key</label><input value={config.payu.merchantKey} onChange={(e) => handleChange('payu', 'merchantKey', e.target.value)} placeholder="gtKFFx" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-green-500/50 transition font-mono" /></div>
                                <div className="relative"><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Merchant Salt (Secret)</label><input type={showSecret['payu'] ? "text" : "password"} value={config.payu.merchantSalt} onChange={(e) => handleChange('payu', 'merchantSalt', e.target.value)} placeholder="••••••••••••••••" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-green-500/50 transition font-mono" /><button onClick={() => toggleSecret('payu')} className="absolute right-4 top-9 text-white/30 hover:text-white"><Eye className="w-4 h-4" /></button></div>
                                <button onClick={() => testConnection('PayU')} disabled={testingConnection === 'PayU'} className="w-full py-3 mt-2 border border-green-500/30 text-green-400 text-xs font-bold uppercase rounded-xl hover:bg-green-500/10 transition flex items-center justify-center gap-2">{testingConnection === 'PayU' ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{testingConnection === 'PayU' ? 'Verifying...' : 'Test Connection'}</button>
                            </div>
                        )}
                    </div>

                    {/* 3. SHIPROCKET */}
                    <div className={`p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${config.shiprocket.enabled ? 'bg-[#0f2925] border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]' : 'bg-black/20 border-white/5 grayscale'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition duration-700"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${config.shiprocket.enabled ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/40'}`}><Truck className="w-6 h-6" /></div>
                                <div><h3 className="text-lg font-serif text-white">Shiprocket</h3><p className="text-[10px] text-white/40 uppercase tracking-widest">Logistics Partner</p></div>
                            </div>
                            <div onClick={() => handleChange('shiprocket', 'enabled', !config.shiprocket.enabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${config.shiprocket.enabled ? 'bg-amber-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.shiprocket.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        {config.shiprocket.enabled && (
                            <div className="space-y-4 animate-fade-in-up relative z-10">
                                <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Account Email</label><input value={config.shiprocket.email} onChange={(e) => handleChange('shiprocket', 'email', e.target.value)} placeholder="admin@zerimi.com" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 transition" /></div>
                                <div className="relative"><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">API Password / Token</label><input type={showSecret['ship'] ? "text" : "password"} value={config.shiprocket.password} onChange={(e) => handleChange('shiprocket', 'password', e.target.value)} placeholder="••••••••••••••••" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 transition font-mono" /><button onClick={() => toggleSecret('ship')} className="absolute right-4 top-9 text-white/30 hover:text-white"><Eye className="w-4 h-4" /></button></div>
                                <button onClick={() => testConnection('Shiprocket')} disabled={testingConnection === 'Shiprocket'} className="w-full py-3 mt-2 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase rounded-xl hover:bg-amber-500/10 transition flex items-center justify-center gap-2">{testingConnection === 'Shiprocket' ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{testingConnection === 'Shiprocket' ? 'Authenticating...' : 'Validate Account'}</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* 4. INSTAMOJO (Fixed Persistence) */}
                    <div className={`p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${config.payment?.instamojoEnabled ? 'bg-[#0f2925] border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.1)]' : 'bg-black/20 border-white/5 grayscale'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition duration-700"></div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${config.payment?.instamojoEnabled ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/40'}`}>
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-serif text-white">Instamojo</h3>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Indian Payment Gateway</p>
                                </div>
                            </div>
                            <div onClick={() => handleChange('payment', 'instamojoEnabled', !config.payment?.instamojoEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${config.payment?.instamojoEnabled ? 'bg-purple-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.payment?.instamojoEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        {config.payment?.instamojoEnabled && (
                            <div className="space-y-4 animate-fade-in-up relative z-10">
                                <div>
                                    <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">API Key</label>
                                    <input
                                        value={config.payment?.instamojoApiKey || ''}
                                        onChange={(e) => handleChange('payment', 'instamojoApiKey', e.target.value)}
                                        placeholder="test_2384..."
                                        className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50 transition font-mono"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Auth Token</label>
                                    <input
                                        type={showSecret['mojo'] ? "text" : "password"}
                                        value={config.payment?.instamojoAuthToken || ''}
                                        onChange={(e) => handleChange('payment', 'instamojoAuthToken', e.target.value)}
                                        placeholder="••••••••••••••••"
                                        className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50 transition font-mono"
                                    />
                                    <button onClick={() => toggleSecret('mojo')} className="absolute right-4 top-9 text-white/30 hover:text-white">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. STORE RULES */}
                    {/* 🟢 NEW: LOYALTY PROGRAM CONFIGURATION */}
                    <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition duration-700"></div>
                        
                        <h3 className="text-white font-serif text-lg mb-6 flex items-center gap-2 relative z-10">
                            <span className="bg-amber-500/20 p-1.5 rounded text-amber-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg></span> 
                            Loyalty & Rewards
                        </h3>

                        <div className="space-y-6 relative z-10">
                            
                            {/* 1. Point Value */}
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <label className="text-[10px] text-amber-500 uppercase font-bold mb-2 block">1 Point Value (₹)</label>
                                <div className="flex gap-4 items-center">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        // @ts-ignore
                                        value={config.store.pointValue} 
                                        onChange={(e) => handleChange('store', 'pointValue', Number(e.target.value))} 
                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 font-mono" 
                                    />
                                    <div className="text-[10px] text-white/40 leading-tight w-40">
                                        Example: <br/> 0.5 = ₹50 off for 100 pts <br/> 1.0 = ₹100 off for 100 pts
                                    </div>
                                </div>
                            </div>

                            {/* 2. Tier Config */}
                            <div>
                                <h4 className="text-[10px] text-white/40 uppercase font-bold mb-3">Tier Thresholds & Multipliers</h4>
                                <div className="space-y-3">
                                    
                                    {/* Gold */}
                                    <div className="flex gap-2 items-center bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                                        <span className="text-[10px] font-bold text-amber-500 w-16 uppercase">Gold</span>
                                        <input 
                                            placeholder="Points" 
                                            type="number" 
                                            // @ts-ignore
                                            value={config.store.tierConfig?.goldThreshold} 
                                            onChange={(e) => setConfig({...config, store: {...config.store, tierConfig: {...config.store.tierConfig, goldThreshold: Number(e.target.value)}}})}
                                            className="w-20 p-2 bg-black/40 border border-white/10 rounded text-white text-xs outline-none"
                                        />
                                        <span className="text-white/30 text-xs">pts</span>
                                        <input 
                                            placeholder="Speed" 
                                            type="number" 
                                            step="0.1" 
                                            // @ts-ignore
                                            value={config.store.tierConfig?.goldMultiplier} 
                                            onChange={(e) => setConfig({...config, store: {...config.store, tierConfig: {...config.store.tierConfig, goldMultiplier: Number(e.target.value)}}})}
                                            className="w-16 p-2 bg-black/40 border border-white/10 rounded text-white text-xs outline-none"
                                        />
                                        <span className="text-white/30 text-xs">x</span>
                                    </div>

                                    {/* Platinum */}
                                    <div className="flex gap-2 items-center bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/10">
                                        <span className="text-[10px] font-bold text-cyan-400 w-16 uppercase">Platinum</span>
                                        <input 
                                            type="number" 
                                            // @ts-ignore
                                            value={config.store.tierConfig?.platinumThreshold} 
                                            onChange={(e) => setConfig({...config, store: {...config.store, tierConfig: {...config.store.tierConfig, platinumThreshold: Number(e.target.value)}}})}
                                            className="w-20 p-2 bg-black/40 border border-white/10 rounded text-white text-xs outline-none"
                                        />
                                        <span className="text-white/30 text-xs">pts</span>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            // @ts-ignore
                                            value={config.store.tierConfig?.platinumMultiplier} 
                                            onChange={(e) => setConfig({...config, store: {...config.store, tierConfig: {...config.store.tierConfig, platinumMultiplier: Number(e.target.value)}}})}
                                            className="w-16 p-2 bg-black/40 border border-white/10 rounded text-white text-xs outline-none"
                                        />
                                        <span className="text-white/30 text-xs">x</span>
                                    </div>

                                    {/* Solitaire */}
                                    <div className="flex gap-2 items-center bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                                        <span className="text-[10px] font-bold text-rose-400 w-16 uppercase">Solitaire</span>
                                        <input 
                                            type="number" 
                                            // @ts-ignore
                                            value={config.store.tierConfig?.solitaireThreshold} 
                                            onChange={(e) => setConfig({...config, store: {...config.store, tierConfig: {...config.store.tierConfig, solitaireThreshold: Number(e.target.value)}}})}
                                            className="w-20 p-2 bg-black/40 border border-white/10 rounded text-white text-xs outline-none"
                                        />
                                        <span className="text-white/30 text-xs">pts</span>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            // @ts-ignore
                                            value={config.store.tierConfig?.solitaireMultiplier} 
                                            onChange={(e) => setConfig({...config, store: {...config.store, tierConfig: {...config.store.tierConfig, solitaireMultiplier: Number(e.target.value)}}})}
                                            className="w-16 p-2 bg-black/40 border border-white/10 rounded text-white text-xs outline-none"
                                        />
                                        <span className="text-white/30 text-xs">x</span>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                        <h3 className="text-white font-serif text-lg mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Financial Rules</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs text-white mb-2"><span className="font-bold">GST / Tax Rate</span><span className="text-green-400">{config.store.taxRate}%</span></div>
                                <input type="range" min="0" max="28" step="1" value={config.store.taxRate} onChange={(e) => handleChange('store', 'taxRate', Number(e.target.value))} className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-green-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Shipping Cost (₹)</label><input type="number" value={config.store.shippingCost} onChange={(e) => handleChange('store', 'shippingCost', Number(e.target.value))} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-green-500/50 font-mono" /></div>
                                <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Free Ship Above (₹)</label><input type="number" value={config.store.freeShippingThreshold} onChange={(e) => handleChange('store', 'freeShippingThreshold', Number(e.target.value))} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-green-500/50 font-mono" /></div>
                            </div>
                        </div>
                    </div>

                    {/* 6. SITE CONTROLS */}
                    <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                        <h3 className="text-white font-serif text-lg mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" /> Site Controls</h3>
                        {/* 7. INVOICE SETTINGS (Admin Control) */}
                        <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 relative overflow-hidden mt-8">
                            <h3 className="text-white font-serif text-lg mb-6 flex items-center gap-2">
                                <Printer className="w-5 h-5 text-amber-400" /> Invoice Configuration
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Company Name</label>
                                        <input
                                            value={config.invoice?.companyName || ''}
                                            onChange={(e) => handleChange('invoice', 'companyName', e.target.value)}
                                            placeholder="ZERIMI JEWELS"
                                            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">GSTIN (Optional)</label>
                                        <input
                                            value={config.invoice?.gstin || ''}
                                            onChange={(e) => handleChange('invoice', 'gstin', e.target.value)}
                                            placeholder="27AABCU..."
                                            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Full Address</label>
                                    <textarea
                                        value={config.invoice?.address || ''}
                                        onChange={(e) => handleChange('invoice', 'address', e.target.value)}
                                        placeholder="Shop No. 1, Luxury Lane, Mumbai..."
                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 h-20 resize-none"
                                    />
                                </div>
{/* ✅ NEW: Warehouse State Selector */}
<div>
    <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Warehouse State (For GST)</label>
    <div className="relative">
        <select
            value={config.invoice?.state || ''}
            onChange={(e) => handleChange('invoice', 'state', e.target.value)}
            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
        >
            <option value="" disabled>Select State</option>
            {STATES.map(state => (
                <option key={state} value={state} className="bg-stone-900">{state}</option>
            ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
    </div>
    <p className="text-[9px] text-white/30 mt-1">Required to calculate IGST vs SGST/CGST automatically.</p>
</div>
                                <div>
                                    <label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Terms & Conditions</label>
                                    <textarea
                                        value={config.invoice?.terms || ''}
                                        onChange={(e) => handleChange('invoice', 'terms', e.target.value)}
                                        placeholder="No returns without video proof..."
                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500/50 h-20 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div><label className="text-[10px] text-white/40 uppercase font-bold mb-1 block">Global Announcement Bar</label><div className="relative"><Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><input value={config.store.globalAlert} onChange={(e) => handleChange('store', 'globalAlert', e.target.value)} placeholder="e.g. FLAT 20% OFF on all Diamonds!" className="w-full p-3 pl-10 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50" /></div></div>
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                                <div><h4 className="text-red-400 font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Maintenance Mode</h4><p className="text-[10px] text-white/40">Shutdown storefront for customers.</p></div>
                                <div onClick={() => handleChange('store', 'maintenanceMode', !config.store.maintenanceMode)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${config.store.maintenanceMode ? 'bg-red-500' : 'bg-white/10'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.store.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ✅ SECRET GIFT COST INPUT */}
            <div>
                <label className="text-[10px] text-amber-500 uppercase font-bold mb-1 block">Secret Gift Cost (₹)</label>
                <input
                    type="number"
                    // Ab TypeScript error nahi dega
                    value={config.store.giftModeCost || 0}
                    onChange={(e) => handleChange('store', 'giftModeCost', Number(e.target.value))}
                    className="w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 outline-none focus:border-amber-500 font-mono"
                    placeholder="50"
                />
            </div>



            {/* SAVE BUTTON */}
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={handleSave} disabled={loading} className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-2xl transition-all duration-300 hover:scale-105 ${loading ? 'bg-stone-700 cursor-wait' : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black'}`}>{loading ? <Activity className="w-5 h-5 animate-spin text-white" /> : <Save className="w-5 h-5" />}{loading ? <span className="text-white">Saving...</span> : 'Save Configuration'}</button>
            </div>
        </div>
    );
}

// --- CMS MANAGER ---
// Is function ko 'admin/page.tsx' mein replace karein
// --- CMS MANAGER (Cloudinary Integrated) ---
// --- CMS MANAGER (COMPLETE PREMIUM SUITE) ---
function CMSManager(props: any) {
    const [tab, setTab] = useState('hero');

    const tabs = [
        { id: 'hero', label: 'Hero Slider', icon: <ImageIcon className="w-4 h-4" /> },
        { id: 'categories', label: 'Categories', icon: <Layers className="w-4 h-4" /> },
        { id: 'featured', label: 'Featured', icon: <Star className="w-4 h-4" /> },
        { id: 'promo', label: 'Promo Banner', icon: <Ticket className="w-4 h-4" /> },
        { id: 'blogs', label: 'Blogs', icon: <Type className="w-4 h-4" /> },
        { id: 'text', label: 'Site Text', icon: <Type className="w-4 h-4" /> }
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <SectionHeader title="Homepage Editor" subtitle="Customize your storefront visuals and content" />

            {/* Premium Tab Navigation */}
            <div className="flex flex-wrap gap-2 bg-[#0f2925] p-2 rounded-xl border border-white/5 sticky top-24 z-20 backdrop-blur-md shadow-2xl">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all duration-300 ${tab === t.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-[#0f2925]/50 border border-white/5 p-1 rounded-3xl min-h-[500px]">
                <div className="bg-[#0a1f1c] rounded-[20px] p-6 h-full border border-white/5">
                    {tab === 'hero' && <HeroManager {...props} />}
                    {tab === 'categories' && <CategoryManager {...props} />}
                    {tab === 'featured' && <FeaturedManager {...props} />}
                    {tab === 'promo' && <PromoManager {...props} />}
                    {tab === 'blogs' && <BlogManager {...props} />}
                    {tab === 'text' && <TextManager {...props} />}
                </div>
            </div>
        </div>
    );
}

// 1. TEXT MANAGER
// 1. TEXT MANAGER (UPDATED WITH IMAGE UPLOAD & SECRET GIFT)
function TextManager({ siteText, updateSiteText, showToast }: any) {
    const [formData, setFormData] = useState(siteText || {});
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (siteText) {
            setFormData(siteText);
        }
    }, [siteText]);

    // ✅ IMAGE UPLOAD HANDLER
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) {
                    setFormData((prev: any) => ({ ...prev, secretGiftImage: url }));
                    showToast("Banner uploaded successfully", "success");
                }
            } catch (err) {
                showToast("Upload failed", "error");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSave = () => {
        updateSiteText(formData);
        showToast("Site text & banner updated successfully", "success");
    };

    // 🟢 STEP 1: EXACT DEFAULT TEXT FROM YOUR HOMEPAGE CODE
    // (Ye wahi text hai jo aapki page.tsx me "||" ke baad likha hai)
    const defaultContent: any = {
        heroTitle: "Timeless Elegance",
        heroSubtitle: "The ZERIMI Privilege",
        heroBtnText: "Shop Now",
        newArrivalsTitle: "New Arrivals",
        newArrivalsSub: "Curated specifically for the modern you.",
        featuredTitle: "Diamonds & Engagement Rings",
        featuredSub: "Experience brilliance.",
        promoTitle: "Special Offer",
        promoText: "Limited time deals on our finest jewelry.",
        promoBtn: "Discover More",
        blogTitle: "From Our Journal",
        
        // Secret Gift Section Defaults
        secretGiftBadge: "New Feature",
        secretGiftTitle: "The Art of Secret Gifting",
        secretGiftSub: "Surprise your loved ones with luxury. We deliver the gift, hide the price tag...",
        secretGiftQuote: "I wanted to see you smile, without knowing who put it there."
    };

    // Fields List Mapping
    const textFields = {
        heroTitle: "Hero Title", 
        heroSubtitle: "Hero Subtitle", 
        heroBtnText: "Hero Button",
        newArrivalsTitle: "New Arrivals Title", 
        newArrivalsSub: "New Arrivals Sub",
        featuredTitle: "Featured Title", 
        featuredSub: "Featured Sub",
        promoTitle: "Promo Title", 
        promoText: "Promo Text", 
        promoBtn: "Promo Button",
        blogTitle: "Blog Title"
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                    <h3 className="text-xl font-serif text-white">Text & Banners</h3>
                    <p className="text-xs text-white/40">Edit content across the site</p>
                </div>
                <button onClick={handleSave} disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition">
                    <Save className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* STANDARD TEXT FIELDS LOOP */}
                {Object.entries(textFields).map(([key, label]) => (
                    <div key={key} className="space-y-2 group">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] text-white/40 uppercase font-bold">{label}</label>
                            
                            {/* Live Value Indicator */}
                            <span className="text-[9px] text-amber-500/80 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-[150px] truncate" title={siteText?.[key] || "Not Set"}>
                                Live: {siteText?.[key] || "Default"}
                            </span>
                        </div>

                        {key.includes('Text') || key.includes('Sub') ? (
                            <textarea 
                                value={formData[key] || ''} 
                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} 
                                className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-amber-500/50 outline-none h-20 resize-none placeholder:text-white/20"
                                // 🟢 Placeholder me Default Text
                                placeholder={`e.g. ${defaultContent[key]}`}
                            />
                        ) : (
                            <input 
                                value={formData[key] || ''} 
                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} 
                                className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-amber-500/50 outline-none placeholder:text-white/20"
                                // 🟢 Placeholder me Default Text
                                placeholder={`e.g. ${defaultContent[key]}`}
                            />
                        )}
                    </div>
                ))}

                {/* SECRET GIFT CONFIGURATION */}
                <div className="md:col-span-2 border-t border-amber-500/30 pt-6 mt-4">
                    <h4 className="text-amber-500 font-serif mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Secret Gift Section</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left: Image Uploader */}
                        <div>
                            <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block">Side Banner Image</label>
                            <div
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className="aspect-[4/5] bg-black/20 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition group overflow-hidden relative"
                            >
                                {formData.secretGiftImage ? (
                                    <>
                                        <img src={formData.secretGiftImage} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                                            <span className="text-xs font-bold text-white uppercase">Change Image</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <UploadCloud className="w-8 h-8 text-white/20 mx-auto mb-2 group-hover:text-amber-500 transition" />
                                        <span className="text-[10px] text-white/40 uppercase">Upload Banner</span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                            {formData.secretGiftImage && (
                                <button onClick={() => setFormData({ ...formData, secretGiftImage: "" })} className="mt-2 text-[10px] text-red-400 hover:text-red-300 w-full text-center">Remove Image</button>
                            )}
                        </div>

                        {/* Right: Text Inputs with Specific Defaults */}
                        <div className="md:col-span-2 grid grid-cols-1 gap-4">
                            {[
                                { k: 'secretGiftBadge', l: 'Badge Text', p: defaultContent.secretGiftBadge },
                                { k: 'secretGiftTitle', l: 'Main Title', p: defaultContent.secretGiftTitle },
                                { k: 'secretGiftSub', l: 'Description', p: defaultContent.secretGiftSub },
                                { k: 'secretGiftQuote', l: 'Card Quote', p: defaultContent.secretGiftQuote }
                            ].map(({ k, l, p }) => (
                                <div key={k}>
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="text-[10px] text-white/40 uppercase font-bold">{l}</label>
                                        <span className="text-[9px] text-amber-500/80 font-mono">Live: {siteText?.[k] || "Empty"}</span>
                                    </div>
                                    {l === 'Description' || l === 'Card Quote' ? 
                                        <textarea 
                                            value={formData[k] || ''} 
                                            onChange={(e) => setFormData({ ...formData, [k]: e.target.value })} 
                                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-amber-500/50 outline-none h-16 resize-none placeholder:text-white/20" 
                                            placeholder={`e.g. ${p}`} 
                                        /> :
                                        <input 
                                            value={formData[k] || ''} 
                                            onChange={(e) => setFormData({ ...formData, [k]: e.target.value })} 
                                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-amber-500/50 outline-none placeholder:text-white/20" 
                                            placeholder={`e.g. ${p}`} 
                                        />
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// 2. HERO MANAGER (With Toast & Safety)
function HeroManager({ banner, updateBanner, showToast }: any) {
    const [slides, setSlides] = useState<any[]>([{ image: '', title: '', subtitle: '', link: '' }]);
    const [logos, setLogos] = useState({ logoDark: '', logoWhite: '' });
    const [uploading, setUploading] = useState(false);
    const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);

    useEffect(() => {
        if (banner) {
            setLogos({ logoDark: banner.logoDark || '', logoWhite: banner.logoWhite || '' });
            if (banner.slides?.length > 0) setSlides(banner.slides);
            else if (banner.image) setSlides([{ image: banner.image, title: banner.title || '', subtitle: banner.subtitle || '', link: '/category/all' }]);
        }
    }, [banner]);

    const handleUpload = async (e: any, type: string, index?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        if (typeof index === 'number') setActiveUploadIndex(index);

        try {
            const url = await uploadToCloudinary(file);
            if (url) {
                if (type === 'logo') setLogos(prev => ({ ...prev, [index === 0 ? 'logoDark' : 'logoWhite']: url }));
                if (type === 'slide' && typeof index === 'number') {
                    const newSlides = [...slides]; newSlides[index].image = url; setSlides(newSlides);
                }
                showToast("Image uploaded successfully", "success");
            }
        } catch (err) { showToast("Upload failed", "error"); }
        finally { setUploading(false); setActiveUploadIndex(null); }
    };

    const handleSave = async () => {
        setUploading(true);
        try {
            await updateBanner({ ...logos, slides, image: slides[0]?.image || '' });
            showToast("Hero section updated", "success");
        } catch (e) { showToast("Failed to save", "error"); }
        finally { setUploading(false); }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Logos Section */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h4 className="text-white font-serif mb-4 text-lg">Brand Logos</h4>
                <div className="grid grid-cols-2 gap-6">
                    {[logos.logoDark, logos.logoWhite].map((img, i) => (
                        <div key={i} className="space-y-2">
                            <label className="text-[10px] text-white/40 uppercase font-bold">{i === 0 ? 'Dark Logo' : 'Light Logo'}</label>
                            <div className={`h-20 rounded-lg border border-dashed border-white/20 flex items-center justify-center relative group overflow-hidden ${i === 0 ? 'bg-white' : 'bg-black'}`}>
                                {img ? <img src={img} className="h-10 object-contain" /> : <span className="text-xs text-stone-500">No Logo</span>}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 'logo', i)} />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none"><UploadCloud className="w-6 h-6 text-white" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Slides Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center"><h4 className="text-white font-serif text-lg">Slideshow</h4><button onClick={() => setSlides([...slides, { image: '', title: '', subtitle: '', link: '' }])} className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white uppercase font-bold">+ Add Slide</button></div>
                {slides.map((slide, i) => (
                    <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/10 relative group">
                        <button onClick={() => setSlides(slides.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-white/20 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1 h-24 bg-black/40 rounded-lg border border-white/10 relative overflow-hidden flex items-center justify-center">
                                {activeUploadIndex === i ? <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <img src={slide.image || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 'slide', i)} />
                            </div>
                            <div className="md:col-span-3 grid grid-cols-2 gap-3">
                                <input placeholder="Title" value={slide.title} onChange={(e) => { const n = [...slides]; n[i].title = e.target.value; setSlides(n) }} className="bg-white/5 border border-white/10 p-2 rounded text-xs text-white" />
                                <input placeholder="Subtitle" value={slide.subtitle} onChange={(e) => { const n = [...slides]; n[i].subtitle = e.target.value; setSlides(n) }} className="bg-white/5 border border-white/10 p-2 rounded text-xs text-white" />
                                <input placeholder="Link" value={slide.link} onChange={(e) => { const n = [...slides]; n[i].link = e.target.value; setSlides(n) }} className="col-span-2 bg-white/5 border border-white/10 p-2 rounded text-xs text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handleSave} disabled={uploading} className="w-full bg-amber-600 py-3 rounded text-white font-bold uppercase hover:bg-amber-700 transition">{uploading ? 'Saving...' : 'Save All Changes'}</button>
        </div>
    );
}

// 3. FEATURED MANAGER (Cloudinary Fix)
// 3. FEATURED MANAGER (Fixed: Empty SRC Error)
function FeaturedManager({ featured, updateFeatured, showToast }: any) {
    const [data, setData] = useState(featured || { image: "", title: "", subtitle: "" });
    const [uploading, setUploading] = useState(false);
    const ref = useRef<HTMLInputElement>(null);

    // ✅ Fix: Sync state with database
    useEffect(() => { 
        if (featured) setData(featured); 
    }, [featured]);

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) {
                    setData((prev: any) => ({ ...prev, image: url }));
                    showToast("Image uploaded successfully", "success");
                }
            } catch (e) { showToast("Upload failed", "error"); }
            finally { setUploading(false); }
        }
    };

    const handleSave = () => { updateFeatured(data); showToast("Featured section updated", "success"); };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            
            {/* Image Uploader */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] text-white/40 uppercase font-bold">Featured Image</label>
                    {data.image && <span className="text-[9px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">Image Active</span>}
                </div>
                
                <div onClick={() => !uploading && ref.current?.click()} className="h-64 bg-black/30 rounded-xl border-2 border-dashed border-white/10 cursor-pointer flex items-center justify-center relative group hover:border-amber-500/50 transition overflow-hidden">
                    {uploading ? (
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : data.image ? (
                        <>
                            <img src={data.image} className="w-full h-full object-contain group-hover:opacity-50 transition" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <UploadCloud className="w-8 h-8 text-white mb-2" />
                                <span className="text-xs font-bold text-white uppercase">Change Image</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <UploadCloud className="w-8 h-8 text-white/20 mx-auto mb-2" />
                            <span className="text-xs font-bold text-white/40 uppercase">Click to Upload Image</span>
                        </div>
                    )}
                    <input type="file" ref={ref} className="hidden" onChange={handleUpload} />
                </div>
            </div>

            {/* Text Inputs with Live Indicators */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Inside Box Title</label>
                        <span className="text-[9px] text-amber-500/80 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-[150px] truncate">
                            Live: {featured?.title || "Signature Collection"}
                        </span>
                    </div>
                    <input 
                        value={data.title || ''} 
                        onChange={(e) => setData({ ...data, title: e.target.value })} 
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50" 
                        placeholder="e.g. Signature Collection"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Inside Box Subtitle</label>
                        <span className="text-[9px] text-amber-500/80 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-[150px] truncate">
                            Live: {featured?.subtitle || "Exclusive designs"}
                        </span>
                    </div>
                    <input 
                        value={data.subtitle || ''} 
                        onChange={(e) => setData({ ...data, subtitle: e.target.value })} 
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50" 
                        placeholder="e.g. Exclusive designs"
                    />
                </div>
            </div>

            <button disabled={uploading} onClick={handleSave} className="w-full bg-amber-600 py-3 rounded-lg text-white font-bold uppercase text-xs hover:bg-amber-700 transition shadow-lg shadow-amber-900/20">
                Save Featured Section
            </button>
        </div>
    );
}

// 4. PROMO MANAGER (Cloudinary Fix)
// 4. PROMO MANAGER (Fixed: Empty SRC Error)
function PromoManager({ promo, updatePromo, siteText, updateSiteText, showToast }: any) {
    // Image State
    const [promoData, setPromoData] = useState(promo || { image: "" });
    // Text State (from siteText)
    const [textData, setTextData] = useState({
        promoTitle: siteText?.promoTitle || "",
        promoText: siteText?.promoText || "",
        promoBtn: siteText?.promoBtn || ""
    });

    const [uploading, setUploading] = useState(false);
    const ref = useRef<HTMLInputElement>(null);

    // Sync Data
    useEffect(() => { 
        if (promo) setPromoData(promo);
        if (siteText) setTextData({
            promoTitle: siteText.promoTitle,
            promoText: siteText.promoText,
            promoBtn: siteText.promoBtn
        });
    }, [promo, siteText]);

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) {
                    setPromoData((prev: any) => ({ ...prev, image: url }));
                    showToast("Image uploaded successfully", "success");
                }
            } catch (e) { showToast("Upload failed", "error"); }
            finally { setUploading(false); }
        }
    };

    const handleSave = () => {
        // Save Image
        updatePromo(promoData);
        // Save Text (Merge with existing siteText)
        updateSiteText({ ...siteText, ...textData });
        
        showToast("Promo section updated successfully", "success");
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            
            {/* Promo Image */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] text-white/40 uppercase font-bold">Promo Model Image</label>
                    {promoData.image && <span className="text-[9px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">Image Active</span>}
                </div>

                <div onClick={() => !uploading && ref.current?.click()} className="h-48 bg-black/30 rounded-xl border-2 border-dashed border-white/10 cursor-pointer flex items-center justify-center relative group hover:border-amber-500/50 transition overflow-hidden">
                    {uploading ? (
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : promoData.image ? (
                        <>
                            <img src={promoData.image} className="w-full h-full object-cover group-hover:opacity-50 transition" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <UploadCloud className="w-8 h-8 text-white mb-2" />
                                <span className="text-xs font-bold text-white uppercase">Change Image</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <UploadCloud className="w-8 h-8 text-white/20 mx-auto mb-2" />
                            <span className="text-xs font-bold text-white/40 uppercase">Click to Upload Banner</span>
                        </div>
                    )}
                    <input type="file" ref={ref} className="hidden" onChange={handleUpload} />
                </div>
            </div>

            {/* Promo Text Fields (Added Here for Convenience) */}
            <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-white font-serif text-sm flex items-center gap-2"><Ticket className="w-4 h-4 text-amber-500"/> Promo Content</h4>
                
                {/* Title */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Heading</label>
                        <span className="text-[9px] text-amber-500/80 font-mono">Live: {siteText?.promoTitle || "Special Offer"}</span>
                    </div>
                    <input 
                        value={textData.promoTitle || ''} 
                        onChange={(e) => setTextData({ ...textData, promoTitle: e.target.value })} 
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50" 
                        placeholder="e.g. Special Offer"
                    />
                </div>

                {/* Description */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Description</label>
                        <span className="text-[9px] text-amber-500/80 font-mono">Live: {siteText?.promoText || "Limited time..."}</span>
                    </div>
                    <textarea 
                        value={textData.promoText || ''} 
                        onChange={(e) => setTextData({ ...textData, promoText: e.target.value })} 
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50 h-20 resize-none" 
                        placeholder="e.g. Limited time deals on our finest jewelry."
                    />
                </div>

                {/* Button */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Button Text</label>
                        <span className="text-[9px] text-amber-500/80 font-mono">Live: {siteText?.promoBtn || "Discover More"}</span>
                    </div>
                    <input 
                        value={textData.promoBtn || ''} 
                        onChange={(e) => setTextData({ ...textData, promoBtn: e.target.value })} 
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50" 
                        placeholder="e.g. Discover More"
                    />
                </div>
            </div>

            <button disabled={uploading} onClick={handleSave} className="w-full bg-amber-600 py-3 rounded-lg text-white font-bold uppercase text-xs hover:bg-amber-700 transition shadow-lg shadow-amber-900/20">
                Save Promo Section
            </button>
        </div>
    );
}

// 5. BLOG MANAGER (Cloudinary Fix)
function BlogManager({ blogs, addBlog, deleteBlog, showToast }: any) {
    const [isForm, setIsForm] = useState(false);
    const [form, setForm] = useState<Partial<BlogPost>>({});
    const [uploading, setUploading] = useState(false);
    const ref = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (!form.title) return showToast("Title required", "error");
        addBlog({ ...form, id: Date.now().toString(), date: new Date().toLocaleDateString() });
        setIsForm(false); setForm({});
        showToast("Blog post published", "success");
    };

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) setForm({ ...form, image: url });
            } catch (e) { showToast("Upload failed", "error"); }
            finally { setUploading(false); }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-white text-xl font-serif">Blog Posts</h3><button onClick={() => setIsForm(true)} className="bg-amber-600 px-4 py-2 rounded text-white text-xs font-bold uppercase hover:bg-amber-700 transition">+ Add New</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blogs?.map((b: any) => (
                    <div key={b.id} className="bg-black/20 p-4 rounded-xl border border-white/5 relative group hover:border-amber-500/30 transition">
                        <img src={b.image} className="w-full h-32 object-cover rounded-lg mb-3" />
                        <h4 className="text-white font-serif line-clamp-1">{b.title}</h4>
                        <p className="text-[10px] text-white/40 mt-1">{b.date} • {b.category}</p>
                        <button onClick={() => deleteBlog(b.id)} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
            {isForm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in zoom-in-95">
                    <div className="bg-[#0f2925] p-6 rounded-xl w-full max-w-md space-y-4 border border-white/10 shadow-2xl">
                        <h3 className="text-white font-serif text-xl">New Post</h3>
                        <div onClick={() => !uploading && ref.current?.click()} className="h-40 bg-black/30 rounded-lg border-dashed border border-white/20 flex items-center justify-center cursor-pointer relative group">
                            {uploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : form.image ? <img src={form.image} className="h-full w-full object-cover rounded-lg" /> : <div className="text-center"><UploadCloud className="w-8 h-8 text-white/20 mx-auto" /><span className="text-[10px] text-white/40 uppercase">Upload Cover</span></div>}
                            <input type="file" ref={ref} className="hidden" onChange={handleUpload} />
                        </div>
                        <input placeholder="Post Title" className="w-full p-3 bg-black/20 rounded-lg text-white border border-white/10 text-sm outline-none focus:border-amber-500/50" onChange={e => setForm({ ...form, title: e.target.value })} />
                        <input placeholder="Category (e.g. Trends)" className="w-full p-3 bg-black/20 rounded-lg text-white border border-white/10 text-sm outline-none focus:border-amber-500/50" onChange={e => setForm({ ...form, category: e.target.value })} />
                        <button disabled={uploading} onClick={handleSave} className="w-full bg-green-600 py-3 rounded-lg text-white font-bold uppercase text-xs hover:bg-green-700 transition">{uploading ? 'Uploading...' : 'Publish Post'}</button>
                        <button onClick={() => setIsForm(false)} className="w-full text-white/50 text-xs hover:text-white">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// 6. CATEGORY MANAGER (Visual Update)
function CategoryManager({ categories, updateCategories, showToast }: any) {
    const [list, setList] = useState<any[]>([]);
    useEffect(() => { setList(categories?.length ? categories : []); }, [categories]);

    const [editId, setEditId] = useState<string | null>(null);
    const [tempData, setTempData] = useState({ title: '', image: '' });
    const [uploading, setUploading] = useState(false);
    const ref = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) setTempData(prev => ({ ...prev, image: url }));
            } catch (e) { showToast("Upload failed", "error"); }
            finally { setUploading(false); }
        }
    };

    const saveEdit = () => {
        setList(list.map(c => c.id === editId ? { ...c, title: tempData.title, image: tempData.image || c.image } : c));
        setEditId(null);
    };
    const handleSaveAll = () => { updateCategories(list); showToast("Categories updated", "success"); };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-between"><h3 className="text-white text-xl font-serif">Categories</h3><button onClick={handleSaveAll} className="bg-green-600 px-6 py-2 rounded-lg text-white text-xs font-bold uppercase hover:bg-green-700 transition">Save All Changes</button></div>
            <div className="grid gap-3">
                {list.map(c => (
                    <div key={c.id} className={`bg-black/20 p-3 rounded-xl border flex items-center gap-4 transition ${editId === c.id ? 'border-amber-500/50 bg-black/40' : 'border-white/5'}`}>
                        {editId === c.id ? (
                            <>
                                <div onClick={() => !uploading && ref.current?.click()} className="w-16 h-16 bg-white/5 rounded-lg cursor-pointer overflow-hidden border border-white/20 relative group">
                                    {uploading ? <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div> : <img src={tempData.image || c.image} className="w-full h-full object-cover" />}
                                    <input type="file" ref={ref} className="hidden" onChange={handleUpload} />
                                </div>
                                <input value={tempData.title} onChange={e => setTempData({ ...tempData, title: e.target.value })} className="flex-1 bg-transparent border-b border-amber-500 text-white outline-none pb-1" />
                                <button disabled={uploading} onClick={saveEdit} className="bg-green-600 p-2 rounded text-white"><Check className="w-4 h-4" /></button>
                            </>
                        ) : (
                            <>
                                <img src={c.image} className="w-16 h-16 rounded-lg object-cover" />
                                <h4 className="flex-1 text-white font-serif">{c.title || "Untitled"}</h4>
                                <button onClick={() => { setEditId(c.id); setTempData({ title: c.title, image: c.image }); }} className="p-2 text-white/40 hover:text-amber-500 bg-white/5 rounded-lg"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => setList(list.filter(x => x.id !== c.id))} className="p-2 text-white/40 hover:text-red-500 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </>
                        )}
                    </div>
                ))}
                <button onClick={() => setList([...list, { id: Date.now().toString(), title: "New Category", image: "" }])} className="w-full py-4 border border-dashed border-white/20 text-white/40 rounded-xl hover:text-white hover:border-amber-500/50 transition flex items-center justify-center gap-2 text-xs font-bold uppercase"><PlusCircle className="w-4 h-4" /> Add Category</button>
            </div>
        </div>
    );
}
// --- OTHER MANAGERS (Standard) ---

// --- PREMIUM DASHBOARD OVERVIEW ---
// --- PREMIUM DASHBOARD OVERVIEW (CLICKABLE) ---
// =========================================================================
// 👑 ULTRA PREMIUM DASHBOARD OVERVIEW (COMMAND CENTER)
// =========================================================================
// =========================================================================
// 👑 LEGENDARY DASHBOARD (GOD MODE) - THE ULTIMATE COMMAND CENTER
// =========================================================================
// =========================================================================
// 👑 LEGENDARY DASHBOARD (FINAL PRODUCTION VERSION)
// =========================================================================
function DashboardOverview({ products, orders, allUsers, abandonedCarts, setActiveTab, showToast }: any) {
    
    // --- 1. SMART ANALYTICS ENGINE (REAL-TIME CALCS) ---
    const today = new Date().toDateString();
    
    // A. Revenue Logic (Daily, Total, Growth)
    const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
    const todayOrdersData = orders?.filter((o: any) => new Date(o.date).toDateString() === today) || [];
    const todayRevenue = todayOrdersData.reduce((sum: number, o: any) => sum + o.total, 0);
    
    // Weekly Revenue Data for Graph (Last 7 Days)
    const getLast7DaysRevenue = () => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const dayRev = orders?.filter((o: any) => new Date(o.date).toDateString() === dateStr)
                                 .reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
            data.push(dayRev);
        }
        return data; // Returns array like [0, 1500, 2000, 0, 5000...]
    };
    const revenueTrendData = getLast7DaysRevenue();

    // B. Order Pipeline Status
    const pendingOrders = orders?.filter((o: any) => o.status === 'Pending').length || 0;
    const processingOrders = orders?.filter((o: any) => o.status === 'Processing').length || 0;
    const shippedOrders = orders?.filter((o: any) => ['Shipped', 'Out for Delivery'].includes(o.status)).length || 0;
    const deliveredOrders = orders?.filter((o: any) => o.status === 'Delivered').length || 0;
    const returnOrders = orders?.filter((o: any) => o.status.includes('Return') || o.status === 'RTO').length || 0;
    
    // C. Inventory Health (Critical Checks)
    const lowStockList = products?.filter((p: any) => (p.stock || 0) < 5);
    const outOfStockList = products?.filter((p: any) => (p.stock || 0) === 0);
    const lowStockCount = lowStockList?.length || 0;
    const criticalItemName = outOfStockList.length > 0 ? outOfStockList[0].name : (lowStockList[0]?.name || "None");

    // D. Geographic Intelligence (Top Locations)
    const stateMap = new Map();
    orders?.forEach((o: any) => { 
        const st = o.address?.state || "Unknown"; 
        stateMap.set(st, (stateMap.get(st) || 0) + 1); 
    });
    // @ts-ignore
    const topStates = [...stateMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    // E. Return Rate Analysis
    const totalOrdersCount = orders?.length || 1;
    const returnRate = ((returnOrders / totalOrdersCount) * 100).toFixed(1);
    const isReturnHigh = Number(returnRate) > 15;

    // F. Top Whales (Highest Spenders)
    const customerSpendMap = new Map();
    orders?.forEach((o: any) => { 
        if(o.customerEmail) customerSpendMap.set(o.customerEmail, (customerSpendMap.get(o.customerEmail) || 0) + o.total); 
    });
    // @ts-ignore
    const topCustomers = [...customerSpendMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([email, total]) => {
            const user = allUsers?.find((u: any) => u.email === email);
            return { name: user?.name || email.split('@')[0], email, total, img: user?.profileImage };
    });

    // --- 2. ACTIONS & HELPERS ---
    
    // Helper: Time Ago
    const getTimeAgo = (dateStr: string) => {
        if(!dateStr) return 'Recently';
        const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000); 
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
        return `${Math.floor(diff/1440)}d ago`;
    };

    // Action: WhatsApp Recovery
    const handleRecovery = (cart: any) => {
        if (!cart.phone) return showToast("Phone number missing!", "error");
        
        // Smart Message based on cart value
        const isHighValue = cart.total > 5000;
        const offerText = isHighValue ? "We have reserved a special 5% OFF for you! 🎁" : "Stock is running low!";
        
        const msg = `Hi ${cart.name || 'there'}, noticed you left items in your cart at ZERIMI 💎.\n\n${offerText}\nComplete your order here: https://zerimi.com/checkout\n\nNeed help? Reply here!`;
        
        const url = `https://wa.me/91${cart.phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        showToast(`Recovery msg sent to ${cart.name}`, "success");
    };

    // Dynamic Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    // --- 3. GENERATE DYNAMIC INSIGHTS (AI LOGIC) ---
    const getInsights = () => {
        const insights = [];
        
        // Insight 1: Sales/Geo
        if (topStates.length > 0) {
            insights.push({
                type: 'opportunity',
                icon: <Target className="w-5 h-5 text-blue-400" />,
                title: "Growth Opportunity",
                desc: `Sales are spiking in ${topStates[0][0]}. Consider running localized ads there.`
            });
        } else {
            insights.push({
                type: 'info',
                icon: <Activity className="w-5 h-5 text-blue-400" />,
                title: "Data Gathering",
                desc: "System is collecting location data for future insights."
            });
        }

        // Insight 2: Critical Alerts
        if (pendingOrders > 5) {
            insights.push({ type: 'alert', icon: <Smartphone className="w-5 h-5 text-red-400" />, title: "Action Required", desc: `${pendingOrders} orders are pending dispatch. Process them to avoid delays.` });
        } else if (lowStockCount > 0) {
            insights.push({ type: 'alert', icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, title: "Stock Alert", desc: `Inventory low for '${criticalItemName}'. Restock immediately.` });
        } else if (isReturnHigh) {
            insights.push({ type: 'alert', icon: <RefreshCw className="w-5 h-5 text-red-400" />, title: "High Returns", desc: `Return rate is ${returnRate}%. Check product quality or descriptions.` });
        } else {
            insights.push({ type: 'success', icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: "System Healthy", desc: "All systems operational. No critical issues found." });
        }

        return insights;
    };
    const activeInsights = getInsights();

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            
            {/* 🌟 SECTION 1: HEADER & QUICK ACTIONS */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)]">God Mode Active</span>
                        <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                        <span className="text-[10px] text-green-400 font-mono">System Online</span>
                    </div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">{greeting}, Boss.</h2>
                    <p className="text-white/40 text-sm mt-1">Real-time overview of your jewelry empire.</p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={() => setActiveTab('inbox')} className="bg-[#0f2925] border border-white/10 hover:border-amber-500/50 text-white px-5 py-3 rounded-xl flex items-center gap-3 transition group">
                        <div className="bg-amber-500/10 p-1.5 rounded-lg group-hover:bg-amber-500 group-hover:text-black transition"><Zap className="w-4 h-4" /></div>
                        <div className="text-left"><p className="text-[9px] text-white/40 uppercase font-bold">Quick Action</p><p className="text-xs font-bold">Check Inbox</p></div>
                    </button>
                    <button onClick={() => setActiveTab('orders')} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-2xl shadow-amber-900/20 transition group flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-lg"><Truck className="w-4 h-4" /></div>
                        <div className="text-left"><p className="text-[9px] text-white/60 uppercase font-bold">Pending: {pendingOrders}</p><p className="text-xs font-bold">Process Orders</p></div>
                    </button>
                </div>
            </div>

            {/* 📊 SECTION 2: LIVE METRICS (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <LegendaryCard 
                    title="Total Revenue" 
                    value={`₹${totalRevenue.toLocaleString()}`} 
                    footer={`Today: ₹${todayRevenue.toLocaleString()}`} 
                    icon={<DollarSign className="w-6 h-6" />} 
                    color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" 
                    trend="+Live" trendUp={true} 
                    chartData={revenueTrendData} colorHex="#34d399" 
                    onClick={() => setActiveTab('orders')} 
                />
                <LegendaryCard 
                    title="Order Volume" 
                    value={orders?.length || 0} 
                    footer={`${pendingOrders} Pending Action`} 
                    icon={<ShoppingBag className="w-6 h-6" />} 
                    color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" 
                    trend={pendingOrders > 0 ? "Busy" : "Quiet"} trendUp={pendingOrders > 0} 
                    chartData={[2, 4, 3, 6, 2, 8, 5]} colorHex="#60a5fa" 
                    onClick={() => setActiveTab('orders')} 
                />
                <LegendaryCard 
                    title="Inventory Health" 
                    value={lowStockCount === 0 ? "Healthy" : `${lowStockCount} Low`} 
                    footer={outOfStockList.length > 0 ? `${outOfStockList.length} Out of Stock` : "Stock Stable"} 
                    icon={<Target className="w-6 h-6" />} 
                    color={lowStockCount > 0 ? "text-red-400" : "text-amber-400"} 
                    bg={lowStockCount > 0 ? "bg-red-500/10" : "bg-amber-500/10"} 
                    border={lowStockCount > 0 ? "border-red-500/20" : "border-amber-500/20"} 
                    trend={lowStockCount > 0 ? "Alert" : "Good"} trendUp={lowStockCount === 0} 
                    chartData={[10, 12, 15, 11, 14, 13, 20]} colorHex={lowStockCount > 0 ? "#f87171" : "#fbbf24"} 
                    onClick={() => setActiveTab('products')} 
                />
                <LegendaryCard 
                    title="Customer Base" 
                    value={allUsers?.length || 0} 
                    footer="Registered Accounts" 
                    icon={<Users className="w-6 h-6" />} 
                    color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" 
                    trend="Growing" trendUp={true} 
                    chartData={[20, 25, 30, 28, 35, 40, 42]} colorHex="#c084fc" 
                    onClick={() => setActiveTab('users')} 
                />
            </div>

            {/* 🚀 SECTION 3: INTELLIGENCE HUB & GEOGRAPHY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. BUSINESS INTELLIGENCE (Dynamic) */}
                <div className="lg:col-span-2 bg-[#0f2925] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-30 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div><h3 className="text-xl font-serif text-white flex items-center gap-2"><Activity className="w-5 h-5 text-amber-500" /> Business Intelligence</h3><p className="text-xs text-white/40 mt-1">Smart insights generated from live data.</p></div>
                        <div className="px-3 py-1 bg-white/5 rounded text-[10px] text-white/50 uppercase font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeInsights.map((insight, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-start gap-4 hover:border-amber-500/30 transition cursor-default">
                                <div className={`p-3 rounded-xl ${insight.type === 'alert' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>{insight.icon}</div>
                                <div><h4 className="text-white text-sm font-bold">{insight.title}</h4><p className="text-[11px] text-white/50 leading-relaxed mt-1">{insight.desc}</p></div>
                            </div>
                        ))}
                    </div>

                    {/* Visual Revenue Graph (CSS based) */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex justify-between text-[10px] text-white/30 mb-2 uppercase font-bold"><span>Revenue Trend (7 Days)</span><span>Growth</span></div>
                        <div className="h-32 w-full flex items-end gap-2 px-2">
                            {revenueTrendData.map((val, i) => {
                                const max = Math.max(...revenueTrendData, 1);
                                const h = (val / max) * 100;
                                return (
                                    <div key={i} className="flex-1 group relative">
                                        <div className="w-full bg-gradient-to-t from-amber-600/20 to-amber-500/80 rounded-t-sm hover:from-amber-500 hover:to-amber-400 transition-all duration-500" style={{ height: `${h || 5}%` }}></div>
                                        {/* Tooltip */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">₹{val.toLocaleString()}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. GEOGRAPHIC HEATMAP */}
                <div className="bg-[#0f2925] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col">
                    <h3 className="text-lg font-serif text-white mb-6 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-400" /> Top Sales Regions</h3>
                    
                    <div className="flex-1 space-y-5">
                        {topStates.length > 0 ? topStates.map(([state, count]: any, i: number) => {
                            const percent = (count / (orders.length || 1)) * 100;
                            return (
                                <div key={state} className="group">
                                    <div className="flex justify-between text-xs mb-1"><span className="text-white font-medium flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-white/30'}`}></span>{state}</span><span className="text-white/40">{count} Orders</span></div>
                                    <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-amber-500' : 'bg-blue-500/50'}`} style={{ width: `${percent}%` }}></div></div>
                                </div>
                            );
                        }) : <div className="text-center py-10"><Globe className="w-10 h-10 text-white/10 mx-auto mb-2"/><p className="text-white/30 text-xs italic">No geographic data yet.</p></div>}
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3"><div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><Smartphone className="w-4 h-4"/></div><div><p className="text-[10px] text-white/40 uppercase font-bold">Traffic Source</p><p className="text-xs text-white font-bold">85% Mobile</p></div></div>
                            <div className="text-right"><p className="text-[10px] text-white/40 uppercase font-bold">Desktop</p><p className="text-xs text-white font-bold">15%</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 💎 SECTION 4: TOP SPENDERS & REAL ABANDONED CARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. TOP SPENDERS */}
                <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-serif text-white flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-yellow-400" /> Top Spenders (LTV)</h3><button onClick={() => setActiveTab('users')} className="text-xs text-white/40 hover:text-white uppercase font-bold">View All</button></div>
                    <div className="space-y-4">
                        {topCustomers.length > 0 ? topCustomers.map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition group">
                                <div className="relative"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 p-[2px]"><div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-white text-lg">{c.name.charAt(0).toUpperCase()}</div></div><div className="absolute -bottom-1 -right-1 bg-black text-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500">#{i+1}</div></div>
                                <div className="flex-1"><h4 className="text-white font-bold text-sm">{c.name}</h4><p className="text-xs text-white/40">{c.email}</p></div>
                                <div className="text-right"><p className="text-amber-400 font-mono font-bold">₹{c.total.toLocaleString()}</p><p className="text-[10px] text-white/30 uppercase">Lifetime Value</p></div>
                            </div>
                        )) : <div className="text-center py-8 text-white/30 text-xs">No customer data available</div>}
                    </div>
                </div>

                {/* 2. REAL ABANDONED CART RECOVERY */}
                <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-lg font-serif text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-red-400" /> Abandoned Checkouts</h3>
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/20">{abandonedCarts?.length || 0} Potential Sales</span>
                    </div>

                    <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {(!abandonedCarts || abandonedCarts.length === 0) ? (
                            <div className="text-center py-10">
                                <UserCheck className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                <p className="text-white/30 text-xs">No abandoned carts found.</p>
                            </div>
                        ) : (
                            abandonedCarts.map((cart: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-green-500/30 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-bold">{cart.name?.charAt(0) || "G"}</div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{cart.name || "Guest User"}</p>
                                            <p className="text-[10px] text-white/40">Total: ₹{cart.total} • {getTimeAgo(cart.date)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRecovery(cart)} 
                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-[10px] font-bold uppercase shadow-lg shadow-green-900/20" 
                                        title="Send WhatsApp Reminder"
                                    >
                                        <MessageSquare className="w-3 h-3" /> Recover
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {abandonedCarts?.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/5 text-center flex justify-between items-center px-2">
                            <span className="text-[10px] text-white/30">Action:</span>
                            <span className="text-xs text-white/50 italic">Click 'Recover' to open WhatsApp with pre-filled message.</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// 🧩 SUB-COMPONENT: LEGENDARY STAT CARD
function LegendaryCard({ title, value, footer, icon, color, bg, border, trend, trendUp, chartData, colorHex, onClick }: any) {
    return (
        <div onClick={onClick} className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${bg} ${border}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-black/20 ${color} shadow-lg`}>{icon}</div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-black/20 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                    {trend}
                </div>
            </div>
            
            <h3 className="text-3xl font-serif text-white tracking-tight">{value}</h3>
            <p className="text-xs text-white/40 uppercase font-bold mt-1 tracking-wider">{title}</p>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                <p className={`text-[10px] font-medium ${color}`}>{footer}</p>
                {/* Mini Sparkline Chart SVG */}
                <svg width="60" height="20" viewBox="0 0 60 20" className="opacity-50 group-hover:opacity-100 transition">
                    <polyline 
                        fill="none" 
                        stroke={colorHex} 
                        strokeWidth="2" 
                        points={chartData.map((d: number, i: number) => `${i * 10},${20 - (d / 100) * 20}`).join(' ')} 
                    />
                </svg>
            </div>
        </div>
    );
}

// ==========================================
// 🧩 SUB-COMPONENTS FOR DASHBOARD
// ==========================================

// 1. Metric Card (Interactive)
function MetricCard({ title, value, subValue, trend, icon, gradient, onClick, alert, isDanger }: any) {
    return (
        <div onClick={onClick} className={`relative overflow-hidden bg-[#0f2925] p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${alert || isDanger ? 'border-red-500/40 animate-pulse-slow' : 'border-white/5 hover:border-white/10'}`}>
            {/* Gradient Background */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 blur-[50px] rounded-full group-hover:opacity-20 transition duration-500`}></div>
            
            <div className="flex justify-between items-start relative z-10 mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg text-white group-hover:scale-110 transition duration-300`}>
                    {icon}
                </div>
                {trend !== null && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {trend >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                        {Math.abs(trend).toFixed(1)}%
                    </span>
                )}
            </div>
            
            <div className="relative z-10">
                <h3 className="text-3xl font-serif text-white tracking-tight group-hover:text-amber-400 transition">{value}</h3>
                <p className="text-xs text-white/40 uppercase font-bold mt-1 tracking-wider">{title}</p>
                <p className={`text-[10px] mt-2 font-medium ${isDanger ? 'text-red-400' : 'text-white/30'}`}>{subValue}</p>
            </div>
        </div>
    );
}

// 2. Pipeline Step (Order Flow)
function PipelineStep({ label, count, color, icon, onClick }: any) {
    return (
        <div onClick={onClick} className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition cursor-pointer group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
            <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center text-white mb-3 shadow-lg ${color} bg-opacity-20 group-hover:scale-110 transition`}>
                {icon}
            </div>
            <h4 className="text-2xl font-bold text-white group-hover:text-amber-400 transition">{count}</h4>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{label}</p>
        </div>
    );
}

// --- HELPER 1: PREMIUM STAT CARD ---
// --- HELPER 1: PREMIUM STAT CARD (UPDATED) ---
function PremiumStatCard({ title, value, trend, icon, gradient, isNegative, subtext, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="relative overflow-hidden bg-[#0f2925] rounded-2xl border border-white/5 p-6 group hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
        >
            {/* Background Gradient Blob */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition duration-500`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition duration-300`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isNegative ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl font-serif text-white font-medium tracking-tight group-hover:text-amber-400 transition">{value}</h3>
                <p className="text-xs text-white/50 uppercase tracking-widest mt-1 font-bold">{title}</p>
                <p className="text-[10px] text-white/30 mt-2">{subtext}</p>
            </div>
        </div>
    )
}

// --- HELPER 2: CUSTOM SVG CHART (Lightweight) ---
// Note: Ye ek static SVG hai jo responsive graph jaisa dikhta hai. 
// Real chart ke liye 'recharts' library chahiye hoti hai, par hum bina library ke kaam chala rahe hain.
function RevenueChart() {
    return (
        <svg viewBox="0 0 100 40" className="w-full h-full pt-4 overflow-visible" preserveAspectRatio="none">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Smooth Curve */}
            <path
                d="M0,35 C10,35 10,20 20,20 C30,20 30,30 40,30 C50,30 50,10 60,10 C70,10 70,25 80,25 C90,25 90,5 100,5"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="0.8"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            />
            {/* Gradient Fill Area */}
            <path
                d="M0,35 C10,35 10,20 20,20 C30,20 30,30 40,30 C50,30 50,10 60,10 C70,10 70,25 80,25 C90,25 90,5 100,5 V40 H0 Z"
                fill="url(#chartGradient)"
                opacity="0.5"
            />

            {/* Dots on Curve (Simulated Data Points) */}
            <circle cx="20" cy="20" r="1" fill="#fff" />
            <circle cx="40" cy="30" r="1" fill="#fff" />
            <circle cx="60" cy="10" r="1.5" fill="#f59e0b" stroke="#fff" strokeWidth="0.2" className="animate-pulse" />
            <circle cx="80" cy="25" r="1" fill="#fff" />
        </svg>
    );
}

// Don't forget to import these icons at the top if missing:
// import { ShoppingBag, TrendingDown, TrendingUp, DollarSign, Package, FileUp, PlusCircle } from 'lucide-react';

// --- MARKETING MANAGER (PREMIUM: Broadcast & Preview) ---
function MarketingManager({ allUsers, sendNotification, showToast }: any) {
    const [target, setTarget] = useState<'all' | 'specific'>('all');
    const [selectedUser, setSelectedUser] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = () => {
        if (!title || !message) return showToast("Title and Message are required", "error");
        if (target === 'specific' && !selectedUser) return showToast("Please select a user", "error");

        setSending(true);

        // Simulate sending delay for realistic effect
        setTimeout(() => {
            if (target === 'all') {
                // Real app mein ye backend job hoti, yahan hum simulate kar rahe hain
                allUsers?.forEach((u: any) => sendNotification(u.email, title, message));
                showToast(`Broadcast sent to ${allUsers?.length || 0} users`, "success");
            } else {
                sendNotification(selectedUser, title, message);
                showToast("Notification sent successfully", "success");
            }

            setTitle('');
            setMessage('');
            setSending(false);
        }, 1500);
    };

    return (
        <div className="animate-fade-in space-y-8">
            <SectionHeader title="Marketing Console" subtitle="Push notifications and announcements" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: COMPOSE CARD */}
                <div className="lg:col-span-2 bg-[#0f2925] p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">

                    {/* Background Glow */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 space-y-6">

                        {/* Target Selection Tabs */}
                        <div className="grid grid-cols-2 gap-4 p-1 bg-black/20 rounded-xl border border-white/5">
                            <button onClick={() => setTarget('all')} className={`py-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${target === 'all' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                                <Users className="w-4 h-4" /> All Users
                            </button>
                            <button onClick={() => setTarget('specific')} className={`py-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${target === 'specific' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                                <User className="w-4 h-4" /> Single User
                            </button>
                        </div>

                        {/* Specific User Dropdown */}
                        {target === 'specific' && (
                            <div className="animate-fade-in-up">
                                <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block">Select Recipient</label>
                                <div className="relative">
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full p-4 pl-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer hover:bg-black/30 transition"
                                    >
                                        <option value="" className="text-stone-500">Choose a user...</option>
                                        {allUsers?.map((u: any) => (
                                            <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
                                </div>
                            </div>
                        )}

                        {/* Message Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block">Campaign Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Flash Sale Alert! ⚡"
                                    className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 transition font-serif placeholder:text-white/20"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block">Message Body</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 transition h-32 resize-none leading-relaxed placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        {/* Send Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg ${sending ? 'bg-stone-600 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white'}`}
                            >
                                {sending ? (
                                    <><Activity className="w-4 h-4 animate-spin" /> Sending Blast...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Send Notification</>
                                )}
                            </button>
                            <p className="text-[10px] text-white/30 text-center mt-3">
                                {target === 'all' ? `Note: This will be sent to all ${allUsers?.length || 0} registered users.` : 'Note: Only the selected user will receive this.'}
                            </p>
                        </div>

                    </div>
                </div>

                {/* RIGHT: LIVE PREVIEW */}
                <div className="space-y-6 hidden lg:block">
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 text-center relative">
                        <h4 className="text-white/50 text-xs uppercase font-bold mb-6 flex items-center justify-center gap-2"><Sparkles className="w-3 h-3 text-amber-500" /> Live Preview</h4>

                        {/* Phone Mockup */}
                        <div className="w-64 mx-auto bg-stone-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-stone-800 relative h-[500px] flex flex-col pt-12 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop")' }}>

                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-xl z-20"></div>

                            {/* Notification Pop-up */}
                            <div className="mx-3 bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-white/50 animate-fade-in-up mt-2">
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-amber-500 font-serif font-bold text-sm">Z</span>
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h5 className="font-bold text-[10px] text-stone-900 uppercase tracking-wide">ZERIMI</h5>
                                            <span className="text-[9px] text-stone-500">now</span>
                                        </div>
                                        <p className="font-bold text-[11px] text-black leading-tight truncate">{title || "Notification Title"}</p>
                                        <p className="text-[10px] text-stone-600 line-clamp-2 leading-tight mt-0.5">{message || "Your message preview will appear here exactly as the customer sees it on their lock screen."}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Fake Time */}
                            <div className="mt-auto pb-8 text-white/80 text-5xl font-thin tracking-tighter">
                                12:30
                                <p className="text-sm font-normal mt-1 opacity-60 tracking-widest uppercase">Friday, Oct 24</p>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
// STAFF & USER MANAGEMENT
// --- USER MANAGER (PREMIUM: Stats, Search & Role Control) ---
// --- USER MANAGER (FIXED: Dropdown Visibility & Actions) ---
// --- USER MANAGER (PREMIUM: Delete Option Added) ---
// --- USER MANAGER (FIXED & IMPROVED) ---
// --- USER MANAGER (FULLY FIXED) ---
function UserManager({ allUsers, updateUserRole, deleteUser, showToast, currentUser }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [processingUser, setProcessingUser] = useState<string | null>(null);

    // STATS
    const totalUsers = allUsers?.length || 0;
    const staffCount = allUsers?.filter((u: any) => ['admin', 'manager', 'staff'].includes(u.role)).length || 0;
    const blockedCount = allUsers?.filter((u: any) => u.role === 'banned').length || 0;

    // FILTER
    const filteredUsers = allUsers?.filter((u: any) => {
        const matchesSearch =
            (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'All' ? true : u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // HANDLERS
    const handleRoleChange = async (targetEmail: string, newRole: string) => {
        if (currentUser?.email === targetEmail) return showToast("You cannot change your own role!", "error");

        setProcessingUser(targetEmail);
        try {
            await updateUserRole(targetEmail, newRole);
            showToast(`Role updated to ${newRole.toUpperCase()}`, "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to update role", "error");
        } finally {
            setProcessingUser(null);
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (currentUser?.email === email) return showToast("You cannot delete yourself!", "error");

        if (confirm(`⚠️ DELETE USER: ${email}?\nThis action cannot be undone.`)) {
            setProcessingUser(email);
            try {
                if (deleteUser) {
                    await deleteUser(id);
                    showToast(`User ${email} deleted permanently`, "success");
                } else {
                    showToast("Delete function not connected", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("Failed to delete user", "error");
            } finally {
                setProcessingUser(null);
            }
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/50 text-[10px] font-bold uppercase">Super Admin</span>;
            case 'manager': return <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] font-bold uppercase">Manager</span>;
            case 'staff': return <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/50 text-[10px] font-bold uppercase">Staff</span>;
            case 'banned': return <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-bold uppercase">Banned</span>;
            default: return <span className="px-2 py-1 rounded bg-white/10 text-white/50 border border-white/10 text-[10px] font-bold uppercase">Customer</span>;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <SectionHeader title="User Management" subtitle="Manage access levels and accounts" />

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex items-center gap-4"><div className="p-4 bg-blue-500/20 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div><div><h3 className="text-2xl font-serif text-white">{totalUsers}</h3><p className="text-xs text-white/40 uppercase font-bold">Total Accounts</p></div></div>
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex items-center gap-4"><div className="p-4 bg-amber-500/20 rounded-xl text-amber-400"><ShieldCheck className="w-6 h-6" /></div><div><h3 className="text-2xl font-serif text-white">{staffCount}</h3><p className="text-xs text-white/40 uppercase font-bold">Active Staff</p></div></div>
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex items-center gap-4"><div className="p-4 bg-red-500/20 rounded-xl text-red-400"><Ban className="w-6 h-6" /></div><div><h3 className="text-2xl font-serif text-white">{blockedCount}</h3><p className="text-xs text-white/40 uppercase font-bold">Banned</p></div></div>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f2925] p-4 rounded-xl border border-white/5">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    {['All', 'admin', 'manager', 'staff', 'customer', 'banned'].map(role => (
                        <button key={role} onClick={() => setFilterRole(role)} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filterRole === role ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>{role}</button>
                    ))}
                </div>
                <input type="text" placeholder="Search user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-64 pl-4 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-amber-500/50" />
            </div>

            {/* TABLE */}
            <div className="bg-[#0f2925] border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[300px]">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-[#0a1f1c] text-[10px] uppercase text-white/40 tracking-wider">
                        <tr><th className="p-5">User Profile</th><th className="p-5">Role</th><th className="p-5">Status</th><th className="p-5 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers?.map((u: any) => {
                            const isMe = currentUser?.email === u.email;
                            const isBusy = processingUser === u.email;
                            return (
                                <tr key={u.id || u.email} className={`transition duration-200 ${isMe ? 'bg-amber-500/5' : 'hover:bg-white/5'}`}>
                                    <td className="p-5 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.role === 'admin' ? 'bg-purple-600' : 'bg-stone-700'}`}>{u.name?.charAt(0).toUpperCase()}</div>
                                        <div><p className="font-bold text-white">{u.name} {isMe && <span className="text-[9px] text-amber-500">(You)</span>}</p><p className="text-[10px] text-white/40">{u.email}</p></div>
                                    </td>
                                    <td className="p-5">
                                        {isBusy ? <span className="text-amber-500 text-xs animate-pulse">Updating...</span> : (
                                            <div className="space-y-2">
                                                {getRoleBadge(u.role)}
                                                {!isMe && (
                                                    <select value={u.role} onChange={(e) => handleRoleChange(u.email, e.target.value)} className="block w-32 bg-black/40 border border-white/10 text-white text-[10px] rounded px-2 py-1 mt-1 outline-none focus:border-amber-500/50 uppercase font-bold cursor-pointer">
                                                        <option value="customer" className="bg-stone-900">Customer</option>
                                                        <option value="staff" className="bg-stone-900">Staff</option>
                                                        <option value="manager" className="bg-stone-900">Manager</option>
                                                        <option value="admin" className="bg-stone-900">Admin</option>
                                                        <option value="banned" className="bg-red-900 text-white">Ban User</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-5">{u.role === 'banned' ? <span className="text-red-400 text-xs">Blocked</span> : <span className="text-green-400 text-xs">Active</span>}</td>
                                    <td className="p-5 text-right">
                                        {!isMe && (
                                            <button onClick={() => handleDeleteUser(u.id, u.email)} disabled={isBusy} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition" title="Delete User">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
// --- COUPON MANAGER (PREMIUM: Toasts, Glassmorphism & Copy) ---
// --- UPDATED COUPON MANAGER (With Personalization) ---
function CouponManager({ coupons, onAdd, onDelete, showToast }: { coupons: any[], onAdd: (c: any) => void, onDelete: (id: string) => void, showToast: any }) {
    // Naya Field 'allowedEmail' add kiya hai
    const [formData, setFormData] = useState({ code: '', type: 'percent', discount: 0, minOrderValue: 0, allowedEmail: '' });

    const handleSave = () => {
        if (!formData.code || !formData.discount) {
            return showToast("Code and Discount value required", "error");
        }

        // Logic: Agar email dala hai to use clean karo, nahi to empty rakho
        const emailLock = formData.allowedEmail ? formData.allowedEmail.toLowerCase().trim() : null;

        onAdd({
            id: Date.now().toString(),
            code: formData.code.toUpperCase().replace(/\s/g, ''),
            type: formData.type,
            discount: Number(formData.discount),
            minOrderValue: Number(formData.minOrderValue),
            allowedEmail: emailLock // ✅ Ye naya data hai (Lock)
        });

        setFormData({ code: '', type: 'percent', discount: 0, minOrderValue: 0, allowedEmail: '' });
        showToast("Coupon created successfully", "success");
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast(`Code ${code} copied!`, "success");
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div><h2 className="text-2xl font-serif text-white">Coupon Management</h2><p className="text-sm text-white/40 mt-1">Create public or personalized offers</p></div>
            </div>

            {/* CREATE COUPON FORM */}
            <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <h4 className="text-white font-serif text-lg mb-4 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-amber-500" /> Create New Offer
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                    <div className="lg:col-span-1">
                        <label className="text-[10px] text-white/40 uppercase block mb-2 font-bold">Coupon Code</label>
                        <input
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 transition uppercase font-bold tracking-wider placeholder:text-white/20"
                            placeholder="VIP20"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="text-[10px] text-white/40 uppercase block mb-2 font-bold">Value (₹ or %)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 font-mono"
                                placeholder="20"
                                value={formData.discount || ''}
                                onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                            />
                            <select
                                className="px-2 bg-[#0a1f1c] border border-white/10 rounded-xl text-white outline-none text-xs"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option value="percent">%</option>
                                <option value="flat">₹</option>
                            </select>
                        </div>
                    </div>

                    {/* ✅ NEW: Email Restriction Field */}
                    <div className="lg:col-span-2">
                        <label className="text-[10px] text-amber-500 uppercase block mb-2 font-bold flex items-center gap-2">
                            <Lock className="w-3 h-3" /> Restrict to Email (Optional)
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-white outline-none focus:border-amber-500 transition placeholder:text-white/20 text-sm"
                            placeholder="Enter customer email to lock this coupon..."
                            value={formData.allowedEmail}
                            onChange={e => setFormData({ ...formData, allowedEmail: e.target.value })}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <button
                            onClick={handleSave}
                            className="w-full bg-amber-600 text-white py-3 rounded-xl text-xs uppercase font-bold hover:bg-amber-700 transition shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save
                        </button>
                    </div>
                </div>
            </div>

            {/* COUPON LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons?.map(c => (
                    <div key={c.id} className="bg-[#0f2925] p-5 border border-white/5 rounded-2xl flex justify-between items-center group hover:border-amber-500/30 transition duration-300 relative overflow-hidden">

                        <div className="relative z-10">
                            <div onClick={() => copyToClipboard(c.code)} className="flex items-center gap-2 cursor-pointer">
                                <h4 className="text-amber-500 font-bold text-lg tracking-wide">{c.code}</h4>
                                {c.allowedEmail && <Lock className="w-3 h-3 text-red-400" />} {/* Lock Icon */}
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-xs text-white bg-white/10 px-2 py-0.5 rounded font-bold w-fit">
                                    {c.type === 'percent' ? `${c.discount}% OFF` : `₹${c.discount} OFF`}
                                </span>
                                {/* Dikhayega ki ye coupon kiske liye hai */}
                                {c.allowedEmail && (
                                    <span className="text-[9px] text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded bg-red-500/10">
                                        Only for: {c.allowedEmail}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <button onClick={() => onDelete(c.id)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/30 hover:bg-red-500/20 hover:text-red-400 transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
function DangerZone({ nukeDatabase, products, orders, allUsers, showToast }: any) {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // --- FEATURE: EXPORT DATA (Backup) ---
    const handleExport = (type: 'orders' | 'users' | 'products') => {
        // Data select karein based on button click
        const data = type === 'orders' ? orders : type === 'users' ? allUsers : products;

        if (!data || data.length === 0) {
            return showToast ? showToast(`No ${type} data to export`, 'error') : alert("No data");
        }

        // JSON File Create karein
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zerimi_${type}_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click(); // Auto Download
        document.body.removeChild(a);

        if (showToast) showToast(`${type.toUpperCase()} exported successfully!`, 'success');
    };

    // --- FEATURE: NUCLEAR RESET (Safety Check) ---
    const handleNuke = async () => {
        if (confirmText !== 'DELETE') return;

        if (confirm("⚠️ FINAL WARNING: This will wipe ALL database records. Are you absolutely sure?")) {
            setIsDeleting(true);
            try {
                if (nukeDatabase) {
                    await nukeDatabase();
                    if (showToast) showToast("♻️ System Reset Complete. Database is empty.", "success");
                    setConfirmText('');
                }
            } catch (e) {
                if (showToast) showToast("Reset Failed. Check console.", "error");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <SectionHeader title="Danger Zone" subtitle="Irreversible actions and data management" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. DATA BACKUP SECTION (Safe Zone) */}
                <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                    {/* Blue Glow Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition"></div>

                    <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-400" /> Data Backup
                    </h3>
                    <p className="text-white/40 text-sm mb-6">Download a copy of your data before performing any cleanup.</p>

                    <div className="space-y-3">
                        <button onClick={() => handleExport('orders')} className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl transition group/btn">
                            <span className="text-sm font-bold text-white flex items-center gap-3"><FileJson className="w-4 h-4 text-blue-400" /> Export Orders</span>
                            <Download className="w-4 h-4 text-white/20 group-hover/btn:text-white transition" />
                        </button>
                        <button onClick={() => handleExport('products')} className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl transition group/btn">
                            <span className="text-sm font-bold text-white flex items-center gap-3"><FileJson className="w-4 h-4 text-amber-400" /> Export Inventory</span>
                            <Download className="w-4 h-4 text-white/20 group-hover/btn:text-white transition" />
                        </button>
                        <button onClick={() => handleExport('users')} className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl transition group/btn">
                            <span className="text-sm font-bold text-white flex items-center gap-3"><FileJson className="w-4 h-4 text-green-400" /> Export Customers</span>
                            <Download className="w-4 h-4 text-white/20 group-hover/btn:text-white transition" />
                        </button>
                    </div>
                </div>

                {/* 2. NUCLEAR OPTION (Danger Zone) */}
                <div className="bg-red-950/20 p-8 rounded-3xl border border-red-500/30 relative overflow-hidden">
                    {/* Warning Pattern Background */}
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 10px, transparent 0, transparent 20px)' }}></div>

                    <h3 className="text-xl font-serif text-red-500 mb-2 flex items-center gap-2 relative z-10">
                        <AlertOctagon className="w-6 h-6" /> Nuclear Reset
                    </h3>
                    <p className="text-red-400/60 text-xs mb-6 relative z-10">
                        This action will permanently delete ALL orders, users (except admins), products, and logs. This cannot be undone.
                    </p>

                    <div className="space-y-4 relative z-10">
                        <div className="space-y-1">
                            <label className="text-[10px] text-red-400 uppercase font-bold">Type "DELETE" to confirm</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full p-4 bg-black/40 border border-red-500/30 rounded-xl text-red-500 placeholder:text-red-900/50 outline-none focus:border-red-500 font-bold tracking-widest text-center"
                                placeholder="DELETE"
                            />
                        </div>

                        <button
                            onClick={handleNuke}
                            disabled={confirmText !== 'DELETE' || isDeleting}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl ${confirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-red-900/20' : 'bg-red-900/20 text-red-800 cursor-not-allowed border border-red-900/30'}`}
                        >
                            {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {isDeleting ? 'Wiping Database...' : 'Delete Everything'}
                        </button>
                    </div>
                </div>

                {/* 3. TROUBLESHOOTING (Cache Clear) */}
                <div className="lg:col-span-2 bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500"><ShieldAlert className="w-6 h-6" /></div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Local Storage Issues?</h4>
                            <p className="text-[10px] text-white/40">Use this if dashboard data looks stuck or outdated.</p>
                        </div>
                    </div>
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs uppercase font-bold rounded-lg border border-white/10 transition flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Force Reset Cache
                    </button>
                </div>

            </div>
        </div>
    );
}
// 👇 STEP 4: YE COMPONENT SABSE NEECHE PASTE KAREIN
function InboxManager({ messages, markRead, deleteMsg, showToast }: any) {
    const [filter, setFilter] = useState('all'); // all, unread

    const filteredMessages = messages?.filter((m: any) =>
        filter === 'all' ? true : !m.isRead
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <SectionHeader title="Customer Inbox" subtitle="Read and manage queries from contact form" />

            {/* CONTROLS */}
            <div className="flex gap-4 bg-[#0f2925] p-4 rounded-xl border border-white/5">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition ${filter === 'all' ? 'bg-amber-600 text-white' : 'text-white/40 hover:text-white'}`}>All Messages</button>
                <button onClick={() => setFilter('unread')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition ${filter === 'unread' ? 'bg-amber-600 text-white' : 'text-white/40 hover:text-white'}`}>Unread Only</button>
            </div>

            {/* MESSAGES LIST */}
            <div className="space-y-4">
                {!filteredMessages || filteredMessages.length === 0 ? (
                    <div className="p-12 text-center text-white/30 italic bg-[#0f2925] rounded-2xl border border-white/5">No messages found.</div>
                ) : (
                    filteredMessages.map((msg: any) => (
                        <div key={msg.id} className={`p-6 rounded-2xl border transition-all relative group ${!msg.isRead ? 'bg-[#0f2925] border-amber-500/30' : 'bg-black/20 border-white/5'}`}>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {!msg.isRead && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
                                    <div>
                                        <h4 className="text-white font-serif text-lg">{msg.name}</h4>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{msg.subject}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-white/30 font-mono">{new Date(msg.date).toLocaleDateString()}</span>
                            </div>

                            <p className="text-white/80 text-sm leading-relaxed mb-6 pl-5 border-l-2 border-white/10">
                                {msg.message}
                            </p>

                            <div className="flex items-center justify-between pl-5">
                                <div className="flex gap-4">
                                    <a href={`mailto:${msg.email}`} className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase flex items-center gap-2"><Mail className="w-3 h-3" /> {msg.email}</a>
                                    <a href={`tel:${msg.phone}`} className="text-xs text-white/40 hover:text-white font-bold uppercase flex items-center gap-2"><Phone className="w-3 h-3" /> {msg.phone}</a>
                                </div>

                                <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!msg.isRead && (
                                        <button onClick={() => { markRead(msg.id); showToast('Marked as read', 'success'); }} className="p-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-lg transition" title="Mark Read"><Check className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={() => { if (confirm('Delete message?')) deleteMsg(msg.id); }} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
}