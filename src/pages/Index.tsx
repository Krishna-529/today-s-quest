import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Task } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useArchivedTasks } from "@/hooks/useArchivedTasks";
// import { Dashboard } from "@/components/Dashboard";
import { DraggableTaskList } from "@/components/DraggableTaskList";
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
import { Plus, ListTodo, Calendar as CalendarIcon, LogOut, Archive, Menu } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getISTDateString, normalizeDate } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileProjectsDropdown } from "@/components/MobileProjectsDropdown";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { tasks, isLoading: tasksLoading, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { projects, isLoading: projectsLoading, addProject, deleteProject } = useProjects();
  const { archivePastDueTasks, isArchiving } = useArchivedTasks();
  const isMobile = useIsMobile();
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"today" | "tomorrow" | "all" | "upcoming">("today");
  const [completionFilter, setCompletionFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [presetDate, setPresetDate] = useState<string | null>(null);
  const [taskOrderMap, setTaskOrderMap] = useState<Record<string, string[]>>({});
  const [currentTab, setCurrentTab] = useState<"tasks" | "calendar" | "archived">("tasks");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Auto-archive past-due tasks on mount
  const initialArchiveRef = useRef(false);
  useEffect(() => {
    if (
      !authLoading &&
      !tasksLoading &&
      !projectsLoading &&
      user &&
      !initialArchiveRef.current
    ) {
      // Trigger server-side archive function
      try {
        archivePastDueTasks();
      } catch (err) {
        // ignore - mutation logs errors internally
      }
      initialArchiveRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, tasksLoading, projectsLoading, user]);




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
    // Otherwise filter by view mode
    else if (viewMode === "today") {
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

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const handleAddTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, ...taskData });
    } else {
      addTask(taskData);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    // Delete tasks that only have this project
    const tasksToDelete = tasks.filter(task => 
      task.project_tags?.length === 1 && task.project_tags[0] === id
    );
    tasksToDelete.forEach(task => deleteTask(task.id));
    
    if (selectedProject === id) {
      setSelectedProject(null);
    }
    deleteProject(id);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Commented out - used by Dashboard component
  // const handleAddTaskForDate = (date: string) => {
  //   setPresetDate(date);
  //   setIsFormOpen(true);
  // };

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
                  setViewMode(view as "today" | "tomorrow" | "all" | "upcoming");
                  setSelectedProject(null);
                  setCurrentTab("tasks");
                }}
                onTabChange={(tab) => {
                  setCurrentTab(tab as "tasks" | "calendar" | "archived");
                }}
                onCompletionFilterChange={(filter) => {
                  setCompletionFilter(filter);
                }}
                onArchive={archivePastDueTasks}
                onSignOut={handleSignOut}
                isArchiving={isArchiving}
              />
            )}
            <div>
              <h1 className="text-xl md:text-5xl font-bold text-foreground mb-0.5 md:mb-3 tracking-tight">
                Every minute counts
              </h1>
              <p className="text-xs md:text-lg text-muted-foreground">
                Organize your tasks with calm and clarity
              </p>
            </div>
          </div>
          {/* Desktop Actions */}
          <div className="hidden md:flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => archivePastDueTasks()} 
              disabled={isArchiving}
              className="md:h-10"
            >
              {isArchiving ? "Archiving..." : "Archive Past Due"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="md:h-10">
              <LogOut className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
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
                onAddProject={(name, color) => addProject({ name, color })}
                onDeleteProject={handleDeleteProject}
              />
            </div>
          )}

          <div className={isMobile ? "col-span-1" : "lg:col-span-3"}>
            {/* View Mode Selector - Only show on desktop when no project is selected */}
            {!isMobile && !selectedProject && (
              <div className="mb-4 flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={viewMode === "today" ? "default" : "outline"}
                  onClick={() => setViewMode("today")}
                >
                  Today
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "tomorrow" ? "default" : "outline"}
                  onClick={() => setViewMode("tomorrow")}
                >
                  Tomorrow
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "upcoming" ? "default" : "outline"}
                  onClick={() => setViewMode("upcoming")}
                >
                  Upcoming
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "all" ? "default" : "outline"}
                  onClick={() => setViewMode("all")}
                >
                  All
                </Button>
              </div>
            )}

            {/* Completion Filter - Only show on desktop */}
            {!isMobile && (
              <div className="mb-4 flex gap-2">
                <Button
                  size="sm"
                  variant={completionFilter === "all" ? "default" : "outline"}
                  onClick={() => setCompletionFilter("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={completionFilter === "incomplete" ? "default" : "outline"}
                  onClick={() => setCompletionFilter("incomplete")}
                >
                  Incomplete
                </Button>
                <Button
                  size="sm"
                  variant={completionFilter === "completed" ? "default" : "outline"}
                  onClick={() => setCompletionFilter("completed")}
                >
                  Completed
                </Button>
              </div>
            )}

            <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as "tasks" | "calendar" | "archived")} className="w-full">
              <div className="flex items-center justify-between mb-4">
                {/* Tabs - Only show on desktop */}
                {!isMobile && (
                  <TabsList>
                    <TabsTrigger value="tasks" className="gap-2">
                      <ListTodo className="w-4 h-4" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="gap-2">
                      <Archive className="w-4 h-4" />
                      Archived
                    </TabsTrigger>
                  </TabsList>
                )}

                {/* New Task Button - Only show on desktop in this position */}
                {!isMobile && (
                  <Button onClick={() => {
                    // Auto-set date based on current view mode
                    if (!selectedProject) {
                      if (viewMode === "today") {
                        const today = getISTDateString();
                        setPresetDate(today);
                      } else if (viewMode === "tomorrow") {
                        const tomorrow = new Date(new Date(getISTDateString()).getTime() + 86400000).toISOString().split("T")[0];
                        setPresetDate(tomorrow);
                      } else {
                        setPresetDate(null);
                      }
                    } else {
                      setPresetDate(null);
                    }
                    setIsFormOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                )}
              </div>

              <TabsContent value="tasks" className="mt-0">
                <DraggableTaskList
                  tasks={filteredTasks}
                  onToggle={toggleTask}
                  onEdit={handleEditTask}
                  onDelete={deleteTask}
                  onReorder={(newTasks) => {
                    const key = selectedProject
                      ? `project:${selectedProject}|${completionFilter}`
                      : `view:${viewMode}|${completionFilter}`;
                    setTaskOrderMap((prev) => ({ ...prev, [key]: newTasks.map((t) => t.id) }));
                  }}
                  projects={projects}
                />
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                <CalendarView
                  tasks={filteredTasks}
                  onToggle={toggleTask}
                  onEdit={handleEditTask}
                  onDelete={deleteTask}
                  projects={projects}
                />
              </TabsContent>

              <TabsContent value="archived" className="mt-0">
                <ArchivedTasks projects={projects} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Dashboard Stats - Commented out as requested */}
        {/* <div className="mt-8 md:mt-12">
          <Dashboard 
            tasks={tasks} 
            onAddTaskForDate={handleAddTaskForDate}
            onViewUpcoming={() => setViewMode("upcoming")}
          />
        </div> */}

        <TaskForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
            setPresetDate(null);
          }}
          onSubmit={handleAddTask}
          editTask={editingTask}
          projects={projects}
          presetDate={presetDate}
        />

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            onClick={() => {
              // Auto-set date based on current view mode
              if (!selectedProject) {
                if (viewMode === "today") {
                  const today = getISTDateString();
                  setPresetDate(today);
                } else if (viewMode === "tomorrow") {
                  const tomorrow = new Date(new Date(getISTDateString()).getTime() + 86400000).toISOString().split("T")[0];
                  setPresetDate(tomorrow);
                } else {
                  setPresetDate(null);
                }
              } else {
                setPresetDate(null);
              }
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Index;
