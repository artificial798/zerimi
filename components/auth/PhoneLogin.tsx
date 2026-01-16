"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase"; // Apni firebase config import karein
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Phone, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"INPUT_PHONE" | "INPUT_OTP">("INPUT_PHONE");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const router = useRouter();

  // 1. Recaptcha Setup (Invisible)
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // Recaptcha solved automatically
        },
      });
    }
  }, []);

  // 2. Send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return alert("Please enter valid number");
    
    setLoading(true);
    try {
      const formattedNumber = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;

      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep("INPUT_OTP");
      alert("✅ OTP Sent!");
    } catch (error: any) {
      console.error(error);
      alert("❌ Error sending OTP: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Login Success!
      alert("🎉 Login Successful!");
      router.push("/"); // Home page par bhejo
    } catch (error: any) {
      console.error(error);
      alert("❌ Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden Recaptcha Container */}
      <div id="recaptcha-container"></div>

      {step === "INPUT_PHONE" ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <label className="text-xs text-white/40 uppercase font-bold ml-1 mb-1 block">Mobile Number</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">+91</span>
              <input
                type="tel"
                placeholder="98765 43210"
                className="w-full p-3 pl-12 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50 transition text-sm focus:bg-black/40 font-mono tracking-wide"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} // Sirf numbers allow karega
              />
            </div>
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading || phoneNumber.length < 10}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg uppercase tracking-widest text-xs font-bold hover:from-amber-500 hover:to-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Phone className="w-4 h-4" /> Send OTP</>}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="text-center">
            <p className="text-white/60 text-xs">OTP sent to +91 {phoneNumber}</p>
            <button onClick={() => setStep("INPUT_PHONE")} className="text-[10px] text-amber-500 hover:underline mt-1">Change Number</button>
          </div>
          
          <div>
            <label className="text-xs text-white/40 uppercase font-bold ml-1 mb-1 block">Enter OTP</label>
            <input
              type="text"
              placeholder="1 2 3 4 5 6"
              className="w-full p-3 text-center bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-amber-500/50 transition text-lg tracking-[0.5em] font-mono focus:bg-black/40"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length < 6}
            className="w-full bg-green-600 text-white py-3 rounded-lg uppercase tracking-widest text-xs font-bold hover:bg-green-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verify & Login</>}
          </button>
        </div>
      )}
    </div>
  );
}

// Typescript fix for global window object
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}