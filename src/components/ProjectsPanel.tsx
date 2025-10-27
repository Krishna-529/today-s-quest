import { useState } from "react";
import { Project } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Folder, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectsPanelProps {
  projects: Project[];
  selectedProject: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string, color: string) => void;
  onDeleteProject: (id: string) => void;
}

const colors = [
  "hsl(210, 70%, 65%)",
  "hsl(150, 50%, 65%)",
  "hsl(40, 80%, 70%)",
  "hsl(0, 70%, 70%)",
  "hsl(280, 60%, 70%)",
  "hsl(180, 50%, 65%)",
];

export const ProjectsPanel = ({
  projects,
  selectedProject,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}: ProjectsPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleAdd = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim(), selectedColor);
      setNewProjectName("");
      setIsAdding(false);
      setSelectedColor(colors[0]);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Projects
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isAdding && (
        <div className="mb-3 space-y-2">
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform",
                  selectedColor === color && "scale-125 ring-2 ring-foreground"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewProjectName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelectProject(null)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg transition-colors",
            selectedProject === null
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted"
          )}
        >
          All Tasks
        </button>

        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "group flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
              selectedProject === project.id
                ? "bg-primary/10"
                : "hover:bg-muted"
            )}
          >
            <button
              onClick={() => onSelectProject(project.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm">{project.name}</span>
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onDeleteProject(project.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
