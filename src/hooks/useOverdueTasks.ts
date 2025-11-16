import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArchivedTask, ArchivedTaskStats } from "@/types";
import { toast } from "sonner";

export function useArchivedTasks() {
  const queryClient = useQueryClient();

  // Fetch archived tasks from the archived_tasks table
  const { data: archivedTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["archived-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archived_tasks")
        .select("*")
        .order("moved_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((task) => ({
        id: task.id,
        original_task_id: task.original_task_id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority as "low" | "medium" | "high",
        completed: task.completed,
        project_tags: task.project_tags || [],
        project_names: task.project_names || [],
        created_at: task.created_at,
        moved_at: task.moved_at,
        days_past_due: task.days_past_due || 0,
      })) as ArchivedTask[];
    },
  });

  // Fetch archived task statistics - calculate from archived_tasks directly
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["archived-tasks-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch all archived tasks for this user to calculate stats
      const { data: tasks, error } = await supabase
        .from("archived_tasks")
        .select("completed, days_past_due, moved_at")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching archived tasks for stats:", error);
        throw error;
      }

      // If no tasks, return default stats
      if (!tasks || tasks.length === 0) {
        return {
          total_archived: 0,
          total_completed: 0,
          total_incomplete: 0,
          avg_days_past_due: 0,
          max_days_past_due: 0,
          oldest_moved_at: new Date().toISOString(),
          latest_moved_at: new Date().toISOString(),
        } as ArchivedTaskStats;
      }

      // Calculate statistics from the tasks
      const total_archived = tasks.length;
      const total_completed = tasks.filter(t => t.completed).length;
      const total_incomplete = tasks.filter(t => !t.completed).length;
      const days_past_due_values = tasks.map(t => t.days_past_due || 0);
      const avg_days_past_due = Math.round(
        days_past_due_values.reduce((sum, val) => sum + val, 0) / total_archived
      );
      const max_days_past_due = Math.max(...days_past_due_values);
      const moved_at_dates = tasks.map(t => new Date(t.moved_at).getTime());
      const oldest_moved_at = new Date(Math.min(...moved_at_dates)).toISOString();
      const latest_moved_at = new Date(Math.max(...moved_at_dates)).toISOString();

      return {
        total_archived,
        total_completed,
        total_incomplete,
        avg_days_past_due,
        max_days_past_due,
        oldest_moved_at,
        latest_moved_at,
      } as ArchivedTaskStats;
    },
  });

  // Trigger archive function to move past-due tasks
  const archivePastDueTasks = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      if (tasksError) throw tasksError;

      // Fetch all projects to map IDs to names
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id);

      if (projectsError) throw projectsError;

      // Create a map of project ID to name
      const projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);

      // Get today's date in IST
      const today = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istDate = new Date(today.getTime() + istOffset);
      const todayStr = istDate.toISOString().split("T")[0];

      // Filter past-due tasks
      const pastDueTasks = tasks?.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date).toISOString().split("T")[0];
        return dueDate < todayStr;
      }) || [];

      if (pastDueTasks.length === 0) {
        return 0;
      }

      // Archive each task with project names copied (no project IDs stored)
      for (const task of pastDueTasks) {
        const movedAt = new Date().toISOString();
        const dueDate = new Date(task.due_date);
        const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Map project IDs to names
        const projectNames = (task.project_tags || [])
          .map(id => projectMap.get(id))
          .filter(name => name !== undefined) as string[];

        // Insert into archived_tasks (store both IDs and names)
        const { error: insertError } = await supabase
          .from("archived_tasks")
          .insert({
            user_id: user.id,
            original_task_id: task.id,
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            priority: task.priority,
            completed: task.completed,
            project_tags: task.project_tags || [],
            project_names: projectNames,
            created_at: task.created_at,
            moved_at: movedAt,
            days_past_due: daysPastDue,
          });

        if (insertError) throw insertError;

        // Delete from tasks
        const { error: deleteError } = await supabase
          .from("tasks")
          .delete()
          .eq("id", task.id);

        if (deleteError) throw deleteError;
      }

      return pastDueTasks.length;
    },
    onSuccess: (movedCount) => {
      // Invalidate both tasks and archived tasks to refresh UI
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["archived-tasks-stats"] });

      if (movedCount && movedCount > 0) {
        toast.success(`Moved ${movedCount} past-due task(s) to archive`);
      } else {
        toast.info("No past-due tasks found");
      }
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Archive failed: ${msg}`);
    },
  });

  // Delete an archived task permanently
  const deleteArchivedTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("archived_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["archived-tasks-stats"] });
      toast.success("Archived task deleted");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to delete: ${msg}`);
    },
  });

  // Clear all archived tasks for the current user
  const clearAllArchivedTasks = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("archived_tasks")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["archived-tasks-stats"] });
      toast.success("All archived tasks cleared");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to clear: ${msg}`);
    },
  });

  return {
    archivedTasks,
    stats: stats || {
      total_archived: 0,
      total_completed: 0,
      total_incomplete: 0,
      avg_days_past_due: 0,
      max_days_past_due: 0,
      oldest_moved_at: new Date().toISOString(),
      latest_moved_at: new Date().toISOString(),
    },
    isLoading: isLoadingTasks || isLoadingStats,
    archivePastDueTasks: archivePastDueTasks.mutate,
    isArchiving: archivePastDueTasks.isPending,
    deleteArchivedTask: deleteArchivedTask.mutate,
    clearAllArchivedTasks: clearAllArchivedTasks.mutate,
  };
}
