import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listRecipients, createRecipient } from "@/lib/recipients";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const recipients = listRecipients(session.id);
  return NextResponse.json({ recipients });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.twoFactorVerified !== true) {
    return NextResponse.json(
      { error: "2FA required to add recipient with bank account", required: true },
      { status: 403 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "Recipient";
  const bankAccountId = typeof body.bankAccountId === "string" ? body.bankAccountId : "";
  if (!bankAccountId) {
    return NextResponse.json(
      { error: "bankAccountId required" },
      { status: 400 }
    );
  }

  const recipient = createRecipient(session.id, name, bankAccountId);
  return NextResponse.json({ recipient });
}
