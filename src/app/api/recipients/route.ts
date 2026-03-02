import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listRecipients, createRecipient } from "@/lib/recipients";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const recipients = await listRecipients(session.id);
  return NextResponse.json({ recipients });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "Recipient";
  const bankAccountId = typeof body.bankAccountId === "string" ? body.bankAccountId.trim() : "";
  const stellarAddress = typeof body.stellarAddress === "string" ? body.stellarAddress.trim() : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!bankAccountId && !stellarAddress) {
    return NextResponse.json(
      { error: "Provide either bankAccountId or stellarAddress (or add a bank account in Settings)" },
      { status: 400 }
    );
  }

  const recipient = await createRecipient(session.id, name, bankAccountId, stellarAddress, phone);
  return NextResponse.json({ recipient });
}
