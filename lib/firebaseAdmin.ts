import admin from "firebase-admin";

if (!admin.apps.length) {
  // 1. Private Key ko saaf suthra karein
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") // \n ko asli newline mein badlo
    : undefined;

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.error("❌ Firebase Admin Error: Missing Environment Variables");
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("✅ Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Failed:", error);
  }
}

export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();