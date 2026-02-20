import { getSession } from "@/lib/auth/session";

/**
 * Resolve Stellar public key for the current user. Backend only.
 * Key derivation is per separate security spec; here we return placeholder or env override.
 */
export async function getWalletPublicKey(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  return (
    process.env.STELLAR_DEMO_PUBLIC_KEY ??
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHF"
  );
}
