import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook endpoint for e-commerce: payment completed, refund, etc.
 * Same wallet and transaction list as walls. Verify signature in production.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const event = body.event ?? body.type ?? "unknown";
  const payload = body.payload ?? body;

  // In production: verify webhook signature, then credit wallet and append to transaction list with source = store
  if (process.env.NODE_ENV !== "production") {
    console.log("[webhook]", event, payload);
  }

  return NextResponse.json({ received: true });
}
