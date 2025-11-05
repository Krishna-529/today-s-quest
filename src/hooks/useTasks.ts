import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types";
import { toast } from "sonner";
import { useEffect } from "react";
import { getISTDateString } from "@/lib/dateUtils";

export function useTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority as "low" | "medium" | "high",
        completed: task.completed,
        project_tags: task.project_tags,
        createdAt: task.created_at,
      })) as Task[];
    },
  });

  const addTask = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: taskData.title!,
        description: taskData.description,
        due_date: taskData.dueDate,
        priority: taskData.priority || "medium",
        project_tags: taskData.project_tags || [],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Failed to create task");
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.dueDate,
          priority: taskData.priority,
          completed: taskData.completed,
          project_tags: taskData.project_tags,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Failed to update task");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Failed to delete task");
    },
  });

  // Mutation to delete overdue tasks in bulk for the current user
  const deleteOverdueTasks = useMutation({
    mutationFn: async () => {
      // get current user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0 };

      // delete tasks where due_date is set and is before now and not completed
      // Compare using the app's IST date string (YYYY-MM-DD) because
      // due dates are stored from <input type="date" /> as 'YYYY-MM-DD'
      const today = getISTDateString();
      const { data, error } = await supabase
        .from("tasks")
        .delete()
        .lt("due_date", today)
        .eq("user_id", user.id)
        .not("completed", "eq", true);

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success(`${data.length} overdue task(s) removed`);
      }
    },
    onError: (error: unknown) => {
      // don't spam users with errors; show a subtle toast
      const msg = error instanceof Error ? error.message : String(error);
      console.warn("Failed to delete overdue tasks", msg);
    },
  });

  const toggleTask = useMutation({
    mutationFn: async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) throw new Error("Task not found");

      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Failed to update task");
    },
  });

  return {
    tasks,
    isLoading,
    addTask: addTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    toggleTask: toggleTask.mutate,
    // internal hook action — exposed in case a component wants to trigger cleanup
    deleteOverdueTasks: deleteOverdueTasks.mutate,
  };
}

// Side-effect: run cleanup when this hook is used in a mounted component
export function useAutoCleanupOverdueTasks(intervalMs = 15 * 60 * 1000) {
  const { deleteOverdueTasks } = useTasks();

  useEffect(() => {
    // run once on mount
    deleteOverdueTasks();

    // set interval to run periodically
    const id = setInterval(() => {
      deleteOverdueTasks();
    }, intervalMs);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
