import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, purpose, buyer_name, email, phone, apiKey, authToken } = body;

        // Validation
        if (!apiKey || !authToken) {
            return NextResponse.json({ success: false, error: "Payment Gateway not configured (Keys missing)" });
        }

        // URL: Test mode ke liye 'test.instamojo.com', Live ke liye 'www.instamojo.com'
        // Hum dynamic rakh sakte hain ya live default kar sakte hain.
        // Yahan Live URL hai:
        const url = 'https://www.instamojo.com/api/1.1/payment-requests/';
        
        // Payload (Instamojo documentation ke hisaab se)
        const payload = {
            purpose: purpose,
            amount: amount,
            buyer_name: buyer_name,
            email: email,
            phone: phone,
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zerimi.com'}/checkout/success`, // Success Page URL
            send_email: true,
            send_sms: true,
            allow_repeated_payments: false,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'X-Auth-Token': authToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            return NextResponse.json({ success: true, payment_url: data.payment_request.longurl });
        } else {
            console.error("Instamojo Error:", data);
            // Agar keys galat hain ya data invalid hai
            return NextResponse.json({ success: false, error: JSON.stringify(data.message) || "Payment creation failed" });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}