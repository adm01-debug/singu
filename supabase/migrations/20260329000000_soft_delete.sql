-- Soft delete support for contacts and companies
-- Adds deleted_at column and updates RLS policies to exclude soft-deleted rows

-- Add soft delete columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create partial indexes for efficient queries on non-deleted rows
CREATE INDEX IF NOT EXISTS idx_contacts_active
  ON contacts (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_companies_active
  ON companies (user_id)
  WHERE deleted_at IS NULL;

-- Create index for deleted rows (for admin/recovery queries)
CREATE INDEX IF NOT EXISTS idx_contacts_deleted
  ON contacts (user_id, deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_deleted
  ON companies (user_id, deleted_at)
  WHERE deleted_at IS NOT NULL;
