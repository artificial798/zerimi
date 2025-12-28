export const runtime = "nodejs";

import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Frontend se data receive karein
    const body = await req.json();
    const { amount } = body;

    // 2. Validation: Check karein amount hai ya nahi
    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required to create an order." },
        { status: 400 }
      );
    }

    // 3. Razorpay Keys Load karein (.env se)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("❌ Razorpay Keys Missing in .env file");
      return NextResponse.json(
        { error: "Server Configuration Error: Payment keys missing." },
        { status: 500 }
      );
    }

    // 4. Razorpay Instance Banayein
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 5. Order Create Karein
    // Note: Razorpay amount ko 'paise' mein leta hai (1 Rupee = 100 Paise)
    const options = {
      amount: Math.round(Number(amount) * 100), // ₹500 -> 50000 paise
      currency: "INR",
      receipt: "rcpt_" + Date.now().toString().slice(-10), // Unique Receipt ID
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);

    // 6. Successful Response Bhejein
    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      keyId: keyId // Frontend ko Key ID chahiye hoti hai popup kholne ke liye
    });

  } catch (error: any) {
    console.error("🔴 Razorpay Order Creation Error:", error);
    
    // Detailed Error message agar Razorpay se aaya ho
    const errorMessage = error.error?.description || error.message || "Payment initiation failed";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}