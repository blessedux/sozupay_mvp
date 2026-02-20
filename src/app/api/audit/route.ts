import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAuditEvents } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = getAuditEvents(50);
  return NextResponse.json({ events });
}
