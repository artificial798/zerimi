import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { messages, cartCount, subtotal } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
    const apiKey = process.env.GROQ_API_KEY;

    // 1. LIVE DATA FETCHING (No Hallucinations)
    const [productsSnap, couponsSnap] = await Promise.all([
      getDocs(query(collection(db, "products"), limit(8))),
      getDocs(collection(db, "coupons"))
    ]);

    const liveInventory = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const activeCoupons = couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. SMART MODEL SWITCHING LOGIC
    // Agar user policy, vision, ya complex comparison maange toh Llama-3.3-70b (Smart)
    // Agar normal chat ya product dikhane ko kahe toh Llama-3.1-8b (Fast)
    const isComplexQuery = lastUserMessage.includes("policy") || 
                           lastUserMessage.includes("vision") || 
                           lastUserMessage.includes("why") || 
                           lastUserMessage.length > 80;

    const selectedModel = isComplexQuery ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

 const systemPrompt = {
  role: "system",
  content: `Aap 'Z-Elite' ho, Zerimi ke exclusive AI concierge.
  
  STRICT BRAND DATA (Sirf yahi information use karein):
  - Founder Vision: Ashutosh's vision is to bridge the gap between traditional artistry and modern aesthetics.
  - Official Address: Main Market, Delhi-Road near Tehsil, Baraut, India - 250611.
  - Contact: +91 8077162909 | support@zerimi.in.
  - Live Inventory: ${JSON.stringify(liveInventory)}
  - Active Coupons: ${JSON.stringify(activeCoupons)}
  
  STRICT POLICIES:
  - Warranty: 6-month warranty (Plating & stone cover).
  - Returns: Easy 3-day return policy.
  - Shipping: Free shipping on orders above ₹1000.
  - Delivery: Estimated 3-5 business days.

  RULES:
  1. DO NOT use any old address (Gurugram/Udyog Vihar). Sirf Baraut wala address hi official hai.
  2. Apni taraf se koi fake coupon code ya product Price mat banao.
  3. Product Card Format: PRODUCT_CARD: {"id":"..", "name":"..", "price":0, "img":"..", "link":"/category/Ring"}
  4. Navigation Map: Use [GOTO: /path] for Rings (/category/Ring), Necklaces (/category/Necklace), Tracking (/track-order), or Dashboard (/dashboard).
  5. Tone: Luxury Hinglish. Client ko VIP feel karwao par Ashutosh (Founder) ka zikr tabhi karo jab brand vision ki baat ho.`
};

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [systemPrompt, ...messages],
        temperature: 0.2, // Low temperature for high accuracy
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
        throw new Error("AI Response Error");
    }

    return NextResponse.json(data.choices[0].message);
  } catch (error) {
    console.error("Z-Elite Error:", error);
    return NextResponse.json({ 
        content: "Maaf kijiye, main abhi live data fetch nahi kar pa raha hoon. Please try again." 
    }, { status: 500 });
  }
}