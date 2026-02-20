import { NextResponse } from "next/server";

/**
 * Health/status API for dashboard and ops.
 * Used for runbooks and availability checks.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "sozupay-dashboard",
    timestamp: new Date().toISOString(),
  });
}
