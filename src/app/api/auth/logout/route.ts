import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { clearSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await clearSession();
  const baseUrl = getAppBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/login`);
}
