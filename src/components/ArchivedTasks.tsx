import { ArchivedTask, Project } from "@/types";
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
  selectedProjectId?: string;
}

const priorityColors = {
  low: "bg-priority-low/20 text-priority-low border-priority-low/30",
  medium: "bg-priority-medium/20 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/20 text-priority-high border-priority-high/30",
};

export const ArchivedTasks = ({ projects = [], selectedProjectId }: ArchivedTasksProps) => {
  const {
    archivedTasks,
    stats,
    isLoading,
    deleteArchivedTask,
    clearAllArchivedTasks,
  } = useArchivedTasks();

  // Find the selected project name
  const selectedProjectName = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)?.name 
    : null;

  const filteredArchivedTasks = selectedProjectName
    ? archivedTasks.filter((t) => t.project_names?.includes(selectedProjectName))
    : archivedTasks;

  const computedStats = {
    total_archived: filteredArchivedTasks.length,
    total_completed: filteredArchivedTasks.filter((t) => t.completed).length,
    total_incomplete: filteredArchivedTasks.filter((t) => !t.completed).length,
    avg_days_past_due:
      filteredArchivedTasks.length === 0
        ? 0
        : Math.round(
            filteredArchivedTasks
              .map((t) => {
                try {
                  const moved = t.moved_at ? new Date(t.moved_at).getTime() : 0;
                  const due = t.due_date ? new Date(t.due_date).getTime() : moved;
                  const diffDays = moved && due ? (moved - due) / (1000 * 60 * 60 * 24) : 0;
                  return isFinite(diffDays) ? diffDays : 0;
                } catch (e) {
                  return 0;
                }
              })
              .reduce((a, b) => a + b, 0) / filteredArchivedTasks.length
          ),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading archived tasks...</div>
      </div>
    );
  }

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
            <div className="text-3xl font-bold">{computedStats.total_archived}</div>
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
            <div className="text-3xl font-bold">{computedStats.total_completed}</div>
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
            <div className="text-3xl font-bold">{computedStats.total_incomplete}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks not done
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Avg Days Past Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{computedStats.avg_days_past_due}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average delay before archive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Archived tasks list */}
      <div className="space-y-4">
        {filteredArchivedTasks.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No archived tasks</CardTitle>
              <CardDescription>Past-due tasks will appear here after archiving</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filteredArchivedTasks.map((task) => (
            <Card key={task.id} className="border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{task.title}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-medium",
                        task.completed 
                          ? "bg-green-500/10 text-green-600 border-green-500/20" 
                          : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                      )}>
                        {task.completed ? '✓ Completed' : '⚠ Incomplete'}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", priorityColors[task.priority])}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Due: {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          Moved: {new Date(task.moved_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>

                      {task.project_names && task.project_names.length > 0 && (
                        task.project_names.map((name, idx) => (
                          <Badge key={idx} variant="secondary">{name}</Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete archived task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteArchivedTask(task.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredArchivedTasks.length > 0 && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">Clear All</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all archived tasks?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all archived tasks for your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearAllArchivedTasks()}>Delete All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
