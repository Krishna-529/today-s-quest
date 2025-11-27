import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types";
import { toast } from "sonner";

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
        pinned_scope: task.pinned_scope,
        pinned_at: task.pinned_at,
        priority: task.priority as "low" | "medium" | "high",
        completed: task.completed,
        project_tags: task.project_tags,
        createdAt: task.created_at,
        order_index: task.order_index,
      })) as Task[];
    },
  });

  const addTask = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the highest order_index to add new task at the bottom
      const { data: maxOrderTask } = await supabase
        .from("tasks")
        .select("order_index")
        .order("order_index", { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      const nextOrderIndex = (maxOrderTask?.order_index ?? -1) + 1;

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: taskData.title!,
        description: taskData.description,
        due_date: taskData.dueDate,
        priority: taskData.priority || "medium",
        project_tags: taskData.project_tags || [],
        order_index: nextOrderIndex,
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

  const pinTask = useMutation({
    mutationFn: async ({ id, scope }: { id: string; scope: "today" | "yesterday" | "all" | null }) => {
      const update: any = {};
      if (scope) {
        update.pinned_scope = scope;
        update.pinned_at = new Date().toISOString();
      } else {
        update.pinned_scope = null;
        update.pinned_at = null;
      }

      const { error } = await supabase
        .from("tasks")
        .update(update)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Failed to pin task");
    },
  });

  const updateTaskOrder = useMutation({
    mutationFn: async (taskOrders: { id: string; order_index: number }[]) => {
      // Fire and forget - update in background without waiting
      taskOrders.forEach((taskOrder) => {
        supabase
          .from("tasks")
          .update({ order_index: taskOrder.order_index })
          .eq("id", taskOrder.id)
          .then(({ error }) => {
            if (error) console.error("Failed to update task order:", error);
          });
      });
    },
    onMutate: async (taskOrders) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Immediately update the UI without waiting for server response
      queryClient.setQueryData(["tasks"], (old: Task[] | undefined) => {
        if (!old) return old;
        
        const orderMap = new Map(taskOrders.map(t => [t.id, t.order_index]));
        return old.map(task => ({
          ...task,
          order_index: orderMap.get(task.id) ?? task.order_index
        }));
      });
    },
  });

  return {
    tasks,
    isLoading,
    addTask: addTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    toggleTask: toggleTask.mutate,
    pinTask: pinTask.mutate,
    updateTaskOrder: updateTaskOrder.mutate,
  };
}
