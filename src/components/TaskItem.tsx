import { Task, Priority, Project } from "@/types";
import { Check, Calendar, Edit2, Trash2, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  projects?: Project[];
}

const priorityColors: Record<Priority, string> = {
  low: "bg-priority-low/20 text-priority-low border-priority-low/30",
  medium: "bg-priority-medium/20 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/20 text-priority-high border-priority-high/30",
};

export const TaskItem = ({ task, onToggle, onEdit, onDelete, projects = [] }: TaskItemProps) => {
  const taskProjects = projects.filter(p => task.project_tags?.includes(p.id));
  
  return (
    <div
      className={cn(
        "group bg-card rounded-2xl p-6 shadow-soft border border-border transition-all duration-500 hover:shadow-hover task-enter",
        task.completed && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
       <button
          onClick={(e) => {
            e.stopPropagation(); // prevent parent from catching the event
            e.preventDefault();  // prevents focus/selection behavior on mobile
            onToggle(task.id);
          }}
          className={cn(
            "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
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
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
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
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(task)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
