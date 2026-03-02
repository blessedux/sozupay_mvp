import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getRecipient,
  updateRecipient,
  deleteRecipient,
} from "@/lib/recipients";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const recipient = await getRecipient(id, session.id);
  if (!recipient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ recipient });
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
  if ((body.name !== undefined || body.bankAccountId !== undefined) && body.twoFactorVerified !== true) {
    return NextResponse.json(
      { error: "2FA required to change recipient bank data", required: true },
      { status: 403 }
    );
  }
  const { id } = await params;
  const recipient = await updateRecipient(id, session.id, {
    name: typeof body.name === "string" ? body.name : undefined,
    bankAccountId: typeof body.bankAccountId === "string" ? body.bankAccountId : undefined,
    stellarAddress: typeof body.stellarAddress === "string" ? body.stellarAddress : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
  });
  if (!recipient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ recipient });
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
  const ok = await deleteRecipient(id, session.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
