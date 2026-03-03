import { getSupabase } from "@/lib/supabase/server";

export type OrgType = "store" | "ngo";

export type Organization = {
  id: string;
  name: string;
  type: OrgType;
  stellar_disbursement_public_key: string | null;
  stellar_disbursement_secret_encrypted: string | null;
  soroban_contract_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getOrganizationById(
  orgId: string
): Promise<Organization | null> {
  const { data, error } = await getSupabase()
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[organizations] getOrganizationById error:", error.message);
    return null;
  }
  return (data as Organization) ?? null;
}

export async function getOrganizationForUser(
  orgId: string | null
): Promise<Organization | null> {
  if (!orgId) return null;
  return getOrganizationById(orgId);
}

/** Optional: resolve default org by ID in production so name mismatches don't hide it. */
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID?.trim();
/** Default org name. Configurable via DEFAULT_ORG_NAME env; fallback Mujeres2000. */
const DEFAULT_ORG_NAME =
  process.env.DEFAULT_ORG_NAME?.trim() || "Mujeres2000";

/** Name variants to try when exact match fails (e.g. "Mujeres 2000" vs "Mujeres2000"). */
const DEFAULT_ORG_NAME_VARIANTS = [...new Set([
  DEFAULT_ORG_NAME,
  DEFAULT_ORG_NAME === "Mujeres2000" ? "Mujeres 2000" : null,
  "Mujeres 2000",
  "Mujeres2000",
].filter(Boolean))] as string[];

/**
 * Get the default organization that every user can see and select (e.g. Mujeres 2000).
 * Tries DEFAULT_ORG_ID first, then exact name, then name variants so production DB naming doesn't hide it.
 */
export async function getDefaultOrganization(): Promise<Organization | null> {
  if (DEFAULT_ORG_ID) {
    const byId = await getOrganizationById(DEFAULT_ORG_ID);
    if (byId) return byId;
  }

  for (const name of DEFAULT_ORG_NAME_VARIANTS) {
    const { data, error } = await getSupabase()
      .from("organizations")
      .select("*")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as Organization;
    if (error) {
      console.error("[organizations] getDefaultOrganization name query:", name, error.message);
    }
  }
  return null;
}

export async function createOrganization(params: {
  name: string;
  type: OrgType;
  stellar_disbursement_public_key?: string | null;
  stellar_disbursement_secret_encrypted?: string | null;
}): Promise<Organization> {
  const { data, error } = await getSupabase()
    .from("organizations")
    .insert({
      name: params.name,
      type: params.type,
      stellar_disbursement_public_key: params.stellar_disbursement_public_key ?? null,
      stellar_disbursement_secret_encrypted: params.stellar_disbursement_secret_encrypted ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create organization: ${error.message}`);
  return data as Organization;
}

export async function updateOrganizationWallet(
  orgId: string,
  publicKey: string,
  secretEncrypted: string
): Promise<Organization | null> {
  const { data, error } = await getSupabase()
    .from("organizations")
    .update({
      stellar_disbursement_public_key: publicKey,
      stellar_disbursement_secret_encrypted: secretEncrypted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId)
    .select()
    .single();

  if (error) return null;
  return data as Organization;
}
