-- Recipients table: persisted per owner (session.id = privy_user_id).
-- Run in Supabase SQL Editor if the table does not exist yet.

CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  bank_account_id TEXT NOT NULL DEFAULT '',
  stellar_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- List recipients by owner (dashboard)
CREATE INDEX IF NOT EXISTS idx_recipients_owner_id ON recipients(owner_id);

-- Optional: prevent duplicate name+owner if you want uniqueness
-- CREATE UNIQUE INDEX idx_recipients_owner_name ON recipients(owner_id, name);

-- Optional: phone and email for recipient details
-- ALTER TABLE recipients ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE recipients ADD COLUMN IF NOT EXISTS email TEXT;
