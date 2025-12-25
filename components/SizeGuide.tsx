"use client";
import { X, Info, Download, Circle, MoveHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export default function SizeGuide({ isOpen, onClose, category }: SizeGuideProps) {
  const [activeTab, setActiveTab] = useState<'ring' | 'bangle' | 'necklace'>('ring');
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');

  // Auto-detect tab logic
  useState(() => {
    if (category?.toLowerCase().includes('bangle') || category?.toLowerCase().includes('bracelet')) setActiveTab('bangle');
    else if (category?.toLowerCase().includes('necklace') || category?.toLowerCase().includes('chain')) setActiveTab('necklace');
    else setActiveTab('ring');
  });

  // --- DOWNLOAD FUNCTIONALITY ---
  const handleDownload = () => {
    const content = `
    ZERIMI OFFICIAL SIZE GUIDE
    ==========================
    Category: ${category}
    
    RING SIZE CHART (Diameter):
    - Size 6  : 14.6 mm
    - Size 8  : 15.3 mm
    - Size 10 : 16.0 mm
    - Size 12 : 16.5 mm
    - Size 14 : 17.2 mm
    
    BANGLE SIZE CHART:
    - 2-2 : 54 mm (2.125 inch)
    - 2-4 : 57 mm (2.25 inch)
    - 2-6 : 60 mm (2.375 inch)
    - 2-8 : 64 mm (2.5 inch)
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ZERIMI_Size_Chart.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-4 md:py-0">
        
        {/* Blur Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0a1f1c]/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          // FIX: Mobile pe 'overflow-y-auto' aur Desktop pe 'overflow-hidden'
          className="relative bg-white w-full max-w-5xl h-full md:h-[85vh] max-h-[90vh] shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
        >
            
          {/* --- LEFT SIDE: DATA (Scrolls on Mobile & Desktop) --- */}
          <div className="flex-1 flex flex-col bg-stone-50 md:h-full order-2 md:order-1">
              
              {/* Header (Desktop Only - Mobile Header is below) */}
              <div className="hidden md:flex px-8 py-6 bg-white border-b border-stone-100 justify-between items-center shadow-sm z-10">
                  <div>
                      <h3 className="font-serif text-2xl text-[#0a1f1c]">Size Guide</h3>
                      <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">Select your category</p>
                  </div>
              </div>

              {/* Tabs */}
              <div className="p-6 pb-0">
                  <div className="flex p-1 bg-stone-200/50 rounded-xl">
                      {['ring', 'bangle', 'necklace'].map((tab) => (
                          <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === tab ? 'bg-white text-[#0a1f1c] shadow-md transform scale-105' : 'text-stone-500 hover:text-stone-700'}`}
                          >
                              {tab}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-[300px]">
                  
                  {/* Unit Toggle */}
                  {activeTab !== 'necklace' && (
                    <div className="flex justify-end mb-4">
                       <span className="text-[10px] font-bold uppercase mr-2 mt-1 text-stone-400">Unit:</span>
                       <div className="flex bg-stone-200 rounded p-0.5">
                          <button onClick={() => setUnit('mm')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${unit === 'mm' ? 'bg-white shadow' : 'text-stone-500'}`}>MM</button>
                          <button onClick={() => setUnit('in')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${unit === 'in' ? 'bg-white shadow' : 'text-stone-500'}`}>IN</button>
                       </div>
                    </div>
                  )}

                  <table className="w-full text-sm">
                      <thead className="text-[10px] uppercase text-stone-400 font-bold border-b border-stone-200">
                          <tr>
                              <th className="pb-3 text-left pl-4">Size</th>
                              {activeTab !== 'necklace' && <th className="pb-3 text-center">Visual Scale</th>}
                              <th className="pb-3 text-right pr-4">Measurement</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 bg-white rounded-xl shadow-sm">
                          {/* RING DATA */}
                          {activeTab === 'ring' && [
                             { sz: 6, mm: 14.6 }, { sz: 8, mm: 15.3 }, { sz: 10, mm: 16.0 }, 
                             { sz: 12, mm: 16.5 }, { sz: 14, mm: 17.2 }, { sz: 16, mm: 17.8 }
                          ].map((r, i) => (
                              <tr key={i} className="group hover:bg-amber-50/50 transition">
                                  <td className="p-4 font-bold text-[#0a1f1c]">Size {r.sz}</td>
                                  <td className="p-4 flex justify-center items-center">
                                      <div className="rounded-full border-2 border-stone-300 group-hover:border-amber-500 transition-all bg-stone-50" style={{ width: `${r.mm * 2}px`, height: `${r.mm * 2}px` }}></div>
                                  </td>
                                  <td className="p-4 text-right font-mono text-stone-500">
                                      {unit === 'mm' ? `${r.mm} mm` : `${(r.mm * 0.03937).toFixed(2)}"`}
                                  </td>
                              </tr>
                          ))}

                          {/* BANGLE DATA */}
                          {activeTab === 'bangle' && [
                             { sz: "2-2", mm: 54 }, { sz: "2-4", mm: 57 }, 
                             { sz: "2-6", mm: 60 }, { sz: "2-8", mm: 64 }, { sz: "2-10", mm: 67 }
                          ].map((r, i) => (
                              <tr key={i} className="group hover:bg-amber-50/50 transition">
                                  <td className="p-4 font-bold text-[#0a1f1c]">{r.sz}</td>
                                  <td className="p-4 flex justify-center items-center">
                                      <div className="rounded-full border-2 border-stone-300 group-hover:border-amber-500 transition-all bg-transparent" style={{ width: `${r.mm / 1.5}px`, height: `${r.mm / 1.5}px` }}></div>
                                  </td>
                                  <td className="p-4 text-right font-mono text-stone-500">
                                      {unit === 'mm' ? `${r.mm} mm` : `${(r.mm * 0.03937).toFixed(2)}"`}
                                  </td>
                              </tr>
                          ))}

                          {/* NECKLACE DATA */}
                          {activeTab === 'necklace' && [
                             { name: "Choker", len: "14-16 inch" },
                             { name: "Princess", len: "18 inch" },
                             { name: "Matinee", len: "20-24 inch" },
                             { name: "Opera", len: "30 inch" }
                          ].map((r, i) => (
                              <tr key={i} className="group hover:bg-amber-50/50 transition">
                                  <td className="p-4 font-bold text-[#0a1f1c]">{r.name}</td>
                                  <td className="p-4 text-right font-mono text-stone-500">{r.len}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  
                  {/* Ruler */}
                  <div className="mt-8 pt-4 border-t border-stone-200">
                      <p className="text-[10px] uppercase text-center text-stone-400 mb-2">Reference Scale (cm)</p>
                      <div className="h-6 w-full border-b border-stone-300 flex justify-between px-1">
                          {[...Array(10)].map((_,i) => <div key={i} className="h-full w-px bg-stone-300 relative"><span className="absolute bottom-1 left-1 text-[8px] text-stone-400">{i}</span></div>)}
                      </div>
                  </div>
              </div>
          </div>

          {/* --- RIGHT SIDE: DARK VISUAL GUIDE (Order 1 on Mobile) --- */}
          <div className="w-full md:w-[400px] bg-[#0a1f1c] text-white p-6 md:p-8 flex flex-col justify-between relative order-1 md:order-2 shrink-0">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div>
                  <div className="flex justify-between items-start mb-6 md:mb-10">
                      <h4 className="font-serif text-xl md:text-2xl tracking-wide">How to Measure</h4>
                      {/* Mobile Close Button */}
                      <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><X className="w-5 h-5"/></button>
                  </div>

                  {activeTab === 'ring' && (
                      <div className="space-y-6 md:space-y-8 relative z-10">
                          <div className="flex gap-4">
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-[#0a1f1c] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                              <p className="text-sm text-stone-300">Wrap paper around finger base.</p>
                          </div>
                          <div className="flex gap-4">
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-[#0a1f1c] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                              <p className="text-sm text-stone-300">Mark where ends meet.</p>
                          </div>
                          {/* Visual Icon */}
                          <div className="flex justify-center mt-4">
                             <Circle className="w-20 h-20 text-white/10 stroke-[1]" />
                             <div className="absolute mt-8 w-20 border-t border-dashed border-amber-500/50"></div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'bangle' && (
                      <div className="space-y-6 relative z-10">
                          <p className="text-sm text-stone-300 italic border-l-2 border-amber-500 pl-4">"Measure the inner diameter of a bangle that fits well."</p>
                          <div className="flex gap-4 items-center mt-4">
                              <MoveHorizontal className="w-6 h-6 text-amber-500" />
                              <p className="text-xs text-stone-400">Inside Edge to Inside Edge</p>
                          </div>
                      </div>
                  )}

                  {activeTab === 'necklace' && (
                      <div className="relative w-32 h-40 mx-auto border border-white/20 rounded-full mt-4">
                           <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] text-amber-500">Choker</div>
                           <div className="absolute top-16 left-1/2 -translate-x-1/2 text-[9px] text-stone-400">Princess</div>
                           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-stone-500">Opera</div>
                      </div>
                  )}
              </div>

              {/* ACTION: Download (Always Visible) */}
              <div className="mt-8 z-20">
                  <div className="bg-white/5 rounded-xl p-3 mb-3 flex gap-3 items-start">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-stone-400">Download for offline use.</p>
                  </div>
                  <button 
                    onClick={handleDownload}
                    className="w-full py-3 bg-white text-[#0a1f1c] hover:bg-amber-400 transition-colors rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                      <Download className="w-4 h-4" /> Download Guide
                  </button>
              </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}