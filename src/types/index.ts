export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  // pin scope: 'today' pins task to today's section, 'yesterday' pins to yesterday, 'all' pins permanently at top
  pinned_scope?: "today" | "yesterday" | "all";
  // timestamp when the task was pinned
  pinned_at?: string;
  priority: Priority;
  completed: boolean;
  project_tags?: string[];
  createdAt: string;
  order_index?: number;
}

export interface ArchivedTask {
  id: string;
  original_task_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: Priority;
  completed: boolean;
  project_tags?: string[];
  project_names?: string[]; // Copied project names at time of archiving
  created_at: string;
  moved_at: string;
  days_past_due: number;
}

export interface ArchivedTaskStats {
  total_archived: number;
  total_completed: number;
  total_incomplete: number;
  avg_days_past_due: number;
  max_days_past_due: number;
  oldest_moved_at: string;
  latest_moved_at: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  active?: boolean;
}

export interface Note {
  id: string;
  user_id: string;
  project_id?: string | null;
  project_name?: string | null;
  note_date: string | null;
  scope_key: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}
