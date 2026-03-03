import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/auth/session";
import { getUserByPrivyId, getOrCreateUserByPrivy } from "@/lib/db/users";
import { getOrganizationForUser, getDefaultOrganization } from "@/lib/db/organizations";
import { getOrgDisbursementPublicKey } from "@/lib/stellar/sendUsdc";

/**
 * GET /api/profile – current user's profile from DB (for Profile page).
 * Creates the user if they have a session but no row yet (e.g. first visit after login).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user = await getUserByPrivyId(session.id);
  if (!user) {
    try {
      user = await getOrCreateUserByPrivy(session.id, session.email ?? "");
    } catch {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  /** Org disbursement wallet from env (optional). When set, Classic payouts can use it; else super_admin signs with their own key. */
  const org_payout_wallet_public_key = getOrgDisbursementPublicKey();

  /** Super-admin needs a way to sign payouts: either org disbursement wallet (stored) or their own admin key. */
  const hasPayoutKey = !!(user.stellar_payout_public_key || user.stellar_public_key);
  const org = user.org_id ? await getOrganizationForUser(user.org_id) : null;
  const orgHasDisbursementWallet = !!(org?.stellar_disbursement_secret_encrypted);
  const needsPayoutWalletSetup =
    user.admin_level === "super_admin" && !hasPayoutKey && !orgHasDisbursementWallet;

  /** Super-admin with no org must create one first (Store or NGO). */
  const needsOrgCreation =
    user.admin_level === "super_admin" && !user.org_id;

  /** Default org (e.g. Mujeres2000) that any user can select to view dashboard. */
  const defaultOrg = await getDefaultOrganization();
  const hasValidSessionOrg =
    !!session.orgId &&
    (user.org_id === session.orgId || defaultOrg?.id === session.orgId);

  /**
   * User must go to org picker only if they have no assigned org AND no valid org in session.
   * Once they select the default org (or their assigned org), session.orgId is set and they
   * can stay on dashboard — avoids redirect loop for new users viewing the public NGO.
   */
  const needsOrganization = !user.org_id && !hasValidSessionOrg;

  const org_stellar_disbursement_public_key = org?.stellar_disbursement_public_key ?? null;
  const org_has_stored_secret = !!(org?.stellar_disbursement_secret_encrypted);

  // If user has an org but session has no orgId (e.g. old session), set it so dashboard works
  if (user.org_id && session.orgId !== user.org_id) {
    try {
      await setSession({ ...session, orgId: user.org_id });
    } catch {
      // non-fatal: continue and return profile
    }
  }

  const network = process.env.STELLAR_NETWORK === "public" ? "mainnet" : "testnet";

  return NextResponse.json({
    email: user.email,
    stellar_public_key: user.stellar_public_key,
    stellar_smart_account_address: user.stellar_smart_account_address ?? null,
    stellar_payout_public_key: user.stellar_payout_public_key ?? null,
    org_payout_wallet_public_key: org_payout_wallet_public_key ?? null,
    org_id: user.org_id ?? null,
    org_stellar_disbursement_public_key,
    org_has_stored_secret,
    allowed: user.allowed,
    admin_level: user.admin_level,
    activation_requested_at: user.activation_requested_at,
    needsPayoutWalletSetup,
    needsOrgCreation,
    needsOrganization,
    network,
  });
}
