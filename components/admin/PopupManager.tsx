"use client";
import { useState, useRef } from 'react';
import { Save, Megaphone, UploadCloud, X, Layout, Type, Ticket, Power, Check } from 'lucide-react';

// --- Helper: Cloudinary Upload ---
const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

    if (!cloudName || !preset) {
        alert("❌ Error: Missing Cloudinary keys in .env.local");
        return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data.secure_url;
    } catch (error) {
        console.error("Upload Error:", error);
        return null;
    }
};

export default function PopupManager({ siteText, onSave }: any) {
    const [formData, setFormData] = useState({
        isPopupActive: siteText?.isPopupActive || false,
        popupTitle: siteText?.popupTitle || '',
        popupSub: siteText?.popupSub || '',
        popupCode: siteText?.popupCode || '',
        popupImage: siteText?.popupImage || ''
    });

    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            const url = await uploadToCloudinary(file);
            if (url) {
                setFormData(prev => ({ ...prev, popupImage: url }));
            }
            setUploading(false);
        }
    };

    // Handle Text Changes
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Save Data
    const handleSave = () => {
        setIsSaving(true);
        onSave(formData);
        setTimeout(() => {
            setIsSaving(false);
            setMessage("Popup Updated Successfully! 💎");
            setTimeout(() => setMessage(""), 3000);
        }, 800);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-10">
            
            {/* LEFT SIDE: CONTROLS (Form) */}
            <div className="space-y-6">
                
                {/* 1. Toggle & Status */}
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 flex justify-between items-center shadow-lg">
                    <div>
                        <h2 className="text-xl font-serif text-white flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-amber-500" /> Popup Manager
                        </h2>
                        <p className="text-xs text-white/40 mt-1">Status: <span className={formData.isPopupActive ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{formData.isPopupActive ? "ACTIVE" : "DISABLED"}</span></p>
                    </div>
                    <div 
                        onClick={() => setFormData({...formData, isPopupActive: !formData.isPopupActive})}
                        className={`flex items-center gap-3 px-4 py-2 rounded-full border cursor-pointer transition-all duration-300 ${formData.isPopupActive ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}
                    >
                        <Power className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{formData.isPopupActive ? 'ON' : 'OFF'}</span>
                    </div>
                </div>

                {/* 2. Image Uploader */}
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5">
                    <h4 className="text-white/60 text-xs uppercase font-bold mb-4 flex items-center gap-2">
                       <Layout className="w-4 h-4 text-amber-500" /> Left Side Image
                    </h4>
                    <div 
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className="relative aspect-video w-full bg-black/30 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition group overflow-hidden"
                    >
                        {uploading ? (
                            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : formData.popupImage ? (
                            <>
                                <img src={formData.popupImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <UploadCloud className="w-8 h-8 text-white mb-2" />
                                    <span className="text-xs font-bold text-white uppercase">Change Image</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <UploadCloud className="w-8 h-8 text-white/20 mx-auto mb-2 group-hover:text-amber-500 transition" />
                                <span className="text-xs font-bold text-white/40 uppercase">Upload Creative</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                </div>

                {/* 3. Content Inputs */}
                <div className="bg-[#0f2925] p-6 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-white/60 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                       <Type className="w-4 h-4 text-amber-500" /> Content Details
                    </h4>
                    <div>
                        <label className="text-[10px] text-white/30 uppercase font-bold block mb-1">Headline (e.g. Flat 50% Off)</label>
                        <input name="popupTitle" value={formData.popupTitle} onChange={handleChange} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50 font-serif" placeholder="FLAT 50% OFF" />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/30 uppercase font-bold block mb-1">Subtitle (e.g. Join the world of Zerimi)</label>
                        <input name="popupSub" value={formData.popupSub} onChange={handleChange} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50" placeholder="Be the part of ZERIMI world" />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/30 uppercase font-bold block mb-1">Coupon Code</label>
                        <input name="popupCode" value={formData.popupCode} onChange={handleChange} className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50 font-mono uppercase tracking-widest text-amber-500" placeholder="WELCOME" />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-emerald-400 text-xs font-bold tracking-wider flex items-center gap-2">
                        {message && <><Check className="w-3 h-3" /> {message}</>}
                    </span>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving || uploading}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg transition flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW (MATCHING YOUR IMAGE) */}
            <div className="flex flex-col gap-4">
                <div className="text-white/30 text-[10px] uppercase font-bold tracking-[0.3em] text-center">
                    Desktop Live Preview
                </div>

                {/* PREVIEW CONTAINER - Cream Background like Image */}
                <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-xl border border-white/10 flex items-center justify-center p-6 lg:p-12 overflow-hidden">
                    
                    {/* The Modal Design */}
                    <div className="bg-[#fffcf5] w-full max-w-2xl shadow-2xl flex relative overflow-hidden">
                        
                        {/* Close Icon Simulation */}
                        <div className="absolute top-2 right-3 text-stone-400 cursor-pointer hover:text-black">
                            <X className="w-4 h-4" />
                        </div>

                        {/* LEFT: IMAGE */}
                        <div className="w-1/2 relative min-h-[300px] bg-stone-200">
                             {formData.popupImage ? (
                                <img src={formData.popupImage} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs uppercase tracking-widest bg-stone-100">
                                    No Image
                                </div>
                             )}
                        </div>

                        {/* RIGHT: TEXT CONTENT */}
                        <div className="w-1/2 p-6 flex flex-col items-center justify-center text-center">
                            
                            <p className="text-[9px] font-bold tracking-[0.25em] text-[#d4af37] uppercase mb-4 border-b border-[#d4af37] pb-1">
                                Invitation
                            </p>

                            <h2 className="text-2xl lg:text-3xl font-serif text-[#0a1f1c] mb-2 leading-tight">
                                {formData.popupTitle || "FLAT 50% OFF"}
                            </h2>

                            <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-6">
                                {formData.popupSub || "BE THE PART OF ZERIMI WORLD"}
                            </p>

                            {/* Code Box */}
                            {formData.popupCode && (
                                <div className="border border-[#d4af37] px-6 py-2 mb-2">
                                    <span className="font-mono text-sm tracking-[0.2em] text-stone-800 uppercase">
                                        {formData.popupCode}
                                    </span>
                                </div>
                            )}
                            <p className="text-[8px] text-[#d4af37] uppercase tracking-widest mb-6">Use code at checkout</p>

                            {/* Button */}
                            <div className="bg-[#051815] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition cursor-pointer w-full">
                                Shop Collection
                            </div>
                            
                            <p className="text-[8px] text-stone-400 mt-3 cursor-pointer hover:text-black uppercase tracking-widest">Close</p>
                        </div>
                    </div>

                    {/* Overlay if Disabled */}
                    {!formData.isPopupActive && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div className="border border-red-500/50 bg-red-500/10 text-red-400 px-4 py-2 rounded uppercase font-bold text-xs tracking-widest animate-pulse">
                                Popup is Currently Disabled
                            </div>
                        </div>
                    )}
                </div>
                
                <p className="text-center text-white/20 text-[10px]">
                    This is exactly how it will appear on desktop screens.
                </p>
            </div>
        </div>
    );
}