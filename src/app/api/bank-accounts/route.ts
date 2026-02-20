import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listBankAccounts, createBankAccount } from "@/lib/bank-accounts";
import { appendAuditEvent } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = listBankAccounts(session.id);
  return NextResponse.json({ accounts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const twoFactorVerified = body.twoFactorVerified === true;
  if (!twoFactorVerified) {
    return NextResponse.json(
      { error: "2FA required to add bank account", required: true },
      { status: 403 }
    );
  }

  const label = typeof body.label === "string" ? body.label.trim() : "Bank account";
  const last4 = typeof body.last4 === "string" ? body.last4.replace(/\D/g, "").slice(-4) : "****";
  const isDefault = body.isDefault === true;

  const account = createBankAccount(session.id, label, last4, isDefault);
  appendAuditEvent("bank_account_added", `Bank account added: ${account.label} (…${account.last4})`, session.id);
  return NextResponse.json({ account });
}
