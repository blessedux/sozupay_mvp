import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/auth/session";
import { getUserByPrivyId } from "@/lib/db/users";
import { getOrganizationById } from "@/lib/db/organizations";

/**
 * POST /api/auth/set-org – set the current organization for this session.
 * Body: { orgId: string }. User must belong to the org (user.org_id or future membership check).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const orgId = typeof body.orgId === "string" ? body.orgId.trim() : null;
  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }

  const user = await getUserByPrivyId(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // For now: user can only select their own org_id. Later: check org_members.
  if (user.org_id !== orgId) {
    return NextResponse.json({ error: "You do not have access to this organization" }, { status: 403 });
  }

  const org = await getOrganizationById(orgId);
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  await setSession({
    ...session,
    orgId,
  });

  return NextResponse.json({ ok: true, orgId });
}
