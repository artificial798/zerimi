"use client";
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Image from 'next/image';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';

export default function BlogPage() {
  const { id } = useParams();
  const router = useRouter();
  const { blogs } = useStore();
  
  const blog = blogs.find(b => b.id === id);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 pt-32">
        <div className="text-center">
           <h2 className="text-2xl font-serif text-stone-900 mb-4">Article Not Found</h2>
           <button onClick={() => router.back()} className="text-amber-700 underline">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 mb-8 transition">
           <ArrowLeft className="w-4 h-4" /> Back to Journal
        </button>

        <div className="text-center mb-10">
           <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {blog.category}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blog.date}</span>
           </p>
           <h1 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight mb-8">{blog.title}</h1>
        </div>

        <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden shadow-xl">
           <Image src={blog.image} alt={blog.title} fill className="object-cover" priority />
        </div>

        <article className="prose prose-stone prose-lg mx-auto text-stone-700 leading-relaxed font-serif">
           {/* If content is empty, show placeholder */}
           {blog.content ? (
             <div dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }} />
           ) : (
             <p className="text-stone-400 italic">No content added yet.</p>
           )}
        </article>

      </div>
    </div>
  );
}