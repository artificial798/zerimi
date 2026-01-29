import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { title, body, targetUserEmail } = await req.json();

    // 1. Get Tokens (Logic same rahega)
    let tokens: string[] = [];
    if (targetUserEmail) {
      const usersSnap = await adminDb.collection("users").where("email", "==", targetUserEmail).get();
      if (!usersSnap.empty) {
        const userData = usersSnap.docs[0].data();
        if (userData.fcmTokens) tokens = userData.fcmTokens;
      }
    } else {
      const usersSnap = await adminDb.collection("users").get();
      usersSnap.forEach((doc: any) => {
        const data = doc.data();
        if (data.fcmTokens) tokens.push(...data.fcmTokens);
      });
    }

    const uniqueTokens = [...new Set(tokens)].filter(t => t);
    if (uniqueTokens.length === 0) return NextResponse.json({ success: false, message: "No devices found." });

    // 👇 2. CHANGE IS HERE (Data Message Bhejo)
    const message = {
      // ❌ "notification" key hata di gayi hai (ye duplicate cause kar rahi thi)
      
      // ✅ "data" key use karein (Isse full control milta hai)
      data: {
        title: title,
        body: body,
        link: '/admin', // Click karne par kahan jana hai
        icon: '/logo-dark.png'
      },
      tokens: uniqueTokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({ success: true, sentCount: response.successCount });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}