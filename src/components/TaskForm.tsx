import { useState, useEffect } from "react";
import { Task, Priority, Project } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  editTask?: Task | null;
  projects: Project[];
  presetDate?: string | null;
  presetProjectId?: string | null;
}

export const TaskForm = ({ open, onClose, onSubmit, editTask, projects, presetDate, presetProjectId }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title);
        setDescription(editTask.description || "");
        setDueDate(editTask.dueDate || "");
        setPriority(editTask.priority);
        setSelectedProjects(editTask.project_tags || []);
      } else {
        setTitle("");
        setDescription("");
        setDueDate(presetDate || "");
        setPriority("medium");
        setSelectedProjects(presetProjectId ? [presetProjectId] : []);
      }
    }
  }, [open, editTask, presetDate, presetProjectId]);

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
      project_tags: selectedProjects.length > 0 ? selectedProjects : undefined,
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setSelectedProjects([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editTask ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Project Tags (Optional)</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{editTask ? "Update" : "Create"} Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
