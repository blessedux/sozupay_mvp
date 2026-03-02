-- Organizations table: one per org; type (store | ngo) drives dashboard skin.
-- Phase 2: soroban_contract_id (C address) used for NGO disbursement when set.
-- Run in Supabase SQL Editor if the table does not exist yet.

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ngo' CHECK (type IN ('store', 'ngo')),
  stellar_disbursement_public_key TEXT,
  stellar_disbursement_secret_encrypted TEXT,
  soroban_contract_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If table already exists, add the column:
-- ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stellar_disbursement_secret_encrypted TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- users.org_id references organizations.id (as text). Add FK when ready:
-- ALTER TABLE users ADD CONSTRAINT fk_users_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;
