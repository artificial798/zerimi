"use client";
import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "@/lib/firebase"; 
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useStore } from "@/lib/store"; 
import { toast } from "react-hot-toast"; 
import { X } from "lucide-react"; 

export default function useNotification() {
  const { currentUser } = useStore() as any;

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      
      const setupNotifications = async () => {
        try {
          const permission = await Notification.requestPermission();
          
          if (permission === "granted") {
            const params = new URLSearchParams({
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
              authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
              messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
              appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
            });

            const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`);
            const messaging = getMessaging(app);

            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY, 
              serviceWorkerRegistration: registration
            });

            if (token && currentUser?.id) {
              await updateDoc(doc(db, "users", currentUser.id), {
                fcmTokens: arrayUnion(token)
              });
            }

            // 👇 UPDATED HANDLER (Fix for Empty Text)
            onMessage(messaging, (payload) => {
              console.log("Message Received:", payload); // Console me check karein data aa rha hai ya nahi

              // 1. Data ko zabardasti string me convert karein taaki undefined na ho
              const rawTitle = payload.data?.title || payload.notification?.title;
              const rawBody = payload.data?.body || payload.notification?.body;
              
              // Fallback agar text khali ho
              const title = rawTitle ? String(rawTitle) : "New Notification";
              const body = rawBody ? String(rawBody) : "Check your dashboard for updates.";
              const image = payload.data?.icon || "/logo-white.png";
              const link = payload.data?.link || payload.data?.url || "/";

              // 2. Custom Toast
              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-sm w-full bg-[#0a1f1c]/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 relative overflow-hidden group transition-all duration-300 hover:border-amber-500/60 hover:shadow-amber-500/10 cursor-pointer`}
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (typeof window !== 'undefined' && link) window.location.href = link;
                  }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="flex-1 w-0 p-4 relative z-10">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                             <img 
                               src={image}
                               alt="Logo" 
                               className="w-full h-full object-contain"
                               onError={(e) => {
                                 (e.target as HTMLImageElement).style.display = 'none';
                                 if ((e.target as HTMLImageElement).parentElement) {
                                    (e.target as HTMLImageElement).parentElement!.innerText = '💎';
                                 }
                               }}
                             />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        {/* 👇 FIX: Title ab yahan GOLD COLOR me aayega (Pehle yahan 'Zerimi Updates' likha tha) */}
                        <p className="text-xs font-serif text-amber-500 font-bold uppercase tracking-widest mb-0.5">
                           {title}
                        </p>
                        {/* Body Text White */}
                        <p className="text-sm font-medium text-white/90 leading-snug">
                          {body}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <button
                          className="bg-transparent rounded-md inline-flex text-white/40 hover:text-white focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-600 to-yellow-400 w-full animate-pulse"></div>
                </div>
              ), { duration: 6000, position: "top-right" });

              try { new Audio('/notification.mp3').play().catch(() => {}); } catch(e) {}
            });

          }
        } catch (error) {
          console.error("Setup Error:", error);
        }
      };
      setupNotifications();
    }
  }, [currentUser]);
}