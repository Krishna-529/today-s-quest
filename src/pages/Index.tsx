import { useState } from "react";
import { Task, Project } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Dashboard } from "@/components/Dashboard";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import { CalendarView } from "@/components/CalendarView";
import { ProjectsPanel } from "@/components/ProjectsPanel";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Index = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [projects, setProjects] = useLocalStorage<Project[]>("projects", []);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = selectedProject
    ? tasks.filter((task) => task.projectId === selectedProject)
    : tasks;

  const handleAddTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id
            ? { ...task, ...taskData }
            : task
        )
      );
      toast.success("Task updated successfully");
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title!,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority || "medium",
        completed: false,
        projectId: selectedProject || undefined,
        createdAt: new Date().toISOString(),
      };
      setTasks([...tasks, newTask]);
      toast.success("Task created successfully");
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleToggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast.success("Task deleted");
  };

  const handleAddProject = (name: string, color: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
    toast.success("Project created");
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    setTasks(tasks.filter((task) => task.projectId !== id));
    if (selectedProject === id) {
      setSelectedProject(null);
    }
    toast.success("Project deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
            Peaceful To-Do
          </h1>
          <p className="text-lg text-muted-foreground">
            Organize your tasks with calm and clarity
          </p>
        </header>

        <Dashboard tasks={tasks} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProjectsPanel
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>

          <div className="lg:col-span-3">
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

                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>

              <TabsContent value="tasks" className="mt-0">
                <TaskList
                  tasks={filteredTasks}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                <CalendarView
                  tasks={filteredTasks}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <TaskForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleAddTask}
          editTask={editingTask}
        />
      </div>
    </div>
  );
};

export default Index;
