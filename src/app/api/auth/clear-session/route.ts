import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

async function clear() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

/**
 * GET /api/auth/clear-session – clear the session cookie (no redirect).
 * Used by the login page on load so the user must re-authenticate and choose email each time.
 */
export async function GET() {
  return clear();
}

/** POST: allow same behavior so callers using POST (e.g. after logout redirect) do not get 405. */
export async function POST() {
  return clear();
}
