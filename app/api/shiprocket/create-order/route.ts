export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const order = await req.json();

    // --- 1. DEBUGGING LOG ---
    // Terminal me check karein ki data kaisa aa raha hai
    console.log("📦 Incoming Order Data:", JSON.stringify(order, null, 2));

    // --- 2. VALIDATION CHECKS (Step-by-Step) ---
    
    // Check A: Order ID
    if (!order.id) return errorResponse("Order ID is missing");

    // Check B: Address Object
    if (!order.address) return errorResponse("Address is missing completely");
    
    // Check C: Agar Address sirf text hai (Old data issue)
    if (typeof order.address === 'string') {
        return errorResponse("Address format is wrong (String). Expected Object { street, city, state, pincode }");
    }

    // Check D: Mandatory Fields
    if (!order.address.city) return errorResponse("Address City is missing");
    if (!order.address.state) return errorResponse("Address State is missing");
    if (!order.address.pincode) return errorResponse("Address Pincode is missing");
    
    // Check E: Phone Number (Strict Check)
    if (!order.address.phone || order.address.phone.length < 10) {
        return errorResponse("Phone Number is invalid (Must be 10 digits)");
    }

    // --- 3. AUTHENTICATION ---
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
    if (!authRes.ok) {
      console.error("Auth Failed:", authData);
      return errorResponse("Shiprocket Login Failed. Check .env credentials.");
    }

    // --- 4. DATA FORMATTING ---
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0] + " " + now.toTimeString().split(' ')[0].slice(0, 5);

    const orderItems = order.items.map((item: any) => ({
      name: item.name || "Item",
      sku: item.sku || "SKU_DEF",
      units: Number(item.qty || item.quantity || 1),
      selling_price: Number(item.price)
    }));

    // --- 5. CREATE ORDER ---
    const shipRes = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          order_date: formattedDate,
          billing_customer_name: order.customerName || order.name || "Customer",
          billing_last_name: "",
          billing_address: order.address.street || order.address, // Fallback
          billing_city: order.address.city,
          billing_pincode: order.address.pincode,
          billing_state: order.address.state,
          billing_country: "India",
          billing_phone: order.address.phone,
          shipping_is_billing: true,
          order_items: orderItems,
          payment_method: "Prepaid",
          sub_total: Number(order.total),
          length: 10, breadth: 10, height: 10, weight: 0.5,
          pickup_location: process.env.SHIPROCKET_PICKUP || "Primary"
        })
      }
    );

    const shipData = await shipRes.json();

    if (!shipRes.ok) {
      console.error("Shiprocket Order Error:", JSON.stringify(shipData));
      // Shiprocket ka exact error user ko dikhayein
      const exactError = shipData.errors ? JSON.stringify(shipData.errors) : shipData.message;
      return errorResponse("Shiprocket Error: " + exactError);
    }

    return NextResponse.json({ success: true, data: shipData });

  } catch (err: any) {
    console.error("Server Crash:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// Helper Function
function errorResponse(msg: string) {
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
}