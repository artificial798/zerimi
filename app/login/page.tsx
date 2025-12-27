"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ✅ Firebase Imports (Path check kar lein: '../../lib/firebase' ya '@/lib/firebase')
import { auth, googleProvider, db } from '../../lib/firebase'; 
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 

import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { 
  FiLock, FiMail, FiUser, FiArrowRight, FiArrowLeft, 
  FiPhone, FiX // ✅ Added FiX icon
} from 'react-icons/fi';
import { BiMaleFemale, BiDiamond } from 'react-icons/bi';

const AuthPage = () => {
  const router = useRouter(); 

  // --- State ---
  const [view, setView] = useState('login'); // 'login' | 'register' | 'reset'
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    gender: '', 
    vibe: '', 
    agreeToTerms: false
  });

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // --- Toasts (Fixed: Auto Close Timer) ---
  const notifySuccess = (msg: string) => toast.success(msg, {
    duration: 3000, // ✅ 3 second mein gayab
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

  // --- Handlers ---
  
  // 1. LOGIN
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

  // 2. REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name) return notifyError("Name is required.");
    if(!formData.mobile) return notifyError("Mobile number is required.");
    if(!formData.agreeToTerms) return notifyError("You must agree to Terms & Privacy Policy.");
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.name });
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        gender: formData.gender,
        preference: formData.vibe,
        role: 'customer', 
        createdAt: new Date(),
        termsAccepted: true
      });
      
      notifySuccess(`Account created! Welcome to the Elite.`);
      router.push('/dashboard');
    } catch (error: any) {
      notifyError(cleanErrorMessage(error.message));
      setLoading(false);
    }
  };

  // 3. GOOGLE LOGIN
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
          method: 'google'
        });
      }
      notifySuccess('Signed in with Google.');
      router.push('/dashboard');
    } catch (error) {
      notifyError('Google Sign-In failed.');
    }
  };

  // 4. RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return notifyError("Please enter your email first.");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      notifySuccess('Password reset link sent.');
      setView('login'); 
    } catch (error: any) {
      notifyError(cleanErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
      
      <Toaster position="top-center" />

      {/* ✅ NEW: Back/Close Button (Top Left) */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 z-50 text-white/50 hover:text-white flex items-center gap-2 transition-all group"
      >
        <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md border border-white/5">
            <FiX className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium hidden md:block tracking-wide">Return Home</span>
      </button>

      <motion.div 
        layout
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 
            className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 tracking-widest font-bold mb-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            ZERIMI
          </h1>
          <p className="text-gray-400 text-xs tracking-[0.2em] uppercase">
            {view === 'login' && 'Access Your Luxury'}
            {view === 'register' && 'Join the Elite Circle'}
            {view === 'reset' && 'Recover Access'}
          </p>
        </div>

        <AnimatePresence mode='wait'>
          
          {/* --- LOGIN VIEW --- */}
          {view === 'login' && (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} 
              className="space-y-5"
            >
              <InputField icon={FiMail} type="email" placeholder="Email Address" name="email" value={formData.email} onChange={handleChange} />
              <div className='space-y-1'>
                <InputField icon={FiLock} type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} />
                <div className='text-right'>
                  <button type="button" onClick={() => setView('reset')} className='text-xs text-gray-400 hover:text-yellow-500 transition-colors'>
                    Forgot Password?
                  </button>
                </div>
              </div>

              <SubmitButton loading={loading} text="Sign In" />
              
              <div className="flex items-center my-4"><div className="flex-grow h-px bg-white/10"></div><span className="px-3 text-gray-500 text-xs">OR</span><div className="flex-grow h-px bg-white/10"></div></div>
              <GoogleButton onClick={handleGoogleLogin} />
              
              <p className="text-center text-gray-500 text-sm mt-4">
                New to Zerimi? <button type="button" onClick={() => setView('register')} className="text-yellow-500 hover:underline">Create Account</button>
              </p>
            </motion.form>
          )}

          {/* --- REGISTER VIEW --- */}
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
              
              <div className="grid grid-cols-2 gap-3">
                <SelectField icon={BiMaleFemale} name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="" disabled>Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </SelectField>

                <SelectField icon={BiDiamond} name="vibe" value={formData.vibe} onChange={handleChange}>
                  <option value="" disabled>Your Style</option>
                  <option value="Classic">Classic</option>
                  <option value="Modern">Modern</option>
                  <option value="Extravagant">Extravagant</option>
                </SelectField>
              </div>

              <InputField icon={FiLock} type="password" placeholder="Create Password" name="password" value={formData.password} onChange={handleChange} />

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 mt-2 px-1">
                <input 
                  type="checkbox" 
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 accent-yellow-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer leading-tight">
                  I agree to the{' '}
                  <Link href="/terms" className="text-yellow-500 hover:underline hover:text-yellow-400 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-yellow-500 hover:underline hover:text-yellow-400 transition-colors">
                    Privacy Policy
                  </Link>.
                </label>
              </div>

              <SubmitButton loading={loading} text="Join the Elite" />
              
              <p className="text-center text-gray-500 text-sm mt-4">
                Already a member? <button type="button" onClick={() => setView('login')} className="text-yellow-500 hover:underline">Sign In</button>
              </p>
            </motion.form>
          )}

          {/* --- RESET VIEW --- */}
          {view === 'reset' && (
            <motion.form 
              key="reset"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              onSubmit={handleResetPassword} 
              className="space-y-5"
            >
              <div className='text-center text-gray-400 text-sm mb-4 px-4'>
                Enter your email address to recover your premium access.
              </div>
              <InputField icon={FiMail} type="email" placeholder="Enter your email" name="email" value={formData.email} onChange={handleChange} />

              <SubmitButton loading={loading} text="Send Recovery Link" />
              
              <button type="button" onClick={() => setView('login')} className="w-full text-gray-400 text-sm hover:text-white flex items-center justify-center gap-2 mt-4">
                <FiArrowLeft /> Back to Login
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- Reusable Components (Fixed Types) ---

const InputField = ({ icon: Icon, ...props }: any) => (
  <div className="relative group w-full">
    <Icon className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
    <input 
      {...props}
      className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder-gray-600 text-sm"
    />
  </div>
);

const SelectField = ({ icon: Icon, children, ...props }: any) => (
  <div className="relative group w-full">
    <Icon className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
    <select 
      {...props}
      className="w-full bg-black/40 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all text-sm appearance-none cursor-pointer"
    >
      {children}
    </select>
  </div>
);

const SubmitButton = ({ loading, text }: any) => (
  <motion.button
    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    type="submit" disabled={loading}
    className="w-full bg-gradient-to-r from-yellow-700 to-yellow-500 text-black font-bold py-3 rounded-lg shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? 'Processing...' : <>{text} <FiArrowRight /></>}
  </motion.button>
);

const GoogleButton = ({ onClick }: any) => (
  <motion.button
    type="button" onClick={onClick}
    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.98 }}
    className="w-full bg-transparent border border-white/20 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 hover:border-white/50 transition-all"
  >
    <FcGoogle className="text-xl" /> <span className="font-medium text-sm">Continue with Google</span>
  </motion.button>
);

export default AuthPage;