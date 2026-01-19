import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, orderId, amount } = await request.json();

    // 1. Clean Phone Number (Remove +91 and spaces, keep last 10 digits)
    const cleanPhone = String(phone).replace('+91', '').replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
        return NextResponse.json({ error: "Invalid Phone Number" }, { status: 400 });
    }

    // 2. Fast2SMS API Call
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "route": "q", // Premium Route (Works without DLT)
        "message": `ZERIMI: Thank you! Order #${orderId} of Rs. ${amount} is confirmed. We will ship it soon.`,
        "language": "english",
        "flash": 0,
        "numbers": cleanPhone,
      }),
    });

    const data = await response.json();

    // 3. Success Check
    if (data.return) {
        console.log(`✅ SMS Sent to ${cleanPhone}`);
        return NextResponse.json({ success: true, data });
    } else {
        console.error("❌ Fast2SMS Error:", data.message);
        throw new Error(data.message || "SMS Provider Failed");
    }

  } catch (error: any) {
    console.error("Server SMS Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}