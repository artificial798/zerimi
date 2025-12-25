"use client";
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Printer, ShieldCheck, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CertificatePage() {
  const { id } = useParams();
  const { warranties, banner } = useStore();
  
  // URL se Warranty ID match karo
  const certificate = warranties.find(w => w.id === id);

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <h2 className="font-serif text-2xl mb-4 text-stone-900">Certificate Not Found</h2>
        <Link href="/dashboard" className="text-amber-700 underline text-sm">Return to Vault</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-4 flex flex-col items-center print:bg-white print:p-0">
      
      {/* Actions (Hidden on Print) */}
      <div className="mb-8 flex gap-4 print:hidden">
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-[#0a1f1c] text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-amber-700 transition shadow-lg"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-stone-200 transition shadow-sm">
          Back to Dashboard
        </Link>
      </div>

      {/* --- CERTIFICATE CANVAS --- */}
      <div className="w-full max-w-[297mm] bg-white p-12 shadow-2xl relative overflow-hidden text-center border-[20px] border-double border-amber-100 print:shadow-none print:w-full print:border-none">
        
        {/* Decorative Borders */}
        <div className="absolute top-4 left-4 w-24 h-24 border-t-2 border-l-2 border-amber-400"></div>
        <div className="absolute top-4 right-4 w-24 h-24 border-t-2 border-r-2 border-amber-400"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 border-b-2 border-l-2 border-amber-400"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 border-b-2 border-r-2 border-amber-400"></div>

        {/* Header */}
        <div className="mb-12">
           <div className="relative h-16 w-48 mx-auto mb-4">
              <Image src={banner.logoDark} alt="ZERIMI" fill className="object-contain" />
           </div>
           <h1 className="font-serif text-5xl text-[#0a1f1c] tracking-wider mb-2">CERTIFICATE</h1>
           <p className="text-amber-600 text-sm uppercase tracking-[0.4em]">OF AUTHENTICITY</p>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto space-y-8 relative z-10">
           <p className="text-stone-500 italic font-serif text-lg">This document certifies that the jewelry item described below is an authentic ZERIMI creation, crafted with the highest standards of quality and precision.</p>
           
           <div className="py-8 border-y border-amber-100 flex flex-col md:flex-row items-center gap-8 justify-center">
              <div className="relative w-40 h-40 bg-stone-50 rounded-full overflow-hidden border-4 border-white shadow-lg">
                 <Image src={certificate.image} alt="Product" fill className="object-cover" />
              </div>
              <div className="text-left space-y-2">
                 <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Product Name</span>
                    <span className="font-serif text-2xl text-[#0a1f1c]">{certificate.productName}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Certificate ID</span>
                    <span className="font-mono text-amber-700">{certificate.certificateId}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Purchase Date</span>
                    <span className="text-stone-700">{certificate.purchaseDate}</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8 text-left max-w-lg mx-auto">
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                 <div className="flex items-center gap-2 mb-2 text-amber-700">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-bold text-xs uppercase tracking-widest">Warranty</span>
                 </div>
                 <p className="text-xs text-stone-500">
                    Valid until <span className="font-bold text-stone-900">{certificate.expiryDate}</span>. Covers plating and stone setting defects.
                 </p>
              </div>
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                 <div className="flex items-center gap-2 mb-2 text-amber-700">
                    <Award className="w-5 h-5" />
                    <span className="font-bold text-xs uppercase tracking-widest">Quality</span>
                 </div>
                 <p className="text-xs text-stone-500">
                    Lead & Nickel Free. High-grade cubic zirconia and 18k gold plating.
                 </p>
              </div>
           </div>
        </div>

        {/* Footer / Signature */}
        <div className="mt-16 pt-8 flex justify-between items-end px-12">
           <div className="text-left">
              <div className="h-16 w-32 relative mb-2">
                 {/* Mock Signature Image or Text */}
                 <p className="font-script text-3xl text-[#0a1f1c] opacity-70 rotate-[-5deg]">ZerimiOfficial</p>
              </div>
              <div className="w-40 h-[1px] bg-stone-300"></div>
              <p className="text-[10px] text-stone-400 uppercase mt-2">Authorized Signature</p>
           </div>
           <div className="text-right">
              <div className="w-20 h-20 bg-[#0a1f1c] text-white flex items-center justify-center rounded-full ml-auto mb-2">
                 <div className="text-center">
                    <span className="block text-[8px] uppercase">Official</span>
                    <span className="block font-serif text-lg">Seal</span>
                 </div>
              </div>
              <p className="text-[10px] text-stone-400 uppercase">ZERIMI Jewelry Ltd.</p>
           </div>
        </div>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.03] pointer-events-none">
           <Image src={banner.logoDark} alt="Watermark" fill className="object-contain" />
        </div>

      </div>
    </div>
  );
}