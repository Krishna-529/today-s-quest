import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Task } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { Dashboard } from "@/components/Dashboard";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import { CalendarView } from "@/components/CalendarView";
import { ProjectsPanel } from "@/components/ProjectsPanel";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo, Calendar as CalendarIcon, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { tasks, isLoading: tasksLoading, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { projects, isLoading: projectsLoading, addProject, deleteProject } = useProjects();
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"today" | "tomorrow" | "all">("today");
  const [completionFilter, setCompletionFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [presetDate, setPresetDate] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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

  // Normalize date strings for comparison (handle both date and datetime formats)
  const normalizeDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return dateStr.split("T")[0];
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by project if selected
    if (selectedProject) {
      filtered = filtered.filter((task) => task.project_tags?.includes(selectedProject));
    } 
    // Otherwise filter by view mode
    else if (viewMode === "today") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter((task) => normalizeDate(task.dueDate) === today);
    } else if (viewMode === "tomorrow") {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      filtered = filtered.filter((task) => normalizeDate(task.dueDate) === tomorrow);
    }
    // "all" mode shows all tasks (no additional filter)

    // Apply completion filter
    if (completionFilter === "completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (completionFilter === "incomplete") {
      filtered = filtered.filter((task) => !task.completed);
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
    if (selectedProject === id) {
      setSelectedProject(null);
    }
    deleteProject(id);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleAddTaskForDate = (date: string) => {
    setPresetDate(date);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <header className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
              Peaceful To-Do
            </h1>
            <p className="text-lg text-muted-foreground">
              Organize your tasks with calm and clarity
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProjectsPanel
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              onAddProject={(name, color) => addProject({ name, color })}
              onDeleteProject={handleDeleteProject}
            />
          </div>

          <div className="lg:col-span-3">
            {/* View Mode Selector - Only show when no project is selected */}
            {!selectedProject && (
              <div className="mb-4 flex gap-2">
                <Button
                  variant={viewMode === "today" ? "default" : "outline"}
                  onClick={() => setViewMode("today")}
                >
                  Today's Tasks
                </Button>
                <Button
                  variant={viewMode === "tomorrow" ? "default" : "outline"}
                  onClick={() => setViewMode("tomorrow")}
                >
                  Tomorrow's Tasks
                </Button>
                <Button
                  variant={viewMode === "all" ? "default" : "outline"}
                  onClick={() => setViewMode("all")}
                >
                  All Tasks
                </Button>
              </div>
            )}

            {/* Completion Filter */}
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

            <Tabs defaultValue="tasks" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="tasks" className="gap-2">
                    <ListTodo className="w-4 h-4" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Calendar
                  </TabsTrigger>
                </TabsList>

                <Button onClick={() => {
                  // Auto-set date based on current view mode
                  if (!selectedProject) {
                    if (viewMode === "today") {
                      const today = new Date().toISOString().split("T")[0];
                      setPresetDate(today);
                    } else if (viewMode === "tomorrow") {
                      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
                      setPresetDate(tomorrow);
                    }
                  }
                  setIsFormOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>

              <TabsContent value="tasks" className="mt-0">
                <TaskList
                  tasks={filteredTasks}
                  onToggle={toggleTask}
                  onEdit={handleEditTask}
                  onDelete={deleteTask}
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
            </Tabs>
          </div>
        </div>

        <div className="mt-12">
          <Dashboard tasks={tasks} onAddTaskForDate={handleAddTaskForDate} />
        </div>

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
      </div>
    </div>
  );
};

export default Index;
