import { Task, Priority, Project } from "@/types";
import { Check, Calendar, Edit2, Trash2, Tag, Pin } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPin?: (id: string, scope: "today" | "yesterday" | "all" | null) => void;
  projects?: Project[];
}

const priorityColors: Record<Priority, string> = {
  low: "bg-priority-low/20 text-priority-low border-priority-low/30",
  medium: "bg-priority-medium/20 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/20 text-priority-high border-priority-high/30",
};

export const TaskItem = ({ task, onToggle, onEdit, onDelete, onPin, projects = [] }: TaskItemProps) => {
  const taskProjects = projects.filter(p => task.project_tags?.includes(p.id));

  return (
    <div
      className={cn(
        "group bg-card rounded-2xl p-6 shadow-soft border border-border transition-all duration-500 hover:shadow-hover task-enter select-none",
        task.completed && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault(); // ✅ prevents text selection & drag start on mobile
            onToggle(task.id);
          }}
          className={cn(
            "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 touch-none",
            task.completed
              ? "bg-secondary border-secondary"
              : "border-muted-foreground/20 hover:border-secondary/50"
          )}
        >
          {task.completed && <Check className="w-4 h-4 text-secondary-foreground" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-medium text-foreground transition-all duration-200",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.pinned_scope && (
              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Pin className="w-3 h-3 fill-current" />
                <span className="font-medium">
                  {task.pinned_scope === 'today' ? 'Today' : task.pinned_scope === 'yesterday' ? 'Yesterday' : 'All Time'}
                </span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            )}
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border font-medium",
                priorityColors[task.priority]
              )}
            >
              {task.priority}
            </span>
            {taskProjects.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {taskProjects.map(project => (
                  <span
                    key={project.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{project.name}</span>
                    <div
                      className="w-2 h-2 rounded-full border border-black/10"
                      style={{ backgroundColor: project.color }}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {onPin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    task.pinned_scope && "text-primary"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Pin className={cn("w-4 h-4", task.pinned_scope && "fill-current")} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(task.id, "today");
                  }}
                  className={cn(task.pinned_scope === "today" && "bg-accent")}
                >
                  <Pin className="w-4 h-4 mr-2" />
                  Pin to Today
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(task.id, "yesterday");
                  }}
                  className={cn(task.pinned_scope === "yesterday" && "bg-accent")}
                >
                  <Pin className="w-4 h-4 mr-2" />
                  Pin to Yesterday
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(task.id, "all");
                  }}
                  className={cn(task.pinned_scope === "all" && "bg-accent")}
                >
                  <Pin className="w-4 h-4 mr-2" />
                  Pin to All
                </DropdownMenuItem>
                {task.pinned_scope && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin(task.id, null);
                      }}
                      className="text-muted-foreground"
                    >
                      <Pin className="w-4 h-4 mr-2 rotate-45" />
                      Unpin
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit(task);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(task.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
