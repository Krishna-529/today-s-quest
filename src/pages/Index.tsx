import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Task } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useArchivedTasks } from "@/hooks/useArchivedTasks";
import { DraggableTaskList } from "@/components/DraggableTaskList";
import NotesModal from "@/components/NotesModal";
import { TaskForm } from "@/components/TaskForm";
import { CalendarView } from "@/components/CalendarView";
import { ArchivedTasks } from "@/components/ArchivedTasks";
import { ProjectsPanel } from "@/components/ProjectsPanel";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ListTodo, Calendar as CalendarIcon, LogOut, Archive, Menu, Check, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getISTDateString, normalizeDate } from "@/lib/dateUtils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileProjectsDropdown } from "@/components/MobileProjectsDropdown";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { tasks, isLoading: tasksLoading, addTask, updateTask, deleteTask, toggleTask, pinTask } = useTasks();
  const { projects, isLoading: projectsLoading, addProject, deleteProject } = useProjects();
  const { archivePastDueTasks, isArchiving } = useArchivedTasks();
  const isMobile = useIsMobile();
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"today" | "tomorrow" | "all" | "upcoming" | "calendar" | "archived">("today");
  const [completionFilter, setCompletionFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [presetDate, setPresetDate] = useState<string | null>(null);
  const [taskOrderMap, setTaskOrderMap] = useState<Record<string, string[]>>({});
  const [currentTab, setCurrentTab] = useState<"tasks" | "archived">("tasks");
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesModalMode, setNotesModalMode] = useState<"edit" | "view">("edit");
  const [noteContext, setNoteContext] = useState<{ date: string | null; projectId: string | null; projectName: string | null } | null>(null);

  const resolveNoteContext = () => {
    const today = getISTDateString();
    let date: string | null = null;
    if (viewMode === "today") {
      date = today;
    } else if (viewMode === "tomorrow") {
      date = new Date(new Date(today).getTime() + 86400000).toISOString().split("T")[0];
    } else if (viewMode === "calendar" && presetDate) {
      date = presetDate;
    } else {
      date = null;
    }

    const selectedProjectMeta = selectedProject ? projects.find((p) => p.id === selectedProject) : null;
    return {
      date,
      projectId: selectedProject,
      projectName: selectedProjectMeta?.name ?? null,
    };
  };

  const handleOpenNotes = (mode: "edit" | "view" = "edit") => {
    const ctx = resolveNoteContext();
    setNoteContext(ctx);
    setNotesModalMode(mode);
    setNotesModalOpen(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Auto-archive on mount was removed to avoid unexpected background
  // operations that run without explicit user intent. Archiving is
  // still available via the UI control ("Archive Past Due") and the
  // dropdown action which calls `archivePastDueTasks()` when the user
  // explicitly requests it.




  if (authLoading || tasksLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by project if selected
    if (selectedProject) {
      filtered = filtered.filter((task) => task.project_tags?.includes(selectedProject));
    }

    // Apply viewMode date filters (apply even when a project is selected)
    if (viewMode === "today") {
      const today = getISTDateString();
      filtered = filtered.filter((task) => normalizeDate(task.dueDate) === today);
    } else if (viewMode === "tomorrow") {
      const tomorrow = new Date(new Date(getISTDateString()).getTime() + 86400000).toISOString().split("T")[0];
      filtered = filtered.filter((task) => normalizeDate(task.dueDate) === tomorrow);
    } else if (viewMode === "upcoming") {
      const tomorrow = new Date(new Date(getISTDateString()).getTime() + 86400000).toISOString().split("T")[0];
      filtered = filtered.filter((task) => task.dueDate && normalizeDate(task.dueDate)! > tomorrow);
    }
    // "all" mode shows all tasks (no additional filter)

    // Apply completion filter
    if (completionFilter === "completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (completionFilter === "incomplete") {
      filtered = filtered.filter((task) => !task.completed);
    }

    // Apply manual order if exists for current context
    const orderKey = selectedProject
      ? `project:${selectedProject}|${completionFilter}`
      : `view:${viewMode}|${completionFilter}`;
    const orderedIds = taskOrderMap[orderKey];
    if (orderedIds && orderedIds.length) {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      filtered = filtered
        .slice()
        .sort((a, b) => {
          const ia = indexMap.has(a.id) ? (indexMap.get(a.id) as number) : Number.POSITIVE_INFINITY;
          const ib = indexMap.has(b.id) ? (indexMap.get(b.id) as number) : Number.POSITIVE_INFINITY;
          return ia - ib;
        });
    } else {
      // Default sort: oldest tasks first (ascending by createdAt)
      filtered = filtered
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Sort pinned tasks to the top
    filtered = filtered.slice().sort((a, b) => {
      const aPinned = a.pinned_scope ? 1 : 0;
      const bPinned = b.pinned_scope ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned; // pinned first
      return 0; // maintain existing order
    });

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const handleSubmitTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, ...taskData });
      toast.success("Task updated");
    } else {
      addTask(taskData);
      toast.success("Task created");
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handlePinTask = (id: string, scope: "today" | "yesterday" | "all" | null) => {
    pinTask({ id, scope });
    if (scope) {
      toast.success(`Task pinned to ${scope}`);
    } else {
      toast.success("Task unpinned");
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    toast.success("Task deleted");
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    toggleTask(id);
    if (task) {
      if (task.completed) {
        toast.success("Task marked incomplete");
      } else {
        toast.success("Task completed!");
      }
    }
  };

  const handleDeleteProject = (id: string) => {
    // Clear selected project if it's the one being deleted
    if (selectedProject === id) {
      setSelectedProject(null);
    }
    deleteProject(id);
    toast.success("Project deleted");
  };

  const handleAddProject = (name: string, color: string) => {
    addProject({ name, color });
    toast.success("Project created");
  };

  const handleArchivePastDue = () => {
    archivePastDueTasks();
    toast.success("Past due tasks archived");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-2 md:py-12 max-w-7xl">
        <header className="mb-2 md:mb-12 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <NavigationSidebar
                currentView={viewMode}
                currentTab={currentTab}
                completionFilter={completionFilter}
                onViewChange={(view) => {
                  setViewMode(view as "today" | "tomorrow" | "all" | "upcoming" | "calendar" | "archived");
                  setSelectedProject(null);
                  setCurrentTab("tasks");
                }}
                onTabChange={(tab) => {
                  const validTab = tab === "tasks" || tab === "archived" ? tab : "tasks";
                  setCurrentTab(validTab);
                }}
                onCompletionFilterChange={(filter) => {
                  setCompletionFilter(filter);
                }}
                onArchive={handleArchivePastDue}
                onSignOut={handleSignOut}
                isArchiving={isArchiving}
              />
            )}
            <div>
              <h1 className="text-xl md:text-[28px] font-semibold text-foreground mb-1 md:mb-2 tracking-tight">
                Every minute counts
              </h1>
              <p className="text-xs md:text-base text-muted-foreground">
                Organize your tasks with calm and clarity
              </p>
            </div>
          </div>
          {/* Desktop Actions */}
          <div className="hidden md:flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <div className="flex items-center justify-center w-full h-full text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] p-2">
                <DropdownMenuItem
                  onClick={handleArchivePastDue}
                  disabled={isArchiving}
                  className="cursor-pointer py-3 px-3 mb-1"
                >
                  <Archive className="w-4 h-4 mr-3" />
                  {isArchiving ? "Archiving..." : "Archive Past Due"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer py-3 px-3"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Projects Dropdown */}
        {isMobile && (
          <div className="mb-3">
            <MobileProjectsDropdown
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              onAddProject={(name, color) => addProject({ name, color })}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Desktop Projects Panel */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <ProjectsPanel
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                viewMode={viewMode === "calendar" || viewMode === "archived" ? "all" : viewMode}
                onViewModeChange={(mode) => setViewMode(mode)}
              />
            </div>
          )}

          <div className={isMobile ? "col-span-1" : "lg:col-span-3"}>
            {/* View Mode Selector and Completion Filter */}
            {!isMobile && (
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Segmented Control for Time Filters */}
                  <div className="inline-flex items-center bg-muted/50 rounded-lg p-1 gap-1">
                    <Button
                      size="sm"
                      variant={viewMode === "today" ? "secondary" : "ghost"}
                      onClick={() => setViewMode("today")}
                      className={cn(
                        "transition-all duration-200",
                        viewMode === "today" && "shadow-sm"
                      )}
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "tomorrow" ? "secondary" : "ghost"}
                      onClick={() => setViewMode("tomorrow")}
                      className={cn(
                        "transition-all duration-200",
                        viewMode === "tomorrow" && "shadow-sm"
                      )}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "upcoming" ? "secondary" : "ghost"}
                      onClick={() => setViewMode("upcoming")}
                      className={cn(
                        "transition-all duration-200",
                        viewMode === "upcoming" && "shadow-sm"
                      )}
                    >
                      Upcoming
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "all" ? "secondary" : "ghost"}
                      onClick={() => setViewMode("all")}
                      className={cn(
                        "transition-all duration-200",
                        viewMode === "all" && "shadow-sm"
                      )}
                    >
                      All
                    </Button>
                  </div>
                  
                  {/* View Toggle for Calendar */}
                  <Button
                    size="sm"
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    onClick={() => setViewMode("calendar")}
                    className="transition-all duration-200"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Calendar
                  </Button>
                  
                  {/* Archived View */}
                  <Button
                    size="sm"
                    variant={viewMode === "archived" ? "default" : "outline"}
                    onClick={() => setViewMode("archived")}
                    className="transition-all duration-200"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archived
                  </Button>
                </div>
                
                {/* Completion Filter Dropdown */}
                {viewMode !== "calendar" && viewMode !== "archived" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="min-w-[160px] justify-start">
                        <ListTodo className="w-4 h-4 mr-2" />
                        Show: {completionFilter === "all" ? "All" : completionFilter === "incomplete" ? "Incomplete" : "Completed"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px] p-2">
                      <DropdownMenuItem
                        onClick={() => setCompletionFilter("all")}
                        className={cn("cursor-pointer py-3 px-3 mb-1", completionFilter === "all" && "bg-accent font-medium")}
                      >
                        <Check className={cn("w-4 h-4 mr-3", completionFilter === "all" ? "opacity-100" : "opacity-0")} />
                        All Tasks
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCompletionFilter("incomplete")}
                        className={cn("cursor-pointer py-3 px-3 mb-1", completionFilter === "incomplete" && "bg-accent font-medium")}
                      >
                        <Check className={cn("w-4 h-4 mr-3", completionFilter === "incomplete" ? "opacity-100" : "opacity-0")} />
                        Incomplete Only
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCompletionFilter("completed")}
                        className={cn("cursor-pointer py-3 px-3", completionFilter === "completed" && "bg-accent font-medium")}
                      >
                        <Check className={cn("w-4 h-4 mr-3", completionFilter === "completed" ? "opacity-100" : "opacity-0")} />
                        Completed Only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}

            {viewMode === "calendar" ? (
              <CalendarView
                tasks={filteredTasks}
                onToggle={handleToggleTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onPin={handlePinTask}
                projects={projects}
              />
            ) : viewMode === "archived" ? (
              <ArchivedTasks projects={projects} selectedProjectId={selectedProject ?? undefined} />
            ) : (
              <>
                {/* Action Buttons - Only show on desktop */}
                {!isMobile && (
                  <div className="flex justify-end gap-3 mb-6">
                    <Button 
                      onClick={() => handleOpenNotes("edit")}
                      variant="outline"
                      className="h-11 px-6 text-base shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 pop-in-delay-1"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Notes
                    </Button>
                    <Button 
                      onClick={() => {
                        // Auto-set date based on current view mode
                        if (viewMode === "today") {
                          const today = getISTDateString();
                          setPresetDate(today);
                        } else if (viewMode === "tomorrow") {
                          const tomorrow = new Date(new Date(getISTDateString()).getTime() + 86400000).toISOString().split("T")[0];
                          setPresetDate(tomorrow);
                        } else {
                          setPresetDate(null);
                        }
                        setIsFormOpen(true);
                      }}
                      className="h-11 px-6 text-base shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 pop-in-delay-2"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      New Task
                    </Button>
                  </div>
                )}

                <div className="pop-in">
                  <DraggableTaskList
                    tasks={filteredTasks}
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onPin={handlePinTask}
                    onReorder={(newTasks) => {
                      const key = selectedProject
                        ? `project:${selectedProject}|${completionFilter}`
                        : `view:${viewMode}|${completionFilter}`;
                      setTaskOrderMap((prev) => ({ ...prev, [key]: newTasks.map((t) => t.id) }));
                    }}
                    projects={projects}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <TaskForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
            setPresetDate(null);
          }}
          onSubmit={handleSubmitTask}
          editTask={editingTask}
          projects={projects}
          presetDate={presetDate}
          presetProjectId={selectedProject}
        />

        {/* Notes Modal */}
        {notesModalOpen && noteContext && (
          <NotesModal
            open={notesModalOpen}
            onClose={() => { setNotesModalOpen(false); setNoteContext(null); setNotesModalMode("edit"); }}
            initialDate={noteContext.date}
            projectId={noteContext.projectId}
            projectName={noteContext.projectName}
            viewOnly={notesModalMode === "view"}
          />
        )}

        {/* Mobile Floating Action Buttons */}
        {isMobile && (
          <>
            {/* Notes Button */}
            <Button
              size="sm"
              className="fixed bottom-24 right-6 h-12 w-12 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.16)] hover:scale-105 active:scale-95 transition-all duration-200 z-50 pop-in-delay-1"
              variant="outline"
              onClick={() => handleOpenNotes("edit")}
            >
              <FileText className="h-5 w-5" />
            </Button>

            {/* New Task Button */}
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.16)] hover:scale-105 active:scale-95 transition-all duration-200 z-50 pop-in-delay-2"
              onClick={() => {
                // Auto-set date based on current view mode
                if (viewMode === "today") {
                  const today = getISTDateString();
                  setPresetDate(today);
                } else if (viewMode === "tomorrow") {
                  const tomorrow = new Date(new Date(getISTDateString()).getTime() + 86400000).toISOString().split("T")[0];
                  setPresetDate(tomorrow);
                } else {
                  setPresetDate(null);
                }
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-7 w-7" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
