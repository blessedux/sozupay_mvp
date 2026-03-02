import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId, getPendingActivationUsers } from "@/lib/db/users";

function isAdmin(level: string) {
  return level === "admin" || level === "super_admin";
}

/**
 * GET /api/admin/pending-activations – list users who requested activation (admin/super_admin only).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await getUserByPrivyId(session.id);
  if (!currentUser || !isAdmin(currentUser.admin_level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await getPendingActivationUsers();
  return NextResponse.json({ users: pending });
}
