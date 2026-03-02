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
