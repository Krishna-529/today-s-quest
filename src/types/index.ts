export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  completed: boolean;
  projectId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}
