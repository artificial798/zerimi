"use client";

import { useState, useRef } from "react";
import { useStore, Review } from "@/lib/store";
import {
  Star, X, ChevronLeft, ChevronRight, Quote, Grid, Crown, 
  PenTool, UploadCloud, Loader2, ThumbsUp, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/* ================= HELPFUL BUTTON COMPONENT ================= */
const HelpfulButton = ({ initialCount = 0 }: { initialCount?: number }) => {
    const [liked, setLiked] = useState(false);
    const [count, setCount] = useState(initialCount || Math.floor(Math.random() * 5));

    const handleLike = () => {
        setLiked(!liked);
        setCount(prev => liked ? prev - 1 : prev + 1);
    };

    return (
        <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-all px-3 py-1.5 rounded-full border ${
                liked 
                ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
                : 'bg-stone-50 text-stone-400 border-transparent hover:bg-stone-100'
            }`}
        >
            <ThumbsUp className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
            {liked ? `Helpful (${count})` : `Helpful ${count > 0 ? `(${count})` : ''}`}
        </button>
    );
};

/* ================= DRAWER ================= */
const ReviewsDrawer = ({ isOpen, onClose, reviews }: any) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />

        <motion.aside
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28 }}
          className="fixed right-0 top-0 h-full w-full sm:w-[420px] md:w-[500px] bg-[#FAF9F6] z-[70] shadow-2xl flex flex-col border-l border-[#D4AF37]/30"
        >
          <div className="p-6 border-b flex justify-between items-center bg-white">
            <div>
              <h3 className="font-serif text-xl text-[#0B1F1C]">The Collection</h3>
              <p className="text-[10px] tracking-widest uppercase text-stone-400">{reviews.length} Stories</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition"><X /></button>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#0B1F1C] text-[#D4AF37] flex items-center justify-center font-serif border border-[#D4AF37]/20">
                    {r.userName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                        {r.userName}
                        {r.verified && (
                             <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-green-50" />
                             </motion.span>
                        )}
                    </p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-stone-300"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-stone-600 mb-4 font-light leading-relaxed">{r.comment}</p>
                {r.image && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-100 mb-4">
                    <Image src={r.image} alt="review" fill className="object-cover" />
                  </div>
                )}
                <HelpfulButton />
              </div>
            ))}
          </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

/* ================= MAIN ================= */
export default function ProductReviews({ productId }: { productId: string }) {
  const { reviews, addReview, currentUser } = useStore() as any;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const storageRef = ref(storage, `reviews/${Date.now()}-${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        setReviewImage(await getDownloadURL(snap.ref));
    } catch(err) { alert("Upload Failed"); }
    finally { setIsUploading(false); }
  };

  const submitReview = (e: any) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      productId,
      userName: currentUser?.name || "Guest User",
      rating,
      comment,
      image: reviewImage,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      verified: !!currentUser,
    };

    addReview(newReview);
    setShowForm(false); setRating(0); setComment(""); setReviewImage(null);
  };

  const productReviews = reviews.filter((r: any) => r.productId === productId);
  const sortedReviews = [...productReviews].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const next = () => setCurrentIndex((p) => (p + 1) % sortedReviews.length);
  const prev = () => setCurrentIndex((p) => (p - 1 + sortedReviews.length) % sortedReviews.length);

  return (
    <section className="bg-[#FAF9F6] py-16 px-4 md:py-24" id="reviews-section">
      <div className="text-center mb-10 md:mb-14">
        <p className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-[#D4AF37] mb-3">Royal Testimonials</p>
        <h2 className="font-serif text-3xl md:text-6xl text-[#0B1F1C]">The Jewelry Diary</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="mt-8 md:mt-10 px-8 py-3.5 bg-[#0B1F1C] text-[#D4AF37] uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-[#D4AF37] hover:text-[#0B1F1C] transition shadow-lg flex items-center mx-auto border border-[#D4AF37]/30">
            <PenTool className="w-4 h-4 mr-2" /> Write Your Story
          </button>
        )}
      </div>

      {/* WRITE FORM */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            onSubmit={submitReview} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-2xl mb-12 border border-[#D4AF37]/20"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-serif text-xl md:text-2xl">Craft Your Review</h3>
              <X onClick={() => setShowForm(false)} className="cursor-pointer hover:text-red-500 transition" />
            </div>

            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} onClick={() => setRating(s)} className={`w-7 h-7 md:w-8 md:h-8 cursor-pointer transition-transform hover:scale-110 ${s <= rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-stone-200"}`} />
              ))}
            </div>

            <textarea 
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..." className="w-full bg-[#fcfbf9] p-4 rounded-xl border border-stone-100 text-base md:text-lg font-serif outline-none mb-6 resize-none focus:border-[#D4AF37] transition" rows={4} 
            />

            <div className="mb-8">
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />
              {!reviewImage && !isUploading && (
                <div onClick={() => fileRef.current?.click()} className="w-full h-28 md:h-32 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 cursor-pointer hover:bg-stone-50 transition">
                  <UploadCloud className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">Add a photo</span>
                </div>
              )}
              {isUploading && (
                <div className="w-full h-28 bg-stone-50 rounded-xl flex items-center justify-center gap-3 text-[#D4AF37]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Uploading...</span>
                </div>
              )}
              {reviewImage && (
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-md group">
                  <Image src={reviewImage} alt="preview" fill className="object-cover" />
                  <div onClick={() => setReviewImage(null)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition"><X className="text-white w-5 h-5" /></div>
                </div>
              )}
            </div>

            <button type="submit" disabled={isUploading} className="w-full py-4 bg-[#0B1F1C] text-[#D4AF37] uppercase tracking-widest font-bold hover:bg-[#D4AF37] hover:text-[#0B1F1C] transition disabled:opacity-50 text-[11px] md:text-xs">
              {isUploading ? "Uploading..." : "Publish Review"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ================= MAIN CARD ================= */}
      {sortedReviews.length === 0 ? (
        <div className="text-center text-stone-400 font-serif text-lg md:text-xl italic py-10">“Be the first to grace this diary.”</div>
      ) : (
        <div className="
          max-w-5xl mx-auto
          bg-[#0B1F1C]
          rounded-[2rem] md:rounded-[2.5rem]
          shadow-[0_40px_100px_-25px_rgba(0,0,0,0.7)]
          overflow-hidden
          grid md:grid-cols-2
          relative border border-[#D4AF37]/20
        ">
          {/* LEFT (Info) */}
          <div className="p-8 md:p-10 text-[#D4AF37] relative flex flex-col justify-between order-1">
            <Crown className="absolute bottom-4 right-4 opacity-[0.05] w-24 h-24 md:w-32 md:h-32 pointer-events-none" />
            <div>
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#D4AF37] text-[#0B1F1C] flex items-center justify-center font-serif text-xl md:text-2xl shadow-lg border border-white/10">
                  {sortedReviews[currentIndex].userName[0]}
                </div>
                <div>
                  <p className="font-serif text-lg md:text-xl text-white">{sortedReviews[currentIndex].userName}</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < sortedReviews[currentIndex].rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white/20"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {sortedReviews[currentIndex].verified && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3 text-green-400" />
                           <span className="text-[9px] text-white/60 uppercase tracking-widest">Verified Owner</span>
                        </motion.div>
                    )}
                    <span className="text-white/20 hidden md:inline">|</span>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">{sortedReviews[currentIndex].date}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 md:gap-4">
              <button onClick={prev} className="w-10 h-10 md:w-12 md:h-12 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#0B1F1C] transition">
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button onClick={next} className="w-10 h-10 md:w-12 md:h-12 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#0B1F1C] transition">
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* RIGHT (Comment) - Fixed Mobile Height and Box Size */}
          <div className="p-8 md:p-10 bg-[#FAF9F6] relative flex flex-col justify-center min-h-[220px] md:min-h-[300px] order-2">
            <Quote className="absolute top-4 left-4 text-[#D4AF37]/10 w-10 h-10 md:w-16 md:h-16 rotate-180" />
            <div className="relative z-10">
              <p className="font-serif text-lg md:text-3xl text-[#0B1F1C] italic leading-relaxed mb-6 md:mb-8">“{sortedReviews[currentIndex].comment}”</p>
              
              <div className="flex items-end justify-between">
                 {sortedReviews[currentIndex].image ? (
                   <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden shadow-xl border-4 border-white">
                     <Image src={sortedReviews[currentIndex].image} alt="review" fill className="object-cover" />
                   </div>
                 ) : <div className="w-1 h-1"></div>}
                 
                 <HelpfulButton key={sortedReviews[currentIndex].id} />
              </div>
            </div>

            <button onClick={() => setIsDrawerOpen(true)} className="absolute top-6 right-6 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 hover:text-[#D4AF37] transition flex items-center">
              <Grid className="w-3.5 h-3.5 mr-1.5" /> View All
            </button>
          </div>
        </div>
      )}

      <ReviewsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} reviews={sortedReviews} />
    </section>
  );
}