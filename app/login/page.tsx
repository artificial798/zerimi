"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ✅ Firebase Imports
import { auth, googleProvider, db } from '../../lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { 
  collection, query, where, getDocs, doc, setDoc, getDoc // 👈 Ye imports zaroori hain
} from 'firebase/firestore';

import { motion, AnimatePresence } from 'framer-motion';

import { FcGoogle } from 'react-icons/fc';
import {
  FiLock, FiMail, FiUser, FiArrowRight, FiArrowLeft,
  FiPhone, FiX, FiMapPin, FiHome, FiCheckCircle, FiLoader
} from 'react-icons/fi';
import { BiMaleFemale, BiDiamond } from 'react-icons/bi';

// --- TYPES FOR WINDOW (Recaptcha) ---
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const AuthPage = () => {
  const router = useRouter();

  // --- State ---
  // View states: 'login' | 'register' | 'reset' | 'complete-profile' (New Popup)
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  
  // ✅ New: Login Method Toggle ('EMAIL' | 'PHONE')
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');

  // ✅ New: Phone Auth States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    address: '',
    city: '',
    pincode: '',
    gender: '',
    vibe: '',
    agreeToTerms: false
  });

  // --- RECAPTCHA SETUP (Only once) ---
 // --- RECAPTCHA SETUP (Fixed for React 18) ---
  // --- RECAPTCHA SETUP (Localhost Safe Version) ---
  useEffect(() => {
    if (loginMethod !== 'PHONE') return; // Sirf Phone tab par chale

    // 1. Purana instance saaf karein (Cleanup)
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch(e) {}
      window.recaptchaVerifier = null;
    }

    // 2. Timer lagayein (HTML load hone ka wait karein)
    const timer = setTimeout(() => {
      try {
        const container = document.getElementById('recaptcha-container');
        
        // Agar container mil gaya, tabhi Recaptcha banao
        if (container) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => { console.log("✅ Verified"); },
            'expired-callback': () => { 
                if(window.recaptchaVerifier) window.recaptchaVerifier.clear(); 
            }
          });
        }
      } catch (err) {
        console.error("Recaptcha Error:", err);
      }
    }, 500); // 👈 500ms ka delay

    return () => clearTimeout(timer);
  }, [loginMethod]);

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const notifySuccess = (msg: string) => toast.success(msg, {
    duration: 3000,
    style: { background: '#0f172a', color: '#fbbf24', border: '1px solid #fbbf24' },
    iconTheme: { primary: '#fbbf24', secondary: '#000' },
  });

  const notifyError = (msg: string) => toast.error(msg, {
    duration: 4000,
    style: { background: '#1a1a1a', color: '#ef4444', border: '1px solid #333' }
  });

  const cleanErrorMessage = (msg: any) => {
    const messageString = typeof msg === 'string' ? msg : msg.toString();
    return messageString.replace('Firebase: ', '').replace(' (auth/', '').replace(').', '').replace('-', ' ');
  };

  // --- HANDLERS ---

  // 1. SEND OTP
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return notifyError("Valid Mobile Number Required");
    
    setLoading(true);
    try {
      const formattedNumber = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      
      setConfirmationResult(confirmation);
      setOtpSent(true);
      notifySuccess("OTP Sent successfully!");
    } catch (error: any) {
      notifyError(cleanErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  // 2. VERIFY OTP & CHECK PROFILE
  const handleVerifyOtp = async () => {
    if (!otp) return notifyError("Enter OTP");
    setLoading(true);
    try {
      const res = await confirmationResult.confirm(otp);
      const user = res.user;

      // 🔥 Check if Profile Exists
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().email) {
        // ✅ Old User -> Direct Dashboard
        notifySuccess("Login Successful!");
        router.push('/dashboard');
      } else {
        // ⚠️ New User (Missing Name/Email) -> Show Profile Popup
        notifySuccess("Verified! Please complete your profile.");
        // Pre-fill mobile number
        setFormData(prev => ({ ...prev, mobile: user.phoneNumber || '' }));
        setView('complete-profile'); // Switch to Profile Completion View
      }
    } catch (error: any) {
      notifyError("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. COMPLETE PROFILE SAVE
const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name || !formData.email) return notifyError("Name and Email are required.");
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      // -----------------------------------------------------------
      // 🔥 STEP 1: DUPLICATE EMAIL CHECK
      // -----------------------------------------------------------
      // Check karo ki ye email pehle se kisi aur user ke paas to nahi?
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Agar email mil gaya, to check karo ki wo mera hi hai ya kisi aur ka?
        const existingUser = querySnapshot.docs[0];
        if (existingUser.id !== user.uid) {
            setLoading(false);
            return notifyError("⚠️ This email is already registered. Please login via Email option.");
        }
      }

      // -----------------------------------------------------------
      // 🔥 STEP 2: SAVE PROFILE (Agar Email Unique hai)
      // -----------------------------------------------------------
      await updateProfile(user, { displayName: formData.name });
      
      // Save to Database
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        mobile: user.phoneNumber || formData.mobile,
        role: 'customer',
        createdAt: new Date(),
        method: 'phone',
        addresses: []
      }, { merge: true });

      notifySuccess("Profile Completed! Welcome to ZERIMI.");
      router.push('/dashboard');

    } catch (error: any) {
      console.error(error);
      // Agar permission error aaye to uska matlab user check nahi kar pa raha
      if (error.code === 'permission-denied') {
         notifyError("Security Check Failed. Please try again later.");
      } else {
         notifyError(cleanErrorMessage(error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. EMAIL LOGIN (Existing)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      notifySuccess('Welcome back to ZERIMI.');
      router.push('/dashboard');
    } catch (error: any) {
      notifyError(cleanErrorMessage(error.message));
      setLoading(false);
    }
  };

  // 5. REGISTER (Existing)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.address || !formData.agreeToTerms) return notifyError("Please fill all required fields.");

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.mobile,
        mobile: formData.mobile,
        gender: formData.gender,
        preference: formData.vibe,
        role: 'customer',
        createdAt: new Date(),
        termsAccepted: true,
        addresses: [{ street: formData.address, city: formData.city, pincode: formData.pincode, state: 'India', isDefault: true }]
      });

      notifySuccess(`Account created! Welcome.`);
      router.push('/dashboard');
    } catch (error: any) {
      notifyError(cleanErrorMessage(error.message));
      setLoading(false);
    }
  };

  // 6. GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'customer',
          createdAt: new Date(),
          method: 'google',
          addresses: []
        });
      }
      notifySuccess('Welcome back to ZERIMI.');
      router.push('/dashboard');
    } catch (error) {
      notifyError('Google Sign-In failed.');
    }
  };

  // 7. RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return notifyError("Enter email first.");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      notifySuccess('Reset link sent.');
      setView('login');
    } catch (error: any) {
      notifyError(cleanErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Invisible Recaptcha */}
      <div id="recaptcha-container"></div>

      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />

      <button onClick={() => router.push('/')} className="absolute top-6 left-6 z-50 text-white/50 hover:text-white flex items-center gap-2 transition-all group">
        <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md border border-white/5"><FiX className="w-5 h-5" /></div>
        <span className="text-sm font-medium hidden md:block tracking-wide">Return Home</span>
      </button>

      <motion.div layout className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 my-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 tracking-widest font-bold mb-2 cursor-pointer" onClick={() => router.push('/')}>ZERIMI</h1>
          <p className="text-gray-400 text-xs tracking-[0.2em] uppercase">
            {view === 'login' && 'Access Your Luxury'}
            {view === 'register' && 'Join the Elite Circle'}
            {view === 'reset' && 'Recover Access'}
            {view === 'complete-profile' && 'One Last Step'}
          </p>
        </div>

        <AnimatePresence mode='wait'>

          {/* --- VIEW: LOGIN --- */}
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              
              {/* ✅ TOGGLE BUTTONS (EMAIL / PHONE) */}
              <div className="flex bg-black/40 p-1 rounded-lg mb-6 border border-white/10">
                <button onClick={() => setLoginMethod('EMAIL')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition ${loginMethod === 'EMAIL' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white'}`}>Email Login</button>
                <button onClick={() => setLoginMethod('PHONE')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition ${loginMethod === 'PHONE' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white'}`}>Mobile OTP</button>
              </div>

              {loginMethod === 'EMAIL' ? (
                // --- EXISTING EMAIL FORM ---
                <form onSubmit={handleLogin} className="space-y-5">
                  <InputField icon={FiMail} type="email" placeholder="Email Address" name="email" value={formData.email} onChange={handleChange} />
                  <div className='space-y-1'>
                    <InputField icon={FiLock} type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} />
                    <div className='text-right'><button type="button" onClick={() => setView('reset')} className='text-xs text-gray-400 hover:text-yellow-500 transition-colors'>Forgot Password?</button></div>
                  </div>
                  <SubmitButton loading={loading} text="Sign In" />
                </form>
              ) : (
                // --- ✅ NEW PHONE OTP FORM ---
                <div className="space-y-5">
                  {!otpSent ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="relative group w-full">
                        <FiPhone className="absolute left-3 top-3.5 text-gray-500" />
                        <span className="absolute left-10 top-3.5 text-gray-400 font-bold text-sm">+91</span>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          className="w-full bg-black/40 text-white pl-20 pr-4 py-3 rounded-lg border border-white/10 focus:border-yellow-500/50 outline-none transition-all placeholder-gray-600 text-sm tracking-widest font-mono"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                      </div>
                      <button onClick={handleSendOtp} disabled={loading || phoneNumber.length < 10} className="w-full bg-yellow-600 text-black font-bold py-3 rounded-lg shadow-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <FiLoader className="animate-spin" /> : <>Get OTP <FiArrowRight /></>}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <div className="text-center mb-2"><p className="text-xs text-gray-400">OTP sent to +91 {phoneNumber}</p><button onClick={() => setOtpSent(false)} className="text-[10px] text-yellow-500 hover:underline">Change Number</button></div>
                      <input
                        type="text"
                        placeholder="• • • • • •"
                        className="w-full text-center bg-black/40 text-white py-3 rounded-lg border border-white/10 focus:border-yellow-500/50 outline-none text-xl tracking-[0.5em] font-mono"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                      <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-green-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <FiLoader className="animate-spin" /> : <>Verify & Login <FiCheckCircle /></>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* COMMON FOOTER */}
              <div className="flex items-center my-4"><div className="flex-grow h-px bg-white/10"></div><span className="px-3 text-gray-500 text-xs">OR</span><div className="flex-grow h-px bg-white/10"></div></div>
              <GoogleButton onClick={handleGoogleLogin} />
              <p className="text-center text-gray-500 text-sm mt-4">New to Zerimi? <button type="button" onClick={() => setView('register')} className="text-yellow-500 hover:underline">Create Account</button></p>
            </motion.div>
          )}

          {/* --- VIEW: COMPLETE PROFILE (POPUP) --- */}
          {/* ✅ Jab naya mobile user login karega, ye dikhega */}
          {view === 'complete-profile' && (
            <motion.form
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleCompleteProfile}
              className="space-y-5"
            >
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500"><FiUser className="w-8 h-8" /></div>
                <h3 className="text-white font-serif text-xl">Almost There!</h3>
                <p className="text-gray-400 text-xs">Please provide your details to complete registration.</p>
              </div>

              <InputField icon={FiUser} type="text" placeholder="Full Name" name="name" value={formData.name} onChange={handleChange} />
              <InputField icon={FiMail} type="email" placeholder="Email Address" name="email" value={formData.email} onChange={handleChange} />
              
              {/* Mobile Field (Disabled/Read-only) */}
              <div className="relative group w-full opacity-60 cursor-not-allowed">
                <FiPhone className="absolute left-3 top-3.5 text-gray-500" />
                <input disabled value={formData.mobile} className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 font-mono text-sm" />
              </div>

              <SubmitButton loading={loading} text="Complete Setup" />
            </motion.form>
          )}

          {/* --- VIEW: REGISTER (Standard) --- */}
          {view === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <InputField icon={FiUser} type="text" placeholder="Full Name" name="name" value={formData.name} onChange={handleChange} />
                <InputField icon={FiPhone} type="tel" placeholder="Mobile No." name="mobile" value={formData.mobile} onChange={handleChange} />
              </div>
              <InputField icon={FiMail} type="email" placeholder="Email Address" name="email" value={formData.email} onChange={handleChange} />
              <InputField icon={FiHome} type="text" placeholder="Full Address" name="address" value={formData.address} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-3">
                <InputField icon={FiMapPin} type="text" placeholder="City" name="city" value={formData.city} onChange={handleChange} />
                <InputField icon={FiMapPin} type="text" placeholder="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField icon={BiMaleFemale} name="gender" value={formData.gender} onChange={handleChange}><option value="" disabled>Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></SelectField>
                <SelectField icon={BiDiamond} name="vibe" value={formData.vibe} onChange={handleChange}><option value="" disabled>Your Style</option><option value="Classic">Classic</option><option value="Modern">Modern</option><option value="Extravagant">Extravagant</option></SelectField>
              </div>
              <InputField icon={FiLock} type="password" placeholder="Create Password" name="password" value={formData.password} onChange={handleChange} />
              <div className="flex items-start gap-3 mt-2 px-1"><input type="checkbox" id="terms" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} className="mt-1 w-4 h-4 accent-yellow-500 cursor-pointer" /><label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer leading-tight">I agree to <Link href="/terms" className="text-yellow-500 hover:underline">Terms</Link> & <Link href="/privacy" className="text-yellow-500 hover:underline">Privacy</Link>.</label></div>
              <SubmitButton loading={loading} text="Join the Elite" />
              <p className="text-center text-gray-500 text-sm mt-4">Already a member? <button type="button" onClick={() => setView('login')} className="text-yellow-500 hover:underline">Sign In</button></p>
            </motion.form>
          )}

          {/* --- VIEW: RESET PASSWORD --- */}
          {view === 'reset' && (
            <motion.form key="reset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onSubmit={handleResetPassword} className="space-y-5">
              <div className='text-center text-gray-400 text-sm mb-4 px-4'>Enter your email address to recover your premium access.</div>
              <InputField icon={FiMail} type="email" placeholder="Enter your email" name="email" value={formData.email} onChange={handleChange} />
              <SubmitButton loading={loading} text="Send Recovery Link" />
              <button type="button" onClick={() => setView('login')} className="w-full text-gray-400 text-sm hover:text-white flex items-center justify-center gap-2 mt-4"><FiArrowLeft /> Back to Login</button>
            </motion.form>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- Reusable Components ---
const InputField = ({ icon: Icon, ...props }: any) => (
  <div className="relative group w-full">
    <Icon className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
    <input {...props} className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder-gray-600 text-sm" />
  </div>
);

const SelectField = ({ icon: Icon, children, ...props }: any) => (
  <div className="relative group w-full">
    <Icon className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
    <select {...props} className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all text-sm appearance-none cursor-pointer">{children}</select>
  </div>
);

const SubmitButton = ({ loading, text }: any) => (
  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-700 to-yellow-500 text-black font-bold py-3 rounded-lg shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
    {loading ? 'Processing...' : <>{text} <FiArrowRight /></>}
  </motion.button>
);

const GoogleButton = ({ onClick }: any) => (
  <motion.button type="button" onClick={onClick} whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.98 }} className="w-full bg-transparent border border-white/20 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 hover:border-white/50 transition-all">
    <FcGoogle className="text-xl" /> <span className="font-medium text-sm">Continue with Google</span>
  </motion.button>
);

export default AuthPage;