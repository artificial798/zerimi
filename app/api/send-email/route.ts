import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OrderEmail } from '../../../components/emails/OrderEmail';

// Debug: Check karo ki API Key load hui ya nahi
console.log("API Key Loaded:", process.env.RESEND_API_KEY ? "YES ✅" : "NO ❌");

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log("1. API Route Hit hua"); // Step 1

    const body = await request.json();
    console.log("2. Data receive hua:", body); // Step 2

    const { email, name, orderId, amount } = body;

    // Validation
    if (!email || !orderId) {
       console.log("❌ Missing Data");
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log("3. Email bhejne ki koshish..."); // Step 3

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zerimi.luxury@gmail.com', // ⚠️ FILHAL YE RAKHO (Ye hamesha success deta hai testing ke liye)
      subject: `Order Confirmed: #${orderId}`,
      react: OrderEmail({ 
        customerName: name, 
        orderId: orderId, 
        amount: amount 
      }),
    });

    console.log("4. Resend Response:", data); // Step 4: Agar yahan error aaya to dikhega

    if (data.error) {
        console.error("❌ Resend API Error:", data.error);
        return NextResponse.json({ error: data.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    // ASLI ERROR YAHAN DIKHEGA
    console.error("🔥🔥 SERVER CRASH ERROR:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}