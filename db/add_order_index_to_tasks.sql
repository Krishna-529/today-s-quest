-- Add order_index column to tasks table for persisting drag-and-drop order
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);

-- Optional: Set initial order_index values based on created_at
-- UPDATE tasks
-- SET order_index = subquery.row_num
-- FROM (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
--   FROM tasks
-- ) AS subquery
-- WHERE tasks.id = subquery.id AND tasks.order_index IS NULL;
