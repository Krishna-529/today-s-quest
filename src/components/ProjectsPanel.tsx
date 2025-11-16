import { useState } from "react";
import { Project } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Folder, Trash2, Calendar, Clock, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectsPanelProps {
  projects: Project[];
  selectedProject: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string, color: string) => void;
  onDeleteProject: (id: string) => void;
  viewMode?: "today" | "tomorrow" | "all" | "upcoming" | "calendar" | "archived";
  onViewModeChange?: (mode: "today" | "tomorrow" | "all" | "upcoming" | "calendar" | "archived") => void;
}

const colors = [
  "#D9C8FF", // Lavender
  "#FFE3C8", // Peach
  "#CCF2D1", // Mint
  "#C8F0F6", // Aqua
  "#D1E6FF", // Sky Blue
  "#FFF4C2", // Sand Yellow
];

export const ProjectsPanel = ({
  projects,
  selectedProject,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  viewMode,
  onViewModeChange,
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
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-soft border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
          <Folder className="w-4 h-4 md:w-5 md:h-5" />
          Projects
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAdding(!isAdding)}
          className="hover:bg-muted transition-all duration-200"
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
            "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 text-[14px] font-medium",
            selectedProject === null
              ? "bg-primary/10 text-primary shadow-sm"
              : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
          )}
        >
          All Tasks
        </button>

        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all duration-200",
              selectedProject === project.id
                ? "bg-primary/10 shadow-sm"
                : "hover:bg-muted/50"
            )}
          >
            <button
              onClick={() => onSelectProject(project.id)}
              className="flex items-center gap-2 flex-1 text-left min-w-0"
            >
              <div
                className="w-3 h-3 rounded-full transition-transform group-hover:scale-110 border border-black/10 flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className={cn(
                "text-[14px] font-medium truncate transition-colors",
                selectedProject === project.id
                  ? "text-primary"
                  : "text-foreground/80 group-hover:text-foreground"
              )}>{project.name}</span>
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background"
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
