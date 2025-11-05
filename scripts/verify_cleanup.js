#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usage:
// SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... TEST_USER_ID=USER_ID node scripts/verify_cleanup.js

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_USER_ID = process.env.TEST_USER_ID; // required

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

if (!TEST_USER_ID) {
  console.error('Please set TEST_USER_ID in environment (the user id to attach the test task to)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const dueDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log('Inserting test overdue task for user:', TEST_USER_ID, 'due_date:', dueDate);
  const { data: insertData, error: insertError } = await supabase.from('tasks').insert([{
    user_id: TEST_USER_ID,
    title: 'TEST - overdue task',
    description: 'Inserted by verify_cleanup.js',
    due_date: dueDate,
    priority: 'low',
    completed: false
  }]);

  if (insertError) {
    console.error('Insert error:', insertError);
    process.exit(1);
  }

  // count overdue tasks before deletion
  const { data: beforeData, error: beforeError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .lt('due_date', new Date().toISOString().split('T')[0])
    .eq('user_id', TEST_USER_ID)
    .not('completed', 'eq', true);

  if (beforeError) {
    console.error('Count before error:', beforeError);
    process.exit(1);
  }

  console.log('Overdue tasks before deletion (count):', beforeData?.length ?? 0);

  // perform deletion using the same conditions the client hook uses
  const { data: deletedData, error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .lt('due_date', new Date().toISOString().split('T')[0])
    .eq('user_id', TEST_USER_ID)
    .not('completed', 'eq', true);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    process.exit(1);
  }

  console.log('Deleted rows count:', Array.isArray(deletedData) ? deletedData.length : 0);

  const { data: afterData, error: afterError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .lt('due_date', new Date().toISOString().split('T')[0])
    .eq('user_id', TEST_USER_ID)
    .not('completed', 'eq', true);

  if (afterError) {
    console.error('Count after error:', afterError);
    process.exit(1);
  }

  console.log('Overdue tasks after deletion (count):', afterData?.length ?? 0);
  console.log('Done.');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
