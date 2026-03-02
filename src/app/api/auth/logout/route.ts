import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { getSession, clearSession } from "@/lib/auth/session";
import { clearUnlockedKey } from "@/lib/auth/wallet-unlock";

async function performLogout(request: NextRequest) {
  const session = await getSession();
  if (session) clearUnlockedKey(session.id);
  await clearSession();
  const baseUrl = getAppBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/login`);
}

/** POST: form submit from "Log out" button. */
export async function POST(request: NextRequest) {
  return performLogout(request);
}

/** GET: support link/redirect to logout (e.g. bookmarks, redirects) to avoid 405 in production. */
export async function GET(request: NextRequest) {
  return performLogout(request);
}
