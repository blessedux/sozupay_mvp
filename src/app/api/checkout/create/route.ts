import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Create a checkout session (e-commerce). Same wallet as walls.
 * Returns checkout URL and id for widget/redirect.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const amount = typeof body.amount === "string" ? body.amount : "0";
  const reference = typeof body.reference === "string" ? body.reference : "";
  const storeId = typeof body.storeId === "string" ? body.storeId : "";
  const successUrl = typeof body.successUrl === "string" ? body.successUrl : "";
  const cancelUrl = typeof body.cancelUrl === "string" ? body.cancelUrl : "";

  const id = `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutUrl = `${baseUrl}/checkout/${id}?amount=${encodeURIComponent(amount)}&ref=${encodeURIComponent(reference)}&store=${encodeURIComponent(storeId)}`;

  return NextResponse.json({
    id,
    checkoutUrl,
    amount,
    reference,
    storeId,
    successUrl,
    cancelUrl,
  });
}
