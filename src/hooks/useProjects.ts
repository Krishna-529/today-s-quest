import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";
import { toast } from "sonner";

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Map and default active=true if column missing (backward compatible)
      const mapped = data.map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        createdAt: project.created_at,
        active: project.active ?? true,
      })) as Project[];

      // Only return active projects for UI
      return mapped.filter(p => p.active !== false);
    },
  });

  const addProject = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name,
        color,
        active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (error: unknown) => {
      const msg = (error as Error)?.message ?? String(error);
      toast.error(msg || "Failed to create project");
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete: mark project inactive instead of deleting
      const { error } = await supabase
        .from("projects")
        .update({ active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Project deleted");
    },
    onError: (error: unknown) => {
      const msg = (error as Error)?.message ?? String(error);
      toast.error(msg || "Failed to delete project");
    },
  });

  return {
    projects,
    isLoading,
    addProject: addProject.mutate,
    deleteProject: deleteProject.mutate,
  };
}
