"use client";
import { useState, useRef } from 'react';
import { useStore, Review } from '@/lib/store';
import { Star, Check, User, ThumbsUp, Camera, SlidersHorizontal, Image as ImageIcon, X, UploadCloud, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// --- FIREBASE IMPORTS ---
import { storage } from '@/lib/firebase'; // Ensure this is exported from your firebase.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProductReviews({ productId }: { productId: string }) {
  const { reviews, addReview, currentUser } = useStore() as any;
  
  // Form States
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Image upload loading state
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- REAL CLOUD UPLOAD FUNCTION ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      
      // 2. Create Reference (reviews/timestamp-filename)
      const uniqueName = `reviews/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, uniqueName);
      
      // 3. Upload File
      const snapshot = await uploadBytes(storageRef, file);
      
      // 4. Get Public URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setReviewImage(downloadURL);
      console.log("Image Uploaded:", downloadURL);

    } catch (error) {
      console.error("Upload Failed:", error);
      alert("Failed to upload image. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setReviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- SORTING & FILTERING ---
  const productReviews = reviews.filter((r: any) => r.productId === productId);
  
  const sortedReviews = [...productReviews].sort((a: any, b: any) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
  });

  const averageRating = productReviews.length > 0 
    ? (productReviews.reduce((acc: any, r: any) => acc + r.rating, 0) / productReviews.length).toFixed(1)
    : "0.0";

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  productReviews.forEach((r: any) => { if(r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating as keyof typeof ratingCounts]++ });

  // --- SUBMIT REVIEW ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a rating');
    if (!comment.trim()) return alert('Please write a review');

    setIsSubmitting(true);

    const newReview: Review = {
      id: Date.now().toString(),
      productId,
      userName: currentUser ? currentUser.name : 'Guest User',
      rating,
      comment,
      image: reviewImage, // Save the Firebase URL
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      verified: !!currentUser
    };

    setTimeout(() => {
      addReview(newReview);
      // Reset Form
      setComment('');
      setRating(0);
      setReviewImage(null);
      setIsSubmitting(false);
      setShowForm(false);
    }, 800);
  };

  return (
    <div className="py-16 border-t border-stone-100 bg-white" id="reviews-section">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row gap-12 mb-12">
          {/* Left: Summary */}
          <div className="flex-1">
              <h3 className="font-serif text-2xl text-[#0a1f1c] mb-6">Customer Reviews</h3>
              <div className="flex items-center gap-4 mb-8">
                  <div className="text-5xl font-serif text-[#0a1f1c]">{averageRating}</div>
                  <div>
                      <div className="flex text-amber-500 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                             <Star key={s} className={`w-4 h-4 ${Number(averageRating) >= s ? 'fill-current' : 'text-stone-200'}`} />
                          ))}
                      </div>
                      <p className="text-xs text-stone-500">Based on {productReviews.length} reviews</p>
                  </div>
              </div>

              {/* Rating Bars */}
              <div className="space-y-2 max-w-sm">
                  {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star as keyof typeof ratingCounts];
                      const percent = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0;
                      return (
                          <div key={star} className="flex items-center gap-3 text-xs text-stone-500">
                              <span className="w-3">{star}</span>
                              <Star className="w-3 h-3 text-stone-300" />
                              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#0a1f1c] rounded-full" style={{ width: `${percent}%` }}></div>
                              </div>
                              <span className="w-6 text-right">{count}</span>
                          </div>
                      )
                  })}
              </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex flex-col items-end justify-center gap-4">
               <div className="text-right">
                   <h4 className="font-serif text-lg text-[#0a1f1c] mb-1">Have you worn this?</h4>
                   <p className="text-sm text-stone-500 mb-4">Share your thoughts with other customers.</p>
               </div>
               <button 
                 onClick={() => setShowForm(!showForm)}
                 className="bg-[#0a1f1c] text-white px-8 py-4 rounded-xl text-xs uppercase tracking-[0.15em] font-bold hover:bg-amber-600 transition shadow-lg flex items-center gap-2"
               >
                 {showForm ? 'Cancel' : 'Write a Review'}
               </button>
          </div>
      </div>

      {/* WRITE REVIEW FORM */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit} 
            className="bg-stone-50 p-6 md:p-8 rounded-2xl mb-12 overflow-hidden border border-stone-200"
          >
            <h4 className="font-serif text-lg text-[#0a1f1c] mb-6">How was your experience?</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                   <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Rating</label>
                   <div className="flex gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <button
                         key={star} type="button"
                         onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setRating(star)}
                         className="focus:outline-none transition-transform hover:scale-110"
                       >
                         <Star className={`w-8 h-8 ${ (hoveredStar || rating) >= star ? 'text-amber-500 fill-current' : 'text-stone-300' }`} />
                       </button>
                     ))}
                   </div>
                </div>
                
                {/* --- IMAGE UPLOAD (With Loader) --- */}
                <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Add Photo (Optional)</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden" 
                        id="review-image-upload"
                    />

                    {!reviewImage && !isUploading && (
                        <label 
                            htmlFor="review-image-upload"
                            className="w-full h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 cursor-pointer hover:bg-white hover:border-amber-500 hover:text-amber-600 transition-all duration-300"
                        >
                            <div className="p-2 bg-stone-100 rounded-full group-hover:bg-amber-100">
                                <UploadCloud className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold">Click to Upload Image</span>
                        </label>
                    )}

                    {isUploading && (
                        <div className="w-full h-32 bg-stone-100 rounded-xl flex items-center justify-center gap-2 text-stone-500">
                             <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                             <span className="text-xs font-bold">Uploading to Cloud...</span>
                        </div>
                    )}

                    {reviewImage && !isUploading && (
                        <div className="relative w-full h-32 bg-stone-200 rounded-xl overflow-hidden border border-stone-300 group">
                            <Image src={reviewImage} alt="Preview" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <button 
                                    type="button" 
                                    onClick={removeImage}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
               <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Review</label>
               <textarea 
                 rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
                 className="w-full p-4 border border-stone-200 rounded-xl focus:border-amber-500 outline-none resize-none text-sm bg-white"
                 placeholder="The quality is amazing and fits perfectly..."
               />
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting || isUploading} className="bg-[#0a1f1c] text-white px-8 py-3 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-amber-600 transition disabled:opacity-50">
                   {isSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* FILTER BAR */}
      <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-8">
          <p className="text-sm text-stone-500 font-bold">{productReviews.length} Reviews</p>
          <div className="flex items-center gap-2 relative group cursor-pointer">
              <SlidersHorizontal className="w-4 h-4 text-stone-500"/>
              <select 
                value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold uppercase tracking-widest text-[#0a1f1c] bg-transparent outline-none cursor-pointer"
              >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
              </select>
          </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-8">
        {sortedReviews.length === 0 ? (
           <div className="text-center py-12 bg-stone-50 rounded-2xl">
               <Star className="w-12 h-12 text-stone-300 mx-auto mb-4" />
               <p className="text-stone-500 italic mb-4">No reviews yet. Be the first to share your experience.</p>
               <button onClick={() => setShowForm(true)} className="text-amber-600 text-xs font-bold uppercase underline">Write a Review</button>
           </div>
        ) : (
           sortedReviews.map((review: any) => (
             <div key={review.id} className="border-b border-stone-100 pb-8 last:border-0 animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center text-stone-500 font-bold shadow-inner uppercase">
                         {review.userName.charAt(0)}
                      </div>
                      <div>
                          <p className="font-bold text-[#0a1f1c] text-sm flex items-center gap-2">
                             {review.userName}
                             {review.verified && <span className="text-[9px] bg-[#0a1f1c] text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider"><Check className="w-2 h-2" /> Verified</span>}
                          </p>
                          <div className="flex text-amber-500 text-xs mt-1">
                             {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-stone-200'}`} />)}
                          </div>
                      </div>
                   </div>
                   <span className="text-xs text-stone-400 font-mono">{review.date}</span>
                </div>
                
                <p className="text-stone-600 text-sm leading-relaxed pl-14 mb-4">{review.comment}</p>
                
                {/* --- DISPLAY UPLOADED PHOTO --- */}
                {review.image && (
                    <div className="pl-14 mb-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-200 cursor-pointer hover:opacity-90 transition group">
                            <Image src={review.image} alt="Customer Photo" fill className="object-cover" />
                            {/* Zoom Icon on Hover */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-white"/>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Helpful & Actions */}
                <div className="pl-14 flex items-center gap-6">
                    <button className="flex items-center gap-2 text-xs text-stone-400 hover:text-[#0a1f1c] transition group">
                        <ThumbsUp className="w-3 h-3 group-hover:scale-110 transition" /> Helpful
                    </button>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}