import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const { amount } = await req.json();

  const merchantId = process.env.PHONEPE_MERCHANT_ID!;
  const saltKey = process.env.PHONEPE_SALT_KEY!;
  const saltIndex = process.env.PHONEPE_SALT_INDEX!;

  const payload = {
    merchantId,
    merchantTransactionId: "TEST_" + Date.now(),
    merchantUserId: "USER_TEST",
    amount: amount * 100,
    redirectUrl: "http://localhost:3000/payment-success",
    redirectMode: "REDIRECT",
    callbackUrl: "http://localhost:3000/api/payment/phonepe/callback",
    paymentInstrument: { type: "PAY_PAGE" }
  };

  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");

  const checksum =
    crypto
      .createHash("sha256")
      .update(base64 + "/pg/v1/pay" + saltKey)
      .digest("hex") +
    "###" +
    saltIndex;

  const res = await fetch(
    "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum
      },
      body: JSON.stringify({ request: base64 })
    }
  );

  const data = await res.json();

  return NextResponse.json({
    success: true,
    url: data.data.instrumentResponse.redirectInfo.url
  });
}
