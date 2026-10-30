import { NextResponse } from "next/server";
import { getOrders, updateOrderStatus, type OrderStatus, type DeliveryStatus } from "@/lib/orders";

export async function GET() {
  return NextResponse.json({ orders: getOrders() });
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { orderId, status, deliveryStatus } = data;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    const updated = updateOrderStatus(orderId, status as OrderStatus, deliveryStatus as DeliveryStatus);
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status: 400 });
  }
}
