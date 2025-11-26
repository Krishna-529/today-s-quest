import { Task } from "@/types";
import { CheckCircle2, Circle, Clock, Plus, Calendar, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getISTDateString, normalizeDate } from "@/lib/dateUtils";

interface DashboardProps {
  tasks: Task[];
  onAddTaskForDate: (date: string) => void;
  onViewUpcoming?: () => void;
  onAddNoteForDate?: (date: string) => void;
  onViewNotesForDate?: (date: string) => void;
}

export const Dashboard = ({ tasks, onAddTaskForDate, onViewUpcoming, onAddNoteForDate, onViewNotesForDate }: DashboardProps) => {
  const today = getISTDateString();
  const tomorrow = new Date(new Date(today).getTime() + 86400000).toISOString().split("T")[0];
  
  // Normalize date strings for comparison (handle both date and datetime formats)
  const todayTasks = tasks.filter(task => normalizeDate(task.dueDate) === today);
  const completedToday = todayTasks.filter(task => task.completed).length;
  const totalToday = todayTasks.length;
  const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const tomorrowTasks = tasks.filter(task => normalizeDate(task.dueDate) === tomorrow);
  const completedTomorrow = tomorrowTasks.filter(task => task.completed).length;
  const totalTomorrow = tomorrowTasks.length;
  const tomorrowCompletionRate = totalTomorrow > 0 ? (completedTomorrow / totalTomorrow) * 100 : 0;

  const upcomingTasks = tasks.filter(
    task => !task.completed && task.dueDate && normalizeDate(task.dueDate)! > tomorrow
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Today's Tasks Card */}
      <div className="bg-card rounded-xl p-6 shadow-soft border-2 border-primary/20 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">Today</h3>
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-semibold text-foreground">
            {completedToday}
          </span>
          <span className="text-muted-foreground mb-1">/ {totalToday}</span>
        </div>
        {totalToday > 0 && (
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full" 
          onClick={() => onAddTaskForDate(today)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task for Today
        </Button>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="ghost" className="flex-1" onClick={() => onAddNoteForDate?.(today)}>
            <FileText className="w-4 h-4 mr-2" />
            Add Note
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewNotesForDate?.(today)}>
            <Eye className="w-4 h-4 mr-2" />
            View Notes
          </Button>
        </div>
      </div>

      {/* Tomorrow's Tasks Card */}
      <div className="bg-card rounded-xl p-6 shadow-soft border-2 border-accent/20 hover:border-accent/40 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">Tomorrow</h3>
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-semibold text-foreground">
            {completedTomorrow}
          </span>
          <span className="text-muted-foreground mb-1">/ {totalTomorrow}</span>
        </div>
        {totalTomorrow > 0 && (
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${tomorrowCompletionRate}%` }}
              />
            </div>
          </div>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full" 
          onClick={() => onAddTaskForDate(tomorrow)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task for Tomorrow
        </Button>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="ghost" className="flex-1" onClick={() => onAddNoteForDate?.(tomorrow)}>
            <FileText className="w-4 h-4 mr-2" />
            Add Note
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewNotesForDate?.(tomorrow)}>
            <Eye className="w-4 h-4 mr-2" />
            View Notes
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Circle className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="font-medium text-foreground">Total Tasks</h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-foreground">
            {tasks.length}
          </span>
          <span className="text-muted-foreground mb-1">tasks</span>
        </div>
      </div>

      <div 
        className="bg-card rounded-xl p-6 shadow-soft border border-border cursor-pointer hover:border-accent/40 transition-colors"
        onClick={onViewUpcoming}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <h3 className="font-medium text-foreground">Upcoming</h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-foreground">
            {upcomingTasks}
          </span>
          <span className="text-muted-foreground mb-1">tasks</span>
        </div>
      </div>
    </div>
  );
};
