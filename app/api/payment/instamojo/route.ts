import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, purpose, buyer_name, email, phone, apiKey, authToken } = body;

        // Validation
        if (!apiKey || !authToken) {
            return NextResponse.json({ success: false, error: "Payment Gateway not configured (Keys missing)" });
        }

        // ✅ FIX 1: Auto-Detect Test vs Live Key
        // Agar key "test_" se shuru hoti hai to Test URL, warna Live URL
        const isTestMode = apiKey.startsWith("test_");
        const baseUrl = isTestMode 
            ? "https://test.instamojo.com/api/1.1/" 
            : "https://www.instamojo.com/api/1.1/";

        // ✅ FIX 2: Dynamic Redirect URL (Localhost & Vercel Friendly)
        // Ye code khud pata lagayega ki site kahan chal rahi hai
        const origin = req.headers.get('origin') || 'https://zerimi.vercel.app';

        // ✅ FIX 3: Instamojo requires Form Data, NOT JSON
        const formData = new URLSearchParams();
        formData.append('purpose', purpose);
        formData.append('amount', amount);
        formData.append('buyer_name', buyer_name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('redirect_url', `${origin}/checkout/success`);
        formData.append('send_email', 'True');
        formData.append('send_sms', 'True');
        formData.append('allow_repeated_payments', 'False');

        const response = await fetch(`${baseUrl}payment-requests/`, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'X-Auth-Token': authToken
            },
            body: formData // JSON.stringify hata diya
        });

        const data = await response.json();

        if (data.success) {
            return NextResponse.json({ 
                success: true, 
                payment_url: data.payment_request.longurl,
                id: data.payment_request.id 
            });
        } else {
            console.error("Instamojo Error:", data);
            // Error ko string mein convert karke bhejo taaki frontend par dikhe
            const errorMsg = JSON.stringify(data.message) || "Payment creation failed";
            return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Server Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}