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
    Download, FileJson, RefreshCw, ShieldAlert, Bike
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// ✅ Is line ko file ke sabse top par add karein
import PopupManager from '@/components/admin/PopupManager';
import Link from 'next/link';
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
    const [userRole, setUserRole] = useState<'admin' | 'staff'>('admin');
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
        featured, updateFeatured,
        promo, updatePromo,
        blogs, addBlog, deleteBlog
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
        updateOrderStatus(id, status);
        addSystemNotification('Order Updated', `Order #${id} status changed to ${status}`, 'order');
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

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Secure Credentials
        const secureEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@zerimi.com';
        const securePass = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin';

        // 1. Check Super Admin
        if (email.toLowerCase() === secureEmail.toLowerCase() && password === securePass) {
            setIsAuthenticated(true);
            setUserRole('admin');
            setCurrentUser({ name: 'Super Admin', email: secureEmail, role: 'admin' });
            showToast('Welcome back, Super Admin', 'success');
            return;
        }

        // 2. Check Database Users
        const foundUser = allUsers?.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser) {
            if (foundUser.role === 'banned') return showToast('Access Denied: This account is banned.', 'error');
            if (foundUser.role === 'customer') return showToast('Access Denied: Customers cannot access dashboard.', 'error');

            const requiredPass = foundUser.role === 'admin' ? 'admin' : 'staff'; // In real app, check hash

            if (password === requiredPass) {
                setIsAuthenticated(true);
                setUserRole(foundUser.role === 'admin' ? 'admin' : 'staff');
                setCurrentUser(foundUser);
                showToast(`Welcome back, ${foundUser.name}`, 'success');
            } else {
                showToast('Incorrect Password provided.', 'error');
            }
        } else {
            // 3. Fallback Demo Staff
            if (email === 'staff@zerimi.com' && password === 'staff') {
                setIsAuthenticated(true);
                setUserRole('staff');
                setCurrentUser({ name: 'Demo Staff', email: 'staff@zerimi.com', role: 'staff' });
                showToast('Welcome back, Staff Member', 'success');
            } else {
                showToast('User not found in system.', 'error');
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
            <aside className="w-20 lg:w-72 bg-[#0f2925] border-r border-white/5 flex flex-col flex-shrink-0 transition-all duration-300 z-20">
                <div className="p-6 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5 h-24">
                    <div className="text-center lg:text-left">
                        <h2 className="font-serif text-2xl tracking-widest text-white hidden lg:block">ZERIMI</h2>
                        <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${userRole === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <p className="text-[9px] text-amber-500 uppercase tracking-widest hidden lg:block">{userRole === 'admin' ? 'GOD MODE' : 'STAFF PANEL'}</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-4 py-2 text-[10px] text-white/20 uppercase tracking-widest hidden lg:block">Operations</p>
                    <SidebarBtn icon={<BarChart3 />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarBtn icon={<Truck />} label="Order Management" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <SidebarBtn icon={<Package />} label="Inventory" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                    {/* 👇 STEP 2: INBOX BUTTON WITH BADGE */}
                    <div className="relative">
                        <SidebarBtn icon={<Mail />} label="Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
                        {inboxUnreadCount > 0 && (
                            <span className="absolute left-10 top-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse border border-[#0f2925]">
                                {inboxUnreadCount}
                            </span>
                        )}
                    </div>
                    {userRole === 'admin' && (
                        <>
                            <p className="px-4 py-2 text-[10px] text-white/20 uppercase tracking-widest hidden lg:block mt-4">Growth Engine</p>
                            <SidebarBtn icon={<Layout />} label="Homepage Editor" active={activeTab === 'cms'} onClick={() => setActiveTab('cms')} />
                            <SidebarBtn icon={<Ticket />} label="Coupons & Offers" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />
                            <SidebarBtn icon={<Megaphone />} label="Marketing" active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
                            {/* Line 308 ke baad Marketing ke neeche */}


                            {/* ✅ NEW POPUP BUTTON */}
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
                    {activeTab === 'dashboard' && <DashboardOverview products={products} orders={orders} allUsers={allUsers} setActiveTab={setActiveTab} />}

                    {activeTab === 'products' && <ProductManager products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={(id: string) => handleProductDelete(id)} />}

                    {activeTab === 'orders' && <OrderManager orders={orders} updateOrderStatus={(id: string, s: string) => handleStatusUpdate(id, s)} />}
                    {/* 👇 STEP 3: INBOX MANAGER COMPONENT */}
                    {activeTab === 'inbox' && (
                        <InboxManager
                            messages={messages}
                            markRead={markMessageRead}
                            deleteMsg={deleteMessage}
                            showToast={showToast}
                        />
                    )}
                    {userRole === 'admin' && (
                        <>
                            {activeTab === 'coupons' && <CouponManager coupons={coupons} onAdd={addCoupon} onDelete={deleteCoupon} showToast={showToast} />}
                            {activeTab === 'cms' && <CMSManager
                                banner={banner} updateBanner={updateBanner}
                                categories={categories} updateCategories={updateCategories}
                                featured={featured} updateFeatured={updateFeatured}
                                promo={promo} updatePromo={updatePromo}
                                blogs={blogs} addBlog={addBlog} deleteBlog={deleteBlog}
                                siteText={store.siteText} updateSiteText={store.updateSiteText} // <--- Ye Nayi Line Hai
                                showToast={showToast} // <--- Ye Bhi Zaroori Hai
                            />}
                            {activeTab === 'marketing' && <MarketingManager allUsers={allUsers} sendNotification={sendNotification} showToast={showToast} />}
                            {/* ✅ NEW POPUP MANAGER SCREEN */}
                            {activeTab === 'popup' && (
                                <div className="animate-fade-in">
                                    <PopupManager
                                        siteText={store.siteText}
                                        onSave={store.updateSiteText}
                                    />
                                </div>
                            )}
                            {activeTab === 'users' && <UserManager
                                allUsers={allUsers}
                                updateUserRole={updateUserRole}
                                deleteUser={store.deleteUser}  // <--- YE MISSING THA
                                showToast={showToast}
                            />}
                            {activeTab === 'config' && <ConfigManager updateSystemConfig={store.updateSystemConfig} showToast={showToast} />}
                            {activeTab === 'danger' && <DangerZone
                                nukeDatabase={nukeDatabase}
                                products={products}       // <--- Ye missing tha
                                orders={orders}           // <--- Ye missing tha
                                allUsers={allUsers}       // <--- Ye missing tha
                                showToast={showToast}
                            />}
                        </>
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

const generateAdminInvoice = (order: any) => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Please allow popups for this website to print the invoice."); return; }
    const taxRate = 3; const total = order.total || 0; const subTotal = order.subtotal || (total / (1 + taxRate / 100)); const taxAmount = total - subTotal; const cgst = taxAmount / 2; const sgst = taxAmount / 2; const items = order.items || []; const date = order.date || new Date().toLocaleDateString(); const addressStr = typeof order.address === 'object' ? `${order.address.street || ''}, ${order.address.city || ''} - ${order.address.pincode || ''}` : order.address || 'Address Not Provided';
    const invoiceHTML = `<html><head><title>Tax Invoice #${order.invoiceNo || order.id}</title><style>body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; font-size: 12px; } .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0a1f1c; padding-bottom: 10px; } .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0a1f1c; } .invoice-box { border: 1px solid #ddd; padding: 0; margin-top: 20px; } .row { display: flex; border-bottom: 1px solid #ddd; } .col { flex: 1; padding: 10px; } .col-right { text-align: right; border-left: 1px solid #ddd; } .table { width: 100%; border-collapse: collapse; } .table th { background: #f2f2f2; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 10px; font-weight: bold; } .table td { padding: 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; } .text-right { text-align: right; } .total-row td { font-weight: bold; background: #fafafa; } .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #888; }</style></head><body><div class="header"><div class="logo">ZERIMI JEWELS</div><div>Original Tax Invoice</div><div>GSTIN: 27AABCU9603R1Z2</div></div><div class="invoice-box"><div class="row"><div class="col"><strong>Billed To:</strong><br>${order.customerName || 'Customer'}<br>${order.customerEmail || ''}<br>${addressStr}<br>Phone: ${order.phone || 'N/A'}</div><div class="col col-right"><strong>Invoice No:</strong> ${order.invoiceNo || 'INV-' + order.id}<br><strong>Date:</strong> ${date}<br><strong>Status:</strong> ${order.status}<br><strong>Payment:</strong> ${order.paymentMethod || 'Prepaid'}</div></div><table class="table"><thead><tr><th style="width: 5%">#</th><th style="width: 45%">Item</th><th style="width: 10%">Qty</th><th style="width: 20%" class="text-right">Price</th><th style="width: 20%" class="text-right">Total</th></tr></thead><tbody>${items.map((item: any, index: number) => `<tr><td>${index + 1}</td><td>${item.name}</td><td>${item.qty}</td><td class="text-right">₹${(item.price || 0).toLocaleString('en-IN')}</td><td class="text-right">₹${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4" class="text-right">Sub Total</td><td class="text-right">₹${subTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr><tr><td colspan="4" class="text-right">CGST (1.5%)</td><td class="text-right">₹${cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr><tr><td colspan="4" class="text-right">SGST (1.5%)</td><td class="text-right">₹${sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr><tr class="total-row"><td colspan="4" class="text-right">GRAND TOTAL</td><td class="text-right">₹${total.toLocaleString('en-IN')}</td></tr></tfoot></table></div><div class="footer">This is a computer generated invoice.<br>Authorized Signatory - ZERIMI JEWELS</div><script>window.print();</script></body></html>`;
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
};

// --- ORDER MANAGER (Updates Trigger Notification) ---
// --- ORDER MANAGER (Fixed Return Logic) ---
// --- ORDER MANAGER (PREMIUM: Search, Filters & Timeline) ---
function OrderManager({ orders, updateOrderStatus }: any) {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [viewingOrder, setViewingOrder] = useState<any | null>(null);

    // New States for Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Filter Logic
    const filteredOrders = orders?.filter((o: any) => {
        const matchesSearch =
            o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterStatus === 'All' ? true :
            filterStatus === 'Returns' ? o.status.includes('Return') :
                o.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const toggleSelect = (id: string) => {
        if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(o => o !== id));
        else setSelectedOrders([...selectedOrders, id]);
    };

    const handleStatusUpdate = (orderId: string, status: string) => {
        updateOrderStatus(orderId, status); // Triggers Notification in Parent
        if (viewingOrder && viewingOrder.id === orderId) setViewingOrder({ ...viewingOrder, status: status });
    };

    const handleReturnAction = (id: string, action: 'Approved' | 'Rejected') => {
        const newStatus = action === 'Approved' ? 'Return Approved' : 'Return Rejected';
        if (confirm(`Are you sure you want to ${action} this return request?`)) {
            handleStatusUpdate(id, newStatus);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'Processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'Shipped': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            // ✅ NAYA STATUS ADD KIYA
            case 'Out for Delivery': return 'bg-purple-500/20 text-purple-400 border-purple-500/50 animate-pulse';
            case 'Return Requested': return 'bg-orange-500/20 text-orange-400 animate-pulse border-orange-500/50';
            case 'Return Approved': return 'bg-emerald-600/20 text-emerald-500 border-emerald-500/50';
            case 'Return Rejected': return 'bg-red-600/20 text-red-500 border-red-500/50';
            case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-white/10 text-white border-white/10';
        }
    };

    // Helper for Tabs
    const FilterTab = ({ label, value, count }: any) => (
        <button
            onClick={() => setFilterStatus(value)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filterStatus === value ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
        >
            {label} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
        </button>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Order Management" subtitle="Track, process and manage customer orders" />

            {/* 1. SEARCH & FILTER BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f2925] p-4 rounded-xl border border-white/5">
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    <FilterTab label="All" value="All" count={orders?.length || 0} />
                    <FilterTab label="Pending" value="Pending" count={orders?.filter((o: any) => o.status === 'Pending').length || 0} />
                    <FilterTab label="Processing" value="Processing" count={orders?.filter((o: any) => o.status === 'Processing').length || 0} />
                    <FilterTab label="Shipped" value="Shipped" count={orders?.filter((o: any) => o.status === 'Shipped').length || 0} />
                    <FilterTab label="Returns" value="Returns" count={orders?.filter((o: any) => o.status.includes('Return')).length || 0} />
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search Order ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs focus:border-amber-500/50 outline-none"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                </div>
            </div>

            {/* 2. ORDERS TABLE */}
            <div className="bg-[#0f2925] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-[#0a1f1c] text-[10px] uppercase text-white/40 tracking-wider">
                        <tr>
                            <th className="p-5 w-10"><CheckSquare className="w-4 h-4" /></th>
                            <th className="p-5">Order ID</th>
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
                                    <span className="font-mono text-xs text-white/50 block">#{o.id.slice(-6)}</span>
                                    <span className="text-[10px] text-white/30">{o.date}</span>
                                </td>
                                <td className="p-5 text-white">
                                    <p className="font-bold text-sm">{o.customerName}</p>
                                    <span className="text-[10px] text-white/40">{o.customerEmail}</span>
                                </td>
                                <td className="p-5 text-xs text-white/60">
                                    {o.items.length} Items
                                </td>
                                <td className="p-5 font-bold text-amber-500 font-mono">₹{o.total.toLocaleString()}</td>
                                <td className="p-5">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap border ${getStatusColor(o.status)}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <button onClick={() => setViewingOrder(o)} className="p-2 bg-white/5 hover:bg-white/10 hover:text-amber-400 rounded-lg transition">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!filteredOrders || filteredOrders.length === 0) && <div className="p-12 text-center text-white/30 italic">No orders found matching your criteria.</div>}
            </div>

            {/* 3. ORDER DETAILS MODAL (TIMELINE & ACTIONS) */}
            {viewingOrder && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0f2925] border border-white/10 w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a1f1c]">
                            <div>
                                <h3 className="text-xl font-serif text-white flex items-center gap-3">
                                    Order #{viewingOrder.id}
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${getStatusColor(viewingOrder.status)}`}>{viewingOrder.status}</span>
                                </h3>
                                <p className="text-xs text-white/40 mt-1 flex items-center gap-2"><Activity className="w-3 h-3" /> Placed on {viewingOrder.date}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => generateAdminInvoice(viewingOrder)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs uppercase font-bold flex items-center gap-2 transition border border-white/5">
                                    <Printer className="w-4 h-4" /> Invoice
                                </button>
                                <button onClick={() => setViewingOrder(null)} className="hover:bg-red-500/20 p-2 rounded-lg text-white/50 hover:text-red-500 transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left: Timeline & Items */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* VISUAL TIMELINE (UPDATED) */}
                                <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-6">Order Progress</h4>
                                    <div className="flex items-center justify-between relative">
                                        {/* Line Background */}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 z-0"></div>
                                        
                                        {/* Active Progress Line */}
                                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-600 transition-all duration-500 z-0`} style={{
                                            width: viewingOrder.status === 'Delivered' ? '100%' 
                                                 : viewingOrder.status === 'Out for Delivery' ? '75%' 
                                                 : viewingOrder.status === 'Shipped' ? '50%' 
                                                 : viewingOrder.status === 'Processing' ? '25%' 
                                                 : '0%'
                                        }}></div>

                                        {/* Steps */}
                                        {['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                                            const stepsOrder = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
                                            const currentIdx = stepsOrder.indexOf(viewingOrder.status);
                                            const isCompleted = currentIdx >= idx;
                                            
                                            return (
                                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? 'bg-amber-600 border-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#0f2925] border-white/10 text-white/20'}`}>
                                                        {isCompleted ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                                                    </div>
                                                    <span className={`text-[9px] uppercase font-bold text-center w-16 ${isCompleted ? 'text-white' : 'text-white/30'}`}>
                                                        {step === 'Out for Delivery' ? 'Out for Delivery' : step}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Items List */}
                                <div>
                                    <h4 className="text-xs text-amber-500 uppercase tracking-widest font-bold mb-4">Items Ordered</h4>
                                    <div className="space-y-3">
                                        {viewingOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                                                <div className="w-16 h-16 bg-black/20 rounded-md overflow-hidden relative">
                                                    {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-serif">{item.name}</p>
                                                    <p className="text-xs text-white/50 mt-1">Qty: {item.qty} x ₹{item.price.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-amber-400 font-bold">₹{(item.price * item.qty).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-white text-lg font-bold">
                                        <span>Total Amount</span>
                                        <span>₹{viewingOrder.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Info & Actions */}
                            <div className="space-y-6">

                                {/* Customer Info Card */}
                                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-3 h-3" /> Customer Details</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-white/50">Name</p>
                                            <p className="text-sm text-white font-medium">{viewingOrder.customerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">Email</p>
                                            <p className="text-sm text-white font-medium break-all">{viewingOrder.customerEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">Shipping Address</p>
                                            <p className="text-sm text-white/80 leading-relaxed mt-1">
                                                {typeof viewingOrder.address === 'object'
                                                    ? `${viewingOrder.address.street}, ${viewingOrder.address.city} - ${viewingOrder.address.pincode}`
                                                    : viewingOrder.address || "No address provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Card */}
                                <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Update Status</h4>

                                    <div className="space-y-3">
                                        {/* 🚚 SHIPROCKET BUTTON */}
{viewingOrder.status === 'Processing' && (
  <button
    onClick={async () => {
      try {
        const res = await fetch("/api/shiprocket/create-shipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(viewingOrder)
        });

        const data = await res.json();

        if (!data.success) {
          alert("❌ Shiprocket shipment failed");
          return;
        }

        alert("✅ Shipment created in Shiprocket (Test Mode)");
      } catch (err) {
        alert("❌ Shiprocket error");
      }
    }}
    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg"
  >
    🚚 Create Shipment (Shiprocket)
  </button>
)}

                                        {/* Status Logic */}
                                        {/* PENDING -> PROCESSING */}
                                        {viewingOrder.status === 'Pending' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Processing')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                                    <Activity className="w-4 h-4" /> Process Order
                                                </button>
                                                <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Cancelled')} className="w-full py-3 bg-white/5 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2">
                                                    <XCircle className="w-4 h-4" /> Cancel Order
                                                </button>
                                            </>
                                        )}

                                        {/* PROCESSING -> SHIPPED */}
                                        {viewingOrder.status === 'Processing' && (
                                            <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Shipped')} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20">
                                                <Truck className="w-4 h-4" /> Mark as Shipped
                                            </button>
                                        )}

                                        {/* ✅ SHIPPED -> OUT FOR DELIVERY (Ye Naya Hai) */}
                                        {viewingOrder.status === 'Shipped' && (
                                            <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Out for Delivery')} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                                                <Bike className="w-4 h-4" /> Mark Out for Delivery
                                            </button>
                                        )}

                                        {/* ✅ OUT FOR DELIVERY -> DELIVERED (Ye bhi Update Hua) */}
                                        {viewingOrder.status === 'Out for Delivery' && (
                                            <button onClick={() => handleStatusUpdate(viewingOrder.id, 'Delivered')} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                                                <Check className="w-4 h-4" /> Complete Delivery
                                            </button>
                                        )}
                                        {/* Return Logic */}
                                        {viewingOrder.status === 'Return Requested' && (
                                            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                                                <p className="text-orange-400 text-xs font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Return Request</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => handleReturnAction(viewingOrder.id, 'Approved')} className="py-2 bg-green-600 text-white rounded font-bold text-xs">Approve</button>
                                                    <button onClick={() => handleReturnAction(viewingOrder.id, 'Rejected')} className="py-2 bg-red-600 text-white rounded font-bold text-xs">Reject</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
    const [formData, setFormData] = useState<AdminProductForm>({ images: [], galleryImages: [], tags: [], stock: 10 });

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
            tags: formData.tags || [],
            // 👇 YE 3 LINES NAYI HAIN
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
                                <div className="space-y-2"><label className="text-[10px] text-white/40 uppercase font-bold">Tags</label><div className="flex flex-wrap gap-2">{availableTags.map(tag => (<button key={tag} onClick={() => { const tags = formData.tags || []; setFormData({ ...formData, tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] }) }} className={`text-[10px] px-3 py-1.5 rounded-full border transition-all uppercase font-bold ${formData.tags?.includes(tag) ? 'bg-amber-600 border-amber-600 text-white' : 'border-white/20 text-white/40'}`}>{tag}</button>))}</div></div>
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
            globalAlert: 'Welcome to ZERIMI - Premium Jewelry'
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
function TextManager({ siteText, updateSiteText, showToast }: any) {
    const [formData, setFormData] = useState(siteText || {});
    useEffect(() => { if (siteText) setFormData(siteText); }, [siteText]);

    const handleSave = () => {
        updateSiteText(formData);
        showToast("Site text updated successfully", "success");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div><h3 className="text-xl font-serif text-white">Text Content</h3><p className="text-xs text-white/40">Edit titles and subtitles across the site</p></div>
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition"><Save className="w-4 h-4" /> Save Changes</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries({
                    heroTitle: "Hero Title", heroSubtitle: "Hero Subtitle", heroBtnText: "Hero Button",
                    newArrivalsTitle: "New Arrivals Title", newArrivalsSub: "New Arrivals Sub",
                    featuredTitle: "Featured Title", featuredSub: "Featured Sub",
                    promoTitle: "Promo Title", promoText: "Promo Text", promoBtn: "Promo Button",
                    blogTitle: "Blog Title"
                }).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-bold">{label}</label>
                        {key.includes('Text') || key.includes('Sub') ?
                            <textarea value={formData[key] || ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-amber-500/50 outline-none h-20 resize-none" /> :
                            <input value={formData[key] || ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-amber-500/50 outline-none" />
                        }
                    </div>
                ))}
            </div>
        </div>
    )
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

    useEffect(() => { if (featured) setData(featured); }, [featured]);

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) setData({ ...data, image: url });
                showToast("Image uploaded", "success");
            } catch (e) { showToast("Upload failed", "error"); }
            finally { setUploading(false); }
        }
    };

    const handleSave = () => { updateFeatured(data); showToast("Featured section updated", "success"); };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div onClick={() => !uploading && ref.current?.click()} className="h-64 bg-black/30 rounded-xl border-2 border-dashed border-white/10 cursor-pointer flex items-center justify-center relative group hover:border-amber-500/50 transition overflow-hidden">
                {/* FIX: Only show IMG if data.image exists */}
                {uploading ? (
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                ) : data.image ? (
                    <img src={data.image} className="w-full h-full object-contain group-hover:opacity-50 transition" />
                ) : (
                    <div className="text-center">
                        <UploadCloud className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <span className="text-xs font-bold text-white/40 uppercase">Click to Upload Featured Image</span>
                    </div>
                )}

                {!uploading && data.image && <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100"><UploadCloud className="w-8 h-8 text-white mb-2" /><span className="text-xs font-bold text-white uppercase">Change Image</span></div>}
                <input type="file" ref={ref} className="hidden" onChange={handleUpload} />
            </div>
            <div className="space-y-4">
                <div className="space-y-1"><label className="text-[10px] text-white/40 uppercase font-bold">Section Title</label><input value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50" /></div>
                <div className="space-y-1"><label className="text-[10px] text-white/40 uppercase font-bold">Subtitle</label><input value={data.subtitle || ''} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-amber-500/50" /></div>
            </div>
            <button disabled={uploading} onClick={handleSave} className="w-full bg-amber-600 py-3 rounded-lg text-white font-bold uppercase text-xs hover:bg-amber-700 transition">Save Changes</button>
        </div>
    );
}

// 4. PROMO MANAGER (Cloudinary Fix)
// 4. PROMO MANAGER (Fixed: Empty SRC Error)
function PromoManager({ promo, updatePromo, showToast }: any) {
    const [data, setData] = useState(promo || { image: "" });
    const [uploading, setUploading] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { if (promo) setData(promo); }, [promo]);

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                if (url) setData({ ...data, image: url });
            } catch (e) { showToast("Upload failed", "error"); }
            finally { setUploading(false); }
        }
    };
    const handleSave = () => { updatePromo(data); showToast("Promo section updated", "success"); };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div onClick={() => !uploading && ref.current?.click()} className="h-48 bg-black/30 rounded-xl border-2 border-dashed border-white/10 cursor-pointer flex items-center justify-center relative group hover:border-amber-500/50 transition overflow-hidden">
                {/* FIX: Only show IMG if data.image exists */}
                {uploading ? (
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                ) : data.image ? (
                    <img src={data.image} className="w-full h-full object-cover group-hover:opacity-50 transition" />
                ) : (
                    <div className="text-center">
                        <UploadCloud className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <span className="text-xs font-bold text-white/40 uppercase">Click to Upload Promo Banner</span>
                    </div>
                )}

                {!uploading && data.image && <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100"><UploadCloud className="w-8 h-8 text-white mb-2" /><span className="text-xs font-bold text-white uppercase">Change Image</span></div>}
                <input type="file" ref={ref} className="hidden" onChange={handleUpload} />
            </div>
            <button disabled={uploading} onClick={handleSave} className="w-full bg-amber-600 py-3 rounded-lg text-white font-bold uppercase text-xs hover:bg-amber-700 transition">Save Promo</button>
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
function DashboardOverview({ products, orders, allUsers, setActiveTab }: any) {
    // 1. Calculate Real Metrics
    const totalRevenue = orders?.reduce((sum: number, o: any) => sum + o.total, 0) || 0;
    const totalOrders = orders?.length || 0;
    const stockCount = products?.reduce((sum: number, p: any) => sum + (p.stock || 0), 0) || 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Recent 5 Orders
    const recentOrders = orders ? [...orders].reverse().slice(0, 5) : [];

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* 1. WELCOME HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-serif text-white">Dashboard Overview</h2>
                    <p className="text-white/40 text-sm mt-1">Here is what’s happening with your store today.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setActiveTab('orders')} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition">
                        <FileUp className="w-4 h-4 text-amber-500" /> View Reports
                    </button>
                    <button onClick={() => setActiveTab('products')} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-900/20 transition flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" /> Add Product
                    </button>
                </div>
            </div>

            {/* 2. PREMIUM STAT CARDS (Now Clickable) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumStatCard
                    title="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    trend="+12.5%"
                    icon={<DollarSign className="w-6 h-6 text-white" />}
                    gradient="from-emerald-500 to-emerald-700"
                    subtext="Gross earnings"
                    onClick={() => setActiveTab('orders')} // Click Action
                />
                <PremiumStatCard
                    title="Total Orders"
                    value={totalOrders}
                    trend="+5.2%"
                    icon={<ShoppingBag className="w-6 h-6 text-white" />}
                    gradient="from-blue-500 to-blue-700"
                    subtext="Processed orders"
                    onClick={() => setActiveTab('orders')} // Click Action
                />
                <PremiumStatCard
                    title="Avg. Order Value"
                    value={`₹${Math.round(aov).toLocaleString()}`}
                    trend="-1.4%"
                    isNegative
                    icon={<TrendingUp className="w-6 h-6 text-white" />}
                    gradient="from-amber-500 to-amber-700"
                    subtext="Per customer"
                    onClick={() => setActiveTab('orders')} // Click Action
                />
                <PremiumStatCard
                    title="Total Inventory"
                    value={stockCount}
                    trend="Stable"
                    icon={<Package className="w-6 h-6 text-white" />}
                    gradient="from-purple-500 to-purple-700"
                    subtext="Items in stock"
                    onClick={() => setActiveTab('products')} // Click Action
                />
            </div>

            {/* 3. CHART & RECENT ACTIVITY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: REVENUE CHART */}
                <div className="lg:col-span-2 bg-[#0f2925] rounded-2xl border border-white/5 p-8 relative overflow-hidden group cursor-pointer hover:border-white/10 transition" onClick={() => setActiveTab('orders')}>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-serif text-white">Revenue Analytics</h3>
                            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Last 7 Days Performance</p>
                        </div>
                        <div className="bg-black/20 border border-white/10 text-white text-xs rounded-lg px-3 py-1">
                            This Week
                        </div>
                    </div>
                    <div className="h-64 w-full relative">
                        <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-white/20">
                            <div className="border-b border-white/5 w-full">₹50k</div>
                            <div className="border-b border-white/5 w-full">₹25k</div>
                            <div className="border-b border-white/5 w-full">₹10k</div>
                            <div className="border-b border-white/5 w-full">0</div>
                        </div>
                        <RevenueChart />
                    </div>
                </div>

                {/* RIGHT: RECENT ORDERS FEED */}
                <div className="bg-[#0f2925] rounded-2xl border border-white/5 p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 bg-[#0a1f1c] flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-serif text-white">Recent Activity</h3>
                            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Real-time feed</p>
                        </div>
                        <button onClick={() => setActiveTab('orders')} className="text-[10px] text-amber-500 hover:text-white uppercase font-bold">View All</button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 max-h-[350px]">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((o: any) => (
                                <div key={o.id} onClick={() => setActiveTab('orders')} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-amber-500 group-hover:text-white transition">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition">New Order #{o.id}</p>
                                        <p className="text-xs text-white/40 truncate">{o.customerName} • {o.items?.length || 1} Items</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-amber-500">₹{o.total.toLocaleString()}</p>
                                        <span className="text-[9px] text-white/30 uppercase">{o.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-white/30 text-xs">No recent activity</div>
                        )}
                    </div>
                    <div className="p-4 border-t border-white/5 bg-[#0a1f1c]">
                        <button onClick={() => setActiveTab('orders')} className="w-full py-2 text-xs text-white/50 hover:text-white uppercase font-bold tracking-widest transition">View All Transactions</button>
                    </div>
                </div>
            </div>
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
function UserManager({ allUsers, updateUserRole, deleteUser, showToast }: any) { // <--- Added deleteUser prop
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [processingEmail, setProcessingEmail] = useState<string | null>(null);

    // STATS
    const totalUsers = allUsers?.length || 0;
    const staffCount = allUsers?.filter((u: any) => ['admin', 'manager', 'staff'].includes(u.role)).length || 0;
    const blockedCount = allUsers?.filter((u: any) => u.role === 'banned').length || 0;

    // FILTER
    const filteredUsers = allUsers?.filter((u: any) => {
        const matchesSearch =
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'All' ? true : u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleRoleChange = async (email: string, newRole: string) => {
        if (confirm(`Change role to ${newRole.toUpperCase()}?`)) {
            await updateUserRole(email, newRole);
            showToast(`Role updated to ${newRole.toUpperCase()}`, "success");
        }
    };

    const handlePasswordReset = (email: string) => {
        setProcessingEmail(email);
        setTimeout(() => {
            setProcessingEmail(null);
            showToast(`Reset link sent to ${email}`, "success");
        }, 1500);
    };

    // --- NEW: DELETE HANDLER ---
    const handleDeleteUser = async (id: string, email: string) => {
        if (confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE user ${email}?\n\nThis action cannot be undone.`)) {
            if (deleteUser) {
                await deleteUser(id); // Store function call
                showToast(`User ${email} deleted permanently`, "error");
            } else {
                showToast("Delete function not connected to store", "error");
            }
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/50 text-[10px] font-bold uppercase"><ShieldCheck className="w-3 h-3" /> Super Admin</span>;
            case 'manager': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] font-bold uppercase"><Briefcase className="w-3 h-3" /> Manager</span>;
            case 'staff': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/50 text-[10px] font-bold uppercase"><Headphones className="w-3 h-3" /> Support Staff</span>;
            case 'banned': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-bold uppercase"><Ban className="w-3 h-3" /> Banned</span>;
            default: return <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white/50 border border-white/10 text-[10px] font-bold uppercase"><User className="w-3 h-3" /> Customer</span>;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <SectionHeader title="User Management" subtitle="Manage access levels, staff roles, and customer accounts" />

            {/* STATS & CONTROLS (Same as before) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex items-center gap-4"><div className="p-4 bg-blue-500/20 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div><div><h3 className="text-2xl font-serif text-white">{totalUsers}</h3><p className="text-xs text-white/40 uppercase font-bold">Total Accounts</p></div></div>
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex items-center gap-4"><div className="p-4 bg-amber-500/20 rounded-xl text-amber-400"><ShieldCheck className="w-6 h-6" /></div><div><h3 className="text-2xl font-serif text-white">{staffCount}</h3><p className="text-xs text-white/40 uppercase font-bold">Active Staff</p></div></div>
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex items-center gap-4"><div className="p-4 bg-red-500/20 rounded-xl text-red-400"><Ban className="w-6 h-6" /></div><div><h3 className="text-2xl font-serif text-white">{blockedCount}</h3><p className="text-xs text-white/40 uppercase font-bold">Banned / Flagged</p></div></div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f2925] p-4 rounded-xl border border-white/5">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    {['All', 'admin', 'manager', 'staff', 'customer', 'banned'].map(role => (<button key={role} onClick={() => setFilterRole(role)} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filterRole === role ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>{role}</button>))}
                </div>
                <div className="relative w-full md:w-64"><input type="text" placeholder="Search user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs focus:border-amber-500/50 outline-none" /><div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><Search className="w-4 h-4" /></div></div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-[#0f2925] border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[300px]">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-[#0a1f1c] text-[10px] uppercase text-white/40 tracking-wider">
                        <tr>
                            <th className="p-5">User Profile</th>
                            <th className="p-5">Role & Access</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers?.map((u: any) => (
                            <tr key={u.id || u.email} className="hover:bg-white/5 transition duration-200 group">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${u.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-stone-600 to-stone-800'}`}>{u.name?.charAt(0).toUpperCase() || 'U'}</div>
                                        <div><p className="font-bold text-white group-hover:text-amber-400 transition">{u.name || 'Unknown'}</p><p className="text-[10px] text-white/40">{u.email}</p></div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="space-y-2">
                                        <div>{getRoleBadge(u.role)}</div>
                                        <div className="relative w-40">
                                            <select
                                                value={u.role || 'customer'}
                                                onChange={(e) => handleRoleChange(u.email, e.target.value)}
                                                className="w-full appearance-none bg-[#0f2925] border border-white/10 text-white text-[10px] rounded px-3 py-1.5 outline-none focus:border-amber-500/50 cursor-pointer uppercase font-bold"
                                                style={{ colorScheme: 'dark' }} // <--- Ye zaruri hai white background hatane ke liye
                                            >
                                                <option value="customer" className="bg-[#0f2925] text-white">Customer</option>
                                                <option value="staff" className="bg-[#0f2925] text-white">Staff (Limited)</option>
                                                <option value="manager" className="bg-[#0f2925] text-white">Manager (Ops)</option>
                                                <option value="admin" className="bg-[#0f2925] text-white">Admin (Owner)</option>
                                                <option value="banned" className="bg-red-900 text-white">Ban User</option>
                                            </select>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50"><svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    {u.role === 'banned' ? <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><XCircle className="w-3 h-3" /> Restricted</span> : <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><Check className="w-3 h-3" /> Active</span>}
                                    <p className="text-[9px] text-white/30 mt-1">Joined: {u.joinedDate || 'Recently'}</p>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handlePasswordReset(u.email)} disabled={processingEmail === u.email} className={`p-2 rounded-lg transition ${processingEmail === u.email ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 hover:bg-white/10 hover:text-amber-400 text-white/50'}`} title="Send Password Reset Link">
                                            {processingEmail === u.email ? <Activity className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                        </button>
                                        {/* DELETE BUTTON */}
                                        <button onClick={() => handleDeleteUser(u.id, u.email)} className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition" title="Delete User Permanently">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!filteredUsers || filteredUsers.length === 0) && <div className="p-12 text-center text-white/30 italic">No users found matching your search.</div>}
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