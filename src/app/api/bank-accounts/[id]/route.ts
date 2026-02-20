import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "@/lib/bank-accounts";
import { appendAuditEvent } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const account = getBankAccount(id);
  if (!account || account.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ account });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.label !== undefined || body.last4 !== undefined || body.isDefault !== undefined) {
    if (body.twoFactorVerified !== true) {
      return NextResponse.json(
        { error: "2FA required to edit bank account", required: true },
        { status: 403 }
      );
    }
  }

  const { id } = await params;
  const account = updateBankAccount(id, session.id, {
    label: typeof body.label === "string" ? body.label : undefined,
    last4: typeof body.last4 === "string" ? body.last4.replace(/\D/g, "").slice(-4) : undefined,
    isDefault: typeof body.isDefault === "boolean" ? body.isDefault : undefined,
  });
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  appendAuditEvent("bank_account_updated", `Bank account updated: ${account.label}`, session.id);
  return NextResponse.json({ account });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = deleteBankAccount(id, session.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  appendAuditEvent("bank_account_removed", `Bank account removed: ${id}`, session.id);
  return NextResponse.json({ ok: true });
}
