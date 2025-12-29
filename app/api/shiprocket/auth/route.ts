export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD
        })
      }
    );

    const data = await res.json();

    if (!data.token) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    return NextResponse.json({ success: true, token: data.token });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
