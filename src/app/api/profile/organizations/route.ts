import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId } from "@/lib/db/users";
import { getOrganizationById, getDefaultOrganization } from "@/lib/db/organizations";

/**
 * GET /api/profile/organizations – list organizations the current user can access.
 * Every user sees the default org (e.g. Mujeres2000) so they can open the dashboard; only super_admin can perform payouts.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserByPrivyId(session.id);
    const canCreate = user?.admin_level === "super_admin";

    const seenIds = new Set<string>();
    const organizations: { id: string; name: string }[] = [];

    if (user?.org_id) {
      const org = await getOrganizationById(user.org_id);
      if (org) {
        organizations.push({ id: org.id, name: org.name });
        seenIds.add(org.id);
      }
    }

    const defaultOrg = await getDefaultOrganization();
    if (defaultOrg && !seenIds.has(defaultOrg.id)) {
      organizations.push({ id: defaultOrg.id, name: defaultOrg.name });
    }

    return NextResponse.json({
      organizations,
      canCreate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[profile/organizations]", message, err);
    const isConfig = message.includes("Missing Supabase") || message.includes("env");
    return NextResponse.json(
      { error: isConfig ? "Server configuration error." : "Failed to load organizations." },
      { status: isConfig ? 503 : 500 }
    );
  }
}
