import crypto from "crypto";
import { getProducts, saveInventory } from "./inventory";
import { checkoutSchema } from "./validation";

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type DeliveryStatus = "ORDER_PLACED" | "DISPATCHED" | "OUT_FOR_DELIVERY" | "DELIVERED";

export type OrderRecord = {
  orderId: string;
  productSlug: string;
  productName: string;
  productId: string;
  amount: number; // in paise
  deliveryCharge: number; // in paise
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    pincode: string;
  };
  createdAt: Date;
  paidAt: Date | null;
};

type Reservation = { productSlug: string; expiresAt: number; orderId: string };
const reservations = new Map<string, Reservation>();
const orders = new Map<string, OrderRecord>();
const RESERVE_MS = 12 * 60 * 1000;

// Seed sample orders for immediate view
const SEED_ORDERS: OrderRecord[] = [
  {
    orderId: "RBR-ORD-8821",
    productSlug: "lg-7kg-front-load-washing-machine",
    productName: "LG 7 kg Front Load Washing Machine",
    productId: "RBR-LKO-001",
    amount: 1515000,
    deliveryCharge: 65000,
    status: "PAID",
    deliveryStatus: "OUT_FOR_DELIVERY",
    razorpayOrderId: "order_Nxy9812A",
    razorpayPaymentId: "pay_Mz1029384",
    customer: {
      name: "Aman Khan",
      phone: "9876543210",
      email: "aman.khan@example.com",
      address: "Flat 402, Royal Enclave, Hazratganj",
      city: "Lucknow",
      pincode: "226001",
    },
    createdAt: new Date(Date.now() - 24 * 3600000),
    paidAt: new Date(Date.now() - 23.8 * 3600000),
  },
  {
    orderId: "RBR-ORD-9104",
    productSlug: "voltas-1-5-ton-inverter-split-ac",
    productName: "Voltas 1.5 Ton Inverter Split AC",
    productId: "RBR-PUN-002",
    amount: 2470000,
    deliveryCharge: 120000,
    status: "PENDING",
    deliveryStatus: "ORDER_PLACED",
    razorpayOrderId: "order_Pyz7711B",
    razorpayPaymentId: null,
    customer: {
      name: "Priya Sharma",
      phone: "9123456780",
      email: "priya.sharma@example.com",
      address: "14 Plot B, FC Road, Shivaji Nagar",
      city: "Pune",
      pincode: "411004",
    },
    createdAt: new Date(Date.now() - 2 * 3600000),
    paidAt: null,
  },
  {
    orderId: "RBR-ORD-7430",
    productSlug: "whirlpool-265l-double-door-refrigerator",
    productName: "Whirlpool 265 L Double Door Refrigerator",
    productId: "RBR-MUM-004",
    amount: 1940000,
    deliveryCharge: 90000,
    status: "PAID",
    deliveryStatus: "DELIVERED",
    razorpayOrderId: "order_Klm6620C",
    razorpayPaymentId: "pay_Klm991122",
    customer: {
      name: "Rajesh Verma",
      phone: "9820123456",
      email: "rverma@example.com",
      address: "A-101 Sea View Apartments, Bandra West",
      city: "Mumbai",
      pincode: "400050",
    },
    createdAt: new Date(Date.now() - 72 * 3600000),
    paidAt: new Date(Date.now() - 71.5 * 3600000),
  },
];

// Initialize seed orders
SEED_ORDERS.forEach(o => orders.set(o.orderId, o));

export function clearExpiredReservations() {
  const now = Date.now();
  for (const [key, reservation] of reservations) {
    if (reservation.expiresAt <= now) {
      reservations.delete(key);
      const order = orders.get(reservation.orderId);
      if (order?.status === "PENDING") order.status = "CANCELLED";
    }
  }
}

export function createPendingOrder(input: unknown, razorpayOrderId: string | null = null) {
  const payload = checkoutSchema.parse(input);
  clearExpiredReservations();
  const product = getProducts().find(p => p.slug === payload.productSlug);
  if (!product || product.status !== "AVAILABLE") throw new Error("This appliance is no longer available.");
  if (product.stockMode === "CITY" && product.city !== payload.city)
    throw new Error(`This item is available for delivery in ${product.city} only.`);
  if (reservations.has(product.slug))
    throw new Error("This appliance is being purchased by another customer. Please try again shortly.");
  const orderId = `RBR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  reservations.set(product.slug, { productSlug: product.slug, expiresAt: Date.now() + RESERVE_MS, orderId });
  const record: OrderRecord = {
    orderId,
    productSlug: product.slug,
    productName: product.name,
    productId: product.id,
    amount: (product.price + product.delivery) * 100,
    deliveryCharge: product.delivery * 100,
    status: "PENDING",
    deliveryStatus: "ORDER_PLACED",
    razorpayOrderId,
    razorpayPaymentId: null,
    customer: {
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
    },
    createdAt: new Date(),
    paidAt: null,
  };
  orders.set(orderId, record);
  return { orderId, amount: record.amount, product };
}

export function markPaid(orderId: string, razorpayPaymentId?: string) {
  clearExpiredReservations();
  const order = orders.get(orderId);
  if (order?.status === "PAID" && razorpayPaymentId && order.razorpayPaymentId === razorpayPaymentId) return order;
  if (!order || order.status !== "PENDING") throw new Error("Invalid payment order");
  const product = getProducts().find(p => p.slug === order.productSlug);
  if (!product) throw new Error("Product not found");
  const reservation = reservations.get(product.slug);
  if (!reservation || reservation.orderId !== orderId || product.status === "SOLD")
    throw new Error("This order no longer owns an active stock reservation.");
  product.status = "SOLD";
  saveInventory();
  reservations.delete(product.slug);
  order.status = "PAID";
  order.paidAt = new Date();
  if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
  return order;
}

export function updateOrderStatus(
  orderId: string,
  status?: OrderStatus,
  deliveryStatus?: DeliveryStatus
) {
  clearExpiredReservations();
  const order = orders.get(orderId);
  if (!order) throw new Error("Order not found");
  if (status && !["PENDING", "PAID", "FAILED", "CANCELLED"].includes(status))
    throw new Error("Invalid order status");
  if (deliveryStatus && !["ORDER_PLACED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(deliveryStatus))
    throw new Error("Invalid delivery status");
  if (status && status !== order.status) {
    if (order.status !== "PENDING") throw new Error("Cannot change a completed order status");
    if (status === "PAID") {
      markPaid(orderId);
    } else {
      order.status = status;
      const reservation = reservations.get(order.productSlug);
      if (reservation?.orderId === orderId) reservations.delete(order.productSlug);
    }
  }
  if (deliveryStatus) order.deliveryStatus = deliveryStatus;
  return order;
}
export function getOrders(): OrderRecord[] {
  return Array.from(orders.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}


