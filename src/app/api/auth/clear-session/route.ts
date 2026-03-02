import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

/**
 * GET /api/auth/clear-session – clear the session cookie (no redirect).
 * Used by the login page on load so the user must re-authenticate and choose email each time.
 */
export async function GET() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
