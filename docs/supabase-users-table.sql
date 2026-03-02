-- Dashboard users table (shared Supabase DB with recipient wallet).
-- Run in Supabase SQL Editor if the table does not exist yet.

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  privy_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  stellar_public_key TEXT,
  stellar_payout_public_key TEXT,
  allowed BOOLEAN NOT NULL DEFAULT false,
  admin_level TEXT NOT NULL DEFAULT 'user' CHECK (admin_level IN ('user', 'admin', 'super_admin')),
  org_id TEXT,
  activation_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add column if table already exists (run once):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_requested_at TIMESTAMPTZ;

-- Payout wallet: public key of the keypair derived from the user's passphrase (set at onboarding).
-- Used to verify "unlock" passphrase and to show the address to fund for super_admin payouts.
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS stellar_payout_public_key TEXT;

-- Optional: index for lookups by privy_user_id (UNIQUE already creates one)
-- CREATE INDEX IF NOT EXISTS idx_users_privy_user_id ON users(privy_user_id);

-- Optional: trigger to keep updated_at in sync (Supabase can do this via dashboard or extension)
-- CREATE OR REPLACE FUNCTION set_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- CREATE TRIGGER users_updated_at
--   BEFORE UPDATE ON users
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
