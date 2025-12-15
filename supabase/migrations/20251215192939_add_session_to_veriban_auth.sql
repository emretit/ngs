-- Add session_code and session_expires_at columns to veriban_auth table
-- Session code is valid for 6 hours according to Veriban documentation

ALTER TABLE veriban_auth
ADD COLUMN IF NOT EXISTS session_code TEXT,
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;

-- Add comment to explain the purpose
COMMENT ON COLUMN veriban_auth.session_code IS 'JWT token from Veriban login, valid for 6 hours';
COMMENT ON COLUMN veriban_auth.session_expires_at IS 'Expiration time of the session code';

-- Create index for faster session expiration checks
CREATE INDEX IF NOT EXISTS idx_veriban_auth_session_expires
ON veriban_auth(session_expires_at)
WHERE session_code IS NOT NULL AND is_active = true;
