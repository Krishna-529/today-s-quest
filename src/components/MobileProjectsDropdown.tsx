import { useState } from "react";
import { Project } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Folder, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileProjectsDropdownProps {
  projects: Project[];
  selectedProject: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string, color: string) => void;
  onDeleteProject: (id: string) => void;
}

const colors = [
  "#D9C8FF", // Lavender
  "#FFE3C8", // Peach
  "#CCF2D1", // Mint
  "#C8F0F6", // Aqua
  "#D1E6FF", // Sky Blue
  "#FFF4C2", // Sand Yellow
];

export const MobileProjectsDropdown = ({
  projects,
  selectedProject,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}: MobileProjectsDropdownProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim(), selectedColor);
      setNewProjectName("");
      setIsAdding(false);
      setSelectedColor(colors[0]);
      setOpen(false);
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            <span className="text-sm">
              {selectedProjectData ? selectedProjectData.name : "All Tasks"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[calc(100vw-2rem)] bg-background z-50">
        {isAdding ? (
          <div className="p-2 space-y-2">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="text-sm"
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
              <Button size="sm" onClick={handleAdd} className="flex-1">
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewProjectName("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => {
                onSelectProject(null);
                setOpen(false);
              }}
              className={cn(
                "text-sm",
                selectedProject === null && "bg-primary/10 text-primary"
              )}
            >
              All Tasks
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectProject(project.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-sm",
                  selectedProject === project.id && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => setIsAdding(true)}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
