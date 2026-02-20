import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPayout, listPayouts } from "@/lib/payouts";
import { appendAuditEvent } from "@/lib/audit";

const LARGE_PAYOUT_THRESHOLD = 1000;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const payouts = listPayouts(session.id, limit);
  return NextResponse.json({ payouts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const amount = typeof body.amount === "string" ? body.amount : "0";
  const twoFactorVerified = body.twoFactorVerified === true;
  const numAmount = parseFloat(amount) || 0;
  const requires2FA = numAmount >= LARGE_PAYOUT_THRESHOLD;
  if (requires2FA && !twoFactorVerified) {
    return NextResponse.json(
      { error: "2FA required for large payout", required: true },
      { status: 403 }
    );
  }

  if (body.toStellar === true && typeof body.destination === "string") {
    const record = createPayout(session.id, amount, {
      type: "to_stellar",
      stellarAddress: body.destination,
      recipientLabel: body.recipientLabel,
    });
    appendAuditEvent("payout", `Payout to Stellar: ${body.destination}`, session.id);
    return NextResponse.json({ payout: record });
  }

  const bankAccountId = body.bankAccountId;
  const recipientLabel = body.recipientLabel;
  if (!bankAccountId) {
    return NextResponse.json(
      { error: "bankAccountId or toStellar destination required" },
      { status: 400 }
    );
  }

  const record = createPayout(session.id, amount, {
    type: "to_bank",
    bankAccountId,
    recipientLabel,
  });
  appendAuditEvent("payout", `Payout to bank: ${recipientLabel ?? bankAccountId}`, session.id);
  return NextResponse.json({ payout: record });
}
