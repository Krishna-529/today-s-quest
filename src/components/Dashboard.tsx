import { Task } from "@/types";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface DashboardProps {
  tasks: Task[];
}

export const Dashboard = ({ tasks }: DashboardProps) => {
  const today = new Date().toISOString().split("T")[0];
  
  const todayTasks = tasks.filter(task => task.dueDate === today);
  const completedToday = todayTasks.filter(task => task.completed).length;
  const totalToday = todayTasks.length;
  const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const upcomingTasks = tasks.filter(
    task => !task.completed && task.dueDate && task.dueDate > today
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">Today's Progress</h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-foreground">
            {completedToday}
          </span>
          <span className="text-muted-foreground mb-1">/ {totalToday}</span>
        </div>
        {totalToday > 0 && (
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
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

      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
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
