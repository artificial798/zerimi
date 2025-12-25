"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store'; // ✅ Store import kiya real data ke liye

// --- MAIN TRACKING COMPONENT ---
function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Store se orders nikalo
  const { orders } = useStore() as any;

  const urlOrderId = searchParams.get('orderId');
  
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ AUTO-SEARCH
  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
      handleTrack(urlOrderId);
    }
  }, [urlOrderId, orders]); // Orders add kiya taaki data load hone par check kare

  const handleTrack = (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setTrackingData(null);

    // --- REAL LOGIC START ---
    setTimeout(() => {
      // 1. Order dhoondo store mein
      const foundOrder = orders.find((o: any) => o.id === id);

      if (!foundOrder) {
        setLoading(false);
        setError("Order ID not found. Please check and try again.");
        return;
      }

      // 2. Status ka Sequence define karo
      const statusSteps = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
      
      // 3. Check karo abhi status kahan tak pahuncha hai
      // Agar status "Return" ya "Cancelled" hai to alag handle hoga, abhi standard flow dekhte hain
      let currentStepIndex = statusSteps.indexOf(foundOrder.status);
      
      // Fallback: Agar status match nahi hua (jaise 'Order Placed' vs 'Pending'), to 0 maano
      if (currentStepIndex === -1) {
          if (foundOrder.status === 'Order Placed') currentStepIndex = 0;
          else currentStepIndex = 0; // Default to start
      }

      // 4. Timeline Data Banao
      const timelineData = [
        { status: 'Order Placed', date: foundOrder.date, icon: Package },
        { status: 'Processing', date: currentStepIndex >= 1 ? 'In Progress' : '-', icon: Clock },
        { status: 'Shipped', date: currentStepIndex >= 2 ? 'Dispatched' : '-', icon: Truck },
        { status: 'Out for Delivery', date: currentStepIndex >= 3 ? 'Arriving Soon' : '-', icon: MapPin },
        { status: 'Delivered', date: currentStepIndex >= 4 ? 'Delivered' : '-', icon: CheckCircle },
      ].map((step, index) => ({
        ...step,
        // Logic: Agar ye step current step se pehle ya barabar hai, to Complete maano
        completed: index <= currentStepIndex
      }));

      // 5. Data Set karo
      setTrackingData({
        id: foundOrder.id,
        status: foundOrder.status,
        estimatedDelivery: currentStepIndex >= 4 ? 'Delivered' : 'Calculating...', 
        total: foundOrder.total,
        timeline: timelineData
      });

      setLoading(false);
    }, 800); 
  };

  return (
    <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
           <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Real-time Updates</p>
           <h1 className="font-serif text-3xl md:text-4xl text-white">Track Your Order</h1>
        </div>

        {/* Search Box */}
        <div className="bg-white/5 border border-white/10 p-2 rounded-full flex items-center max-w-md mx-auto mb-12 shadow-lg">
           <input 
             type="text" 
             placeholder="Enter Order ID (e.g. ORD-1234)" 
             value={orderId}
             onChange={(e) => setOrderId(e.target.value)}
             className="bg-transparent flex-1 px-6 py-2 outline-none text-white placeholder-white/30 text-sm"
           />
           <button 
             onClick={() => handleTrack(orderId)}
             className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full transition"
           >
             <Search className="w-5 h-5" />
           </button>
        </div>

        {/* Error Message */}
        {error && (
            <div className="text-center text-red-400 mb-8 bg-red-500/10 p-3 rounded-lg border border-red-500/20 max-w-md mx-auto flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        )}

        {/* Tracking Result */}
        {loading ? (
           <div className="text-center py-12 animate-fade-in">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Locating Your Package...</p>
           </div>
        ) : trackingData ? (
           <div className="bg-[#0f2925] border border-white/5 rounded-2xl p-8 shadow-2xl animate-fade-in relative overflow-hidden">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 mb-8 relative z-10">
                 <div>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Order ID</p>
                    <h2 className="text-2xl font-serif text-white">#{trackingData.id}</h2>
                 </div>
                 <div className="mt-4 md:mt-0 text-right">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Current Status</p>
                    <p className="text-xl font-serif text-amber-400">{trackingData.status}</p>
                 </div>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-8 relative z-10 pl-4 md:pl-8">
                 {trackingData.timeline.map((step: any, idx: number) => (
                    <div key={idx} className="relative pl-10 group">
                       {/* Connecting Line */}
                       {idx !== trackingData.timeline.length - 1 && (
                          <div className={`absolute left-[11px] top-8 w-[2px] h-full transition-colors duration-500 ${step.completed ? 'bg-amber-500' : 'bg-white/10'}`}></div>
                       )}
                       
                       {/* Icon Dot */}
                       <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                          step.completed ? 'bg-amber-500 border-amber-500 text-[#0a1f1c] scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#0a1f1c] border-white/20 text-white/20'
                       }`}>
                          <step.icon className="w-3 h-3" />
                       </div>

                       {/* Content */}
                       <div>
                          <h4 className={`text-sm font-bold transition-colors ${step.completed ? 'text-white' : 'text-white/40'}`}>{step.status}</h4>
                          <p className="text-xs text-white/30 mt-1">{step.date}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        ) : (
           !error && (
            <div className="text-center text-white/30 py-12">
                Enter your Order ID above to check live status.
            </div>
           )
        )}

        <div className="text-center mt-12">
           <Link href="/dashboard" className="text-xs font-bold text-white/40 hover:text-white flex items-center justify-center gap-2 transition">
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
           </Link>
        </div>
    </div>
  );
}

// --- PAGE WRAPPER ---
export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-[#0a1f1c] pt-32 pb-20 px-6 font-sans text-white">
       <Suspense fallback={<div className="text-white text-center pt-20">Loading...</div>}>
          <TrackOrderContent />
       </Suspense>
    </div>
  );
}