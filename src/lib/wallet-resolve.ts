import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId } from "@/lib/db/users";
import { getOrganizationForUser } from "@/lib/db/organizations";

/**
 * Resolve Stellar public key for the current user (their smart wallet). Backend only.
 * Self-custodial: we only store the public key (user registers it); no secret keys.
 * Returns null if user has not registered a wallet yet.
 */
export async function getWalletPublicKey(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await getUserByPrivyId(session.id);
  if (!user?.stellar_public_key) return null;

  return user.stellar_public_key;
}

/**
 * Resolve the public key whose USDC balance should be shown on the dashboard.
 * Prefer the organization disbursement wallet when the user belongs to an org that has one;
 * otherwise fall back to the user's wallet.
 * Returns null if neither is available.
 */
export async function getDashboardBalancePublicKey(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await getUserByPrivyId(session.id);
  if (!user) return null;

  if (user.org_id) {
    const org = await getOrganizationForUser(user.org_id);
    if (org?.stellar_disbursement_public_key) {
      return org.stellar_disbursement_public_key;
    }
  }

  return user.stellar_public_key ?? null;
}
