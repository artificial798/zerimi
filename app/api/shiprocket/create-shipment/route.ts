export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const order = await req.json();

    if (!order || !order.address || !Array.isArray(order.items)) {
      return NextResponse.json(
        { success: false, error: "Invalid order payload" },
        { status: 400 }
      );
    }

    // 🔹 AUTH
    const authRes = await fetch(
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

    const authData = await authRes.json();
    if (!authRes.ok || !authData.token) {
      console.error("Shiprocket Auth Error:", authData);
      return NextResponse.json(
        { success: false, error: "Shiprocket authentication failed" },
        { status: 401 }
      );
    }

    // 🔹 ITEMS FORMAT
    const orderItems = order.items.map((item: any, index: number) => ({
      name: item.name || item.title || `Item ${index + 1}`,
      sku: item.sku || item.id || `SKU_${Date.now()}_${index}`,
      units: Number(item.quantity || item.qty || 1),
      selling_price: Number(item.price)
    }));

    // 🔹 CREATE SHIPMENT
    const shipRes = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          order_id: order.id || `ORD_${Date.now()}`,
          order_date: new Date().toISOString(),

          billing_customer_name: order.name,
          billing_address: order.address.street,
          billing_city: order.address.city,
          billing_pincode: order.address.pincode,
          billing_state: order.address.state,
          billing_country: "India",
          billing_phone: order.address.phone,

          shipping_is_billing: true,

          order_items: orderItems,

          payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
          sub_total: Number(order.total),

          length: 10,
          breadth: 10,
          height: 5,
          weight: 0.5,

          pickup_location: process.env.SHIPROCKET_PICKUP || "Primary"
        })
      }
    );

    const shipData = await shipRes.json();

    if (!shipRes.ok) {
      console.error("Shiprocket Create Error:", shipData);
      return NextResponse.json(
        { success: false, error: shipData },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: shipData });

  } catch (err: any) {
    console.error("Shiprocket Exception:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
