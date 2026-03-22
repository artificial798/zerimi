import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OrderEmail } from '../../../components/emails/OrderEmail';
import { render } from '@react-email/render';
import * as React from 'react';

// Next.js 15 ke liye nodejs runtime zyada stable hai email rendering mein
export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, orderId, amount } = body;

    if (!email || !orderId || !amount) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // FIX: React component ko pehle hi HTML string mein render kar lena
    // Isse 'recentlyCreatedOwnerStacks' wala error hamesha ke liye khatam ho jayega
    const emailHtml = await render(
      React.createElement(OrderEmail, {
        customerName: name,
        orderId: orderId,
        amount: amount,
      })
    );

    const { data, error } = await resend.emails.send({
      from: 'Zerimi <noreply@zerimi.in>', // Change to noreply@zerimi.in once verified
      to: [email],
      bcc: 'zerimi.luxury@gmail.com',
      subject: `✨ Order Confirmed: #${orderId} | ZERIMI`,
      html: emailHtml, // Ab hum 'react' ki jagah seedha 'html' bhej rahe hain
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });

  } catch (error: any) {
    console.error("🔥🔥 SERVER ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}