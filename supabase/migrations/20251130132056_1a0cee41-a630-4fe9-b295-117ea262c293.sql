-- Add recurring task fields to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_days TEXT[],
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER,
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Create index for better performance when querying recurring tasks
CREATE INDEX IF NOT EXISTS idx_activities_is_recurring 
ON activities(is_recurring) 
WHERE is_recurring = TRUE;

CREATE INDEX IF NOT EXISTS idx_activities_parent_task_id 
ON activities(parent_task_id) 
WHERE parent_task_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN activities.is_recurring IS 'Indicates if this is a recurring task template';
COMMENT ON COLUMN activities.recurrence_type IS 'Type of recurrence: none, daily, weekly, monthly, custom';
COMMENT ON COLUMN activities.is_recurring_instance IS 'Indicates if this task is an instance of a recurring task';
COMMENT ON COLUMN activities.parent_task_id IS 'Reference to the parent recurring task template';