import { ArchivedTask, Project } from "@/types";
// Legacy file retained temporarily for backward compatibility. Prefer using ArchivedTasks.tsx and useArchivedTasks hook.
import { useArchivedTasks } from "@/hooks/useArchivedTasks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, Trash2, AlertTriangle, TrendingUp, Check, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";

interface ArchivedTasksProps {
  projects?: Project[];
}

const priorityColors = {
  low: "bg-priority-low/20 text-priority-low border-priority-low/30",
  medium: "bg-priority-medium/20 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/20 text-priority-high border-priority-high/30",
};

export const ArchivedTasks = ({ projects = [] }: ArchivedTasksProps) => {
  const {
    archivedTasks,
    stats,
    isLoading,
    deleteArchivedTask,
    clearAllArchivedTasks,
  } = useArchivedTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading archived tasks...</div>
      </div>
    );
  }

  const getProjectsForTask = (task: ArchivedTask) => {
    return projects.filter((p) => task.project_tags?.includes(p.id));
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Archive className="w-4 h-4 text-blue-500" />
              Total Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_archived}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All past-due tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Incomplete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_incomplete}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks not done
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              Avg Days Past Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avg_days_past_due}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average delay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      {archivedTasks.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {archivedTasks.length} archived {archivedTasks.length === 1 ? "task" : "tasks"} 
            ({stats.total_completed} completed, {stats.total_incomplete} incomplete)
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all archived tasks?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {archivedTasks.length} archived tasks.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => clearAllArchivedTasks()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Archived Tasks List */}
      {archivedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No archived tasks
            </h3>
            <p className="text-sm text-muted-foreground">
              Tasks that pass their due date will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {archivedTasks.map((task) => {
            const taskProjects = getProjectsForTask(task);
            
            return (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={cn(
                          "font-medium",
                          task.completed ? "line-through text-muted-foreground" : "text-foreground"
                        )}>
                          {task.title}
                        </h3>
                        <div className="flex gap-2 shrink-0">
                          {task.completed && (
                            <Badge variant="secondary" className="font-semibold">
                              <Check className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          <Badge
                            variant={task.completed ? "outline" : "destructive"}
                            className="font-semibold"
                          >
                            {task.days_past_due} days past due
                          </Badge>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Due: {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
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
                            {taskProjects.map((project) => (
                              <span
                                key={project.id}
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted"
                              >
                                <span>{project.name}</span>
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            Moved: {new Date(task.moved_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{task.title}". This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteArchivedTask(task.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
