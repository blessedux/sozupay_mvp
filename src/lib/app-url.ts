import type { NextRequest } from "next/server";

/**
 * App base URL for redirects and links.
 * Prefers NEXT_PUBLIC_APP_URL. In production, when env is unset, derives from
 * the request so redirects (e.g. auth verify) use the correct host.
 */
export function getAppBaseUrl(request?: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (request?.url) {
    try {
      return new URL(request.url).origin;
    } catch {
      // fall through to default
    }
  }
  return "http://localhost:3000";
}
