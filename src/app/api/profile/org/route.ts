import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId, updateUserOrgId } from "@/lib/db/users";
import { createOrganization, updateOrganizationWallet } from "@/lib/db/organizations";
import { encryptOrgSecret } from "@/lib/org-secret";

/**
 * POST /api/profile/org
 * Create an organization with a new Stellar disbursement keypair and set it as the current user's org (super_admin only).
 * Body: { name?: string, type?: "store" | "ngo" }
 * Returns org + publicKey + secretKey (secretKey only in this response; user must back it up).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByPrivyId(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.admin_level !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can create an organization." },
      { status: 403 }
    );
  }
  if (user.org_id) {
    return NextResponse.json(
      { error: "You already belong to an organization." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "My organization";
  const type =
    body.type === "store" || body.type === "ngo" ? body.type : "ngo";

  try {
    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    const org = await createOrganization({ name, type });
    const encrypted = encryptOrgSecret(org.id, secretKey);
    const updatedOrg = await updateOrganizationWallet(org.id, publicKey, encrypted);
    if (!updatedOrg) {
      return NextResponse.json(
        { error: "Failed to save organization wallet." },
        { status: 500 }
      );
    }
    const linked = await updateUserOrgId(session.id, org.id);
    if (!linked) {
      return NextResponse.json(
        { error: "Failed to link organization to user." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      organization: { id: org.id, name: org.name, type: org.type },
      publicKey,
      secretKey,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create organization";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
