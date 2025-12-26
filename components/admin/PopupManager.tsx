"use client";
import { useState } from 'react';
import { Save, Megaphone, Eye, Smartphone, Check, X } from 'lucide-react';
import Image from 'next/image';

export default function PopupManager({ siteText, onSave }: any) {
    // Local State
    const [formData, setFormData] = useState({
        isPopupActive: siteText?.isPopupActive || false,
        popupTitle: siteText?.popupTitle || '',
        popupSub: siteText?.popupSub || '',
        popupCode: siteText?.popupCode || '',
        popupImage: siteText?.popupImage || ''
    });

    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Handle Input Changes
    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Save Data
    const handleSave = () => {
        setIsSaving(true);
        // Main Admin function call
        onSave(formData); 
        
        // Premium Toast Simulation
        setTimeout(() => {
            setIsSaving(false);
            setMessage("Changes Published Live! 💎");
            setTimeout(() => setMessage(""), 3000);
        }, 800);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* LEFT SIDE: CONTROLS */}
            <div className="bg-[#0f2925] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h2 className="text-2xl font-serif text-white flex items-center gap-3">
                            <Megaphone className="w-5 h-5 text-amber-500" />
                            Marketing Spotlight
                        </h2>
                        <p className="text-xs text-white/40 mt-1">Configure the welcome offer popup.</p>
                    </div>
                    
                    {/* Premium Toggle Switch */}
                    <div className="flex items-center gap-3 bg-black/20 p-2 rounded-full border border-white/5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 ${formData.isPopupActive ? 'text-white' : 'text-white/30'}`}>
                            {formData.isPopupActive ? 'Live' : 'Hidden'}
                        </span>
                        <div 
                            onClick={() => setFormData({...formData, isPopupActive: !formData.isPopupActive})}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-500 ease-in-out ${formData.isPopupActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-white/10'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-500 ${formData.isPopupActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    {/* Image Input */}
                    <div>
                        <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block tracking-widest">Featured Image URL</label>
                        <div className="relative group">
                            <input 
                                type="text" 
                                name="popupImage" 
                                value={formData.popupImage} 
                                onChange={handleChange} 
                                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-amber-500/50 outline-none transition font-mono" 
                                placeholder="https://..." 
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500/50 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block tracking-widest">Main Headline</label>
                            <input 
                                type="text" 
                                name="popupTitle" 
                                value={formData.popupTitle} 
                                onChange={handleChange} 
                                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-amber-500/50 outline-none transition font-serif" 
                                placeholder="FLAT 10% OFF" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block tracking-widest">Coupon Code</label>
                            <input 
                                type="text" 
                                name="popupCode" 
                                value={formData.popupCode} 
                                onChange={handleChange} 
                                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-amber-500/50 outline-none transition font-mono uppercase text-center tracking-widest text-amber-500" 
                                placeholder="WELCOME10" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block tracking-widest">Offer Description</label>
                        <textarea 
                            name="popupSub" 
                            value={formData.popupSub} 
                            onChange={handleChange} 
                            rows={3}
                            className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-amber-500/50 outline-none transition resize-none leading-relaxed" 
                            placeholder="Unlock exclusive access to our artisan collection..." 
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-emerald-400 text-xs font-bold tracking-wider flex items-center gap-2">
                            {message && <><Check className="w-3 h-3" /> {message}</>}
                        </span>
                        
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isSaving ? 'bg-stone-700 cursor-wait text-white/50' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'}`}
                        >
                           {isSaving ? 'Publishing...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW (IPHONE MOCKUP) */}
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-white/30 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
                    <Smartphone className="w-3 h-3" /> Live Customer Preview
                </div>

                {/* Mobile Frame */}
                <div className="relative w-[300px] h-[600px] bg-stone-900 rounded-[3rem] border-8 border-stone-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-xl z-30"></div>

                    {/* Screen Content (Simulated Website) */}
                    <div className="w-full h-full bg-white relative">
                        {/* Fake Navbar */}
                        <div className="h-16 bg-white flex items-center justify-center border-b">
                            <span className="font-serif font-bold text-[#0a1f1c]">ZERIMI</span>
                        </div>
                        {/* Fake Hero Image */}
                        <div className="h-64 bg-stone-200 relative">
                             <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" />
                             <div className="absolute inset-0 bg-black/10"></div>
                             <div className="absolute bottom-4 left-4 text-white font-serif text-2xl">New Collection</div>
                        </div>
                        {/* Fake Products */}
                        <div className="p-4 grid grid-cols-2 gap-2">
                            <div className="h-32 bg-stone-100 rounded"></div>
                            <div className="h-32 bg-stone-100 rounded"></div>
                        </div>

                        {/* --- THE ACTUAL POPUP PREVIEW --- */}
                        {formData.isPopupActive ? (
                             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 transition-all duration-500">
                                <div className="bg-white w-full rounded-lg overflow-hidden shadow-2xl animate-fade-in-up transform scale-95">
                                    <div className="relative h-32 bg-stone-200">
                                        <img 
                                            src={formData.popupImage || "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1000&auto=format&fit=crop"} 
                                            className="w-full h-full object-cover" 
                                        />
                                        <button className="absolute top-2 right-2 bg-white/80 p-1 rounded-full"><X className="w-3 h-3" /></button>
                                    </div>
                                    <div className="p-5 text-center">
                                        <h3 className="font-serif text-xl text-[#0a1f1c] mb-1">{formData.popupTitle || "Exclusive Offer"}</h3>
                                        <p className="text-[10px] text-stone-500 leading-relaxed mb-3">{formData.popupSub || "Join us and get special perks."}</p>
                                        <div className="bg-[#0a1f1c] text-white py-2 text-[10px] font-bold uppercase tracking-widest rounded mb-2">
                                            Code: {formData.popupCode || "CODE"}
                                        </div>
                                        <button className="text-[9px] text-stone-400 underline">No thanks</button>
                                    </div>
                                </div>
                             </div>
                        ) : (
                            // Disabled State Overlay
                            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-md">
                                    Popup Disabled
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}