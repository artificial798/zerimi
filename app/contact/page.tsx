"use client";
import { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store'; // Store Import kiya

export default function ContactPage() {
  const { sendMessage } = useStore() as any; // Store se function liya
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State (Inputs ka data yahan aayega)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Asli Database Call
      await sendMessage(formData);
      
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' }); // Form Reset
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12">
      
      {/* HEADER */}
      <div className="bg-[#0a1f1c] text-white py-16 text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]"></div>
         <h1 className="text-4xl md:text-5xl font-serif mb-4 relative z-10">Get in Touch</h1>
         <p className="text-stone-400 max-w-lg mx-auto px-4 relative z-10">We are here to assist you with your jewelry selection.</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* INFO CARD */}
          <div className="bg-white p-8 rounded-xl shadow-xl border border-stone-100 h-fit lg:col-span-1">
            <h3 className="text-xl font-serif text-[#0a1f1c] mb-6 border-b border-stone-100 pb-4">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0"><MapPin className="w-5 h-5" /></div>
                 <div><h5 className="font-bold text-[#0a1f1c] text-sm uppercase">Visit Our Boutique</h5><p className="text-stone-500 text-sm mt-1">Main Market,Delhi-Road near Tehsil<br/>Baraut, India - 250611</p></div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0"><Phone className="w-5 h-5" /></div>
                 <div><h5 className="font-bold text-[#0a1f1c] text-sm uppercase">Call Us</h5><p className="text-stone-500 text-sm mt-1">+91 8077162909</p></div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0"><Mail className="w-5 h-5" /></div>
                 <div><h5 className="font-bold text-[#0a1f1c] text-sm uppercase">Email Us</h5><p className="text-stone-500 text-sm mt-1">support@zerimi.com</p></div>
              </div>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="bg-white p-8 rounded-xl shadow-xl border border-stone-100 lg:col-span-2">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-fade-in">
                 <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                 <h3 className="text-2xl font-serif text-[#0a1f1c]">Message Sent!</h3>
                 <p className="text-stone-500 mt-2">Thank you for contacting ZERIMI. Our concierge will get back to you shortly.</p>
                 <button onClick={() => setSubmitted(false)} className="mt-6 text-amber-600 underline text-sm font-bold">Send another message</button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-serif text-[#0a1f1c] mb-2">Send us a Message</h3>
                <p className="text-stone-500 text-sm mb-6">Fill out the form below and we'll reply within 24 hours.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#0a1f1c] uppercase">Full Name</label>
                         <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="John Doe" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#0a1f1c] uppercase">Email Address</label>
                         <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="john@example.com" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#0a1f1c] uppercase">Phone Number</label>
                         <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="+91..." className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#0a1f1c] uppercase">Subject</label>
                         <select name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-amber-500 outline-none">
                            <option>General Inquiry</option>
                            <option>Order Status</option>
                            <option>Custom Jewelry Request</option>
                            <option>Feedback</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0a1f1c] uppercase">Message</label>
                      <textarea required name="message" value={formData.message} onChange={handleChange} placeholder="How can we help you?" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:border-amber-500 outline-none h-32 resize-none"></textarea>
                   </div>

                   <button disabled={loading} className="bg-[#0a1f1c] text-white px-8 py-4 rounded-lg uppercase tracking-widest text-xs font-bold hover:bg-amber-700 transition w-full md:w-auto flex items-center justify-center gap-2">
                      {loading ? 'Sending...' : 'Send Message'}
                      {!loading && !loading && <Send className="w-4 h-4" />}
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                   </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}