import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { title, body, targetUserEmail } = await req.json();

    // Debugging ke liye server console me print karo
    console.log("Sending Notification -> Title:", title, "Body:", body);

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

    // 👇 FIX: Force Convert to String (Data must be string map)
    const safeTitle = title ? String(title) : "Zerimi Update";
    const safeBody = body ? String(body) : "Check app for details";

    const message = {
      data: {
        title: safeTitle,
        body: safeBody,
        link: '/admin',
        icon: '/logo-dark.png',
        smallIcon: '/notification-icon-white.png'
      },
      tokens: uniqueTokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    return NextResponse.json({ success: true, sentCount: response.successCount });

  } catch (error: any) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}