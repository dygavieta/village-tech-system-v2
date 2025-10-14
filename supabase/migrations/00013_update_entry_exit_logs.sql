-- Migration: Update entry_exit_logs table for User Story 4 (Gate Operations)
-- Description: Add permit_id and purpose columns to support construction worker entry tracking

-- Add permit_id column to link entry logs to construction permits
ALTER TABLE entry_exit_logs
ADD COLUMN IF NOT EXISTS permit_id UUID REFERENCES construction_permits(id) ON DELETE SET NULL;

-- Add purpose column for additional context on entry/exit
ALTER TABLE entry_exit_logs
ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Create index on permit_id for faster lookups when verifying construction workers
CREATE INDEX IF NOT EXISTS idx_entry_exit_logs_permit_id ON entry_exit_logs(permit_id);

-- Update RLS policy to allow construction workers to be tracked
-- (Security officers need to link worker entries to permits)

-- Comments
COMMENT ON COLUMN entry_exit_logs.permit_id IS 'Reference to construction permit for worker entries';
COMMENT ON COLUMN entry_exit_logs.purpose IS 'Additional context for the entry/exit (e.g., delivery company, visitor reason)';
