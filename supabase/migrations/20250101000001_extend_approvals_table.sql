-- Migration: Extend approvals table with hierarchical approval fields
-- This migration adds approver_role, hierarchy_level, auto_approved, and skipped_reason columns

-- Add approver_role column
ALTER TABLE public.approvals
ADD COLUMN IF NOT EXISTS approver_role TEXT;

-- Add hierarchy_level column
ALTER TABLE public.approvals
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER;

-- Add auto_approved column
ALTER TABLE public.approvals
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;

-- Add skipped_reason column
ALTER TABLE public.approvals
ADD COLUMN IF NOT EXISTS skipped_reason TEXT;



