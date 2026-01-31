"use client";
import { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function ContactPage() {
  const { sendMessage } = useStore() as any;
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendMessage(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a1f1c] min-h-screen pt-24 font-sans text-white overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      {/* 🌟 HERO SECTION */}
      <div className="relative text-center py-20 px-6">
         {/* Glows */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
         
         <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 relative z-10">Get in Touch</h1>
         <p className="text-white/60 max-w-lg mx-auto text-lg font-light relative z-10">
            Have a question or need styling advice? Our concierge team is here to assist you.
         </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 📍 INFO CARD (Dark Glassmorphism) */}
          <div className="bg-white/5 backdrop-blur-md p-10 rounded-[2rem] border border-white/10 h-fit lg:col-span-1 shadow-2xl">
            <h3 className="text-2xl font-serif text-white mb-8 border-b border-white/10 pb-6">Contact Information</h3>
            
            <div className="space-y-8">
              <div className="flex items-start gap-5 group">
                 <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:bg-amber-500 group-hover:text-black transition duration-300">
                    <MapPin className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-1">Visit Our Boutique</h5>
                    <p className="text-white/60 text-sm leading-relaxed">Main Market, Delhi-Road near Tehsil<br/>Baraut (Baghpat), UP - 250611</p>
                 </div>
              </div>

              <div className="flex items-start gap-5 group">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition duration-300">
                    <Phone className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-1">Call Us</h5>
                    <p className="text-white/60 text-sm leading-relaxed">+91 8077162909</p>
                    <p className="text-[10px] text-white/30 mt-1">Mon-Sat • 10 AM to 7 PM</p>
                 </div>
              </div>

              <div className="flex items-start gap-5 group">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 flex-shrink-0 group-hover:bg-purple-500 group-hover:text-black transition duration-300">
                    <Mail className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-1">Email Concierge</h5>
                    <p className="text-white/60 text-sm leading-relaxed">support@zerimi.in</p>
                    <p className="text-[10px] text-white/30 mt-1">Response within 24 hours</p>
                 </div>
              </div>
            </div>
          </div>

          {/* ✉️ CONTACT FORM */}
          <div className="bg-[#0f2925] p-10 rounded-[2rem] shadow-2xl border border-white/5 lg:col-span-2 relative overflow-hidden">
            
            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-fade-in relative z-10">
                 <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                 </div>
                 <h3 className="text-3xl font-serif text-white">Message Received</h3>
                 <p className="text-white/50 mt-3 max-w-sm">Thank you for contacting ZERIMI. Our team will review your request and get back to you shortly.</p>
                 <button onClick={() => setSubmitted(false)} className="mt-8 text-amber-500 hover:text-white underline text-xs font-bold uppercase tracking-widest transition">Send another message</button>
              </div>
            ) : (
              <div className="relative z-10">
                <h3 className="text-2xl font-serif text-white mb-2">Send us a Message</h3>
                <p className="text-white/40 text-sm mb-8">Please fill out the form below. We value your feedback.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Full Name</label>
                         <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Ashutosh" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-amber-500/50 outline-none transition placeholder:text-white/20" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Email Address</label>
                         <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="ashutosh@example.com" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-amber-500/50 outline-none transition placeholder:text-white/20" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Phone Number</label>
                         <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="+91..." className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-amber-500/50 outline-none transition placeholder:text-white/20" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Subject</label>
                         <div className="relative">
                             <select name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-amber-500/50 outline-none appearance-none cursor-pointer hover:bg-black/30 transition">
                                <option className="bg-[#0f2925]">General Inquiry</option>
                                <option className="bg-[#0f2925]">Order Status</option>
                                <option className="bg-[#0f2925]">Custom Jewelry Request</option>
                                <option className="bg-[#0f2925]">Feedback / Complaint</option>
                             </select>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Message</label>
                      <textarea required name="message" value={formData.message} onChange={handleChange} placeholder="How can we help you today?" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-amber-500/50 outline-none h-40 resize-none transition placeholder:text-white/20"></textarea>
                   </div>

                   <button disabled={loading} className="bg-white text-[#0a1f1c] px-10 py-4 rounded-xl uppercase tracking-widest text-xs font-bold hover:bg-amber-500 hover:text-white transition w-full md:w-auto flex items-center justify-center gap-3 shadow-lg shadow-white/5">
                      {loading ? 'Sending...' : 'Send Message'}
                      {!loading && <Send className="w-4 h-4" />}
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                   </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}