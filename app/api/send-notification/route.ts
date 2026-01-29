import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { title, body, targetUserEmail } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, message: "Title & Body required" }, { status: 400 });
    }

    let tokens: string[] = [];

    // CASE 1: Single User (Automatic Order Updates ke liye)
    if (targetUserEmail) {
      const usersSnap = await adminDb.collection("users").where("email", "==", targetUserEmail).get();
      if (!usersSnap.empty) {
        const userData = usersSnap.docs[0].data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens = userData.fcmTokens;
        }
      }
    } 
    // CASE 2: All Users (Marketing Broadcast ke liye)
    else {
      const usersSnap = await adminDb.collection("users").get();
     //                                   👇 Ye add karein
usersSnap.forEach((doc: any) => {
        const userData = doc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      });
    }

    // Duplicates hatao aur clean karo
    const uniqueTokens = [...new Set(tokens)].filter(t => t);

    if (uniqueTokens.length === 0) {
      return NextResponse.json({ success: false, message: "No active devices found for notification." });
    }

    // Message Bhejo
    const message = {
      notification: { title, body },
      tokens: uniqueTokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount, 
      failedCount: response.failureCount 
    });

  } catch (error: any) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}