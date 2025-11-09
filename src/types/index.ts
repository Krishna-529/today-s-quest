export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  completed: boolean;
  project_tags?: string[];
  createdAt: string;
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
}
