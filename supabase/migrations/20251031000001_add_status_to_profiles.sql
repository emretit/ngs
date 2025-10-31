-- Add status column to profiles table
-- This column tracks whether a user profile is active or inactive

-- Add status column with default value
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_status
  ON public.profiles (status);

-- Update existing records to have 'active' status if NULL
UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;
