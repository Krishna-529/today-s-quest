import { Task, Project } from "@/types";
import { Calendar } from "./ui/calendar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TaskItem } from "./TaskItem";
import { normalizeDate, normalizeDateToIST } from "@/lib/dateUtils";

interface CalendarViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPin?: (id: string, scope: "today" | "yesterday" | "all" | null) => void;
  projects?: Project[];
}

export const CalendarView = ({ tasks, onToggle, onEdit, onDelete, onPin, projects }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksWithDates = tasks.filter((task) => task.dueDate);
  
  // Use IST normalization for consistent date comparison
  const selectedDateString = selectedDate ? normalizeDateToIST(selectedDate) : null;
  const tasksForSelectedDate = tasksWithDates.filter(
    (task) => normalizeDate(task.dueDate) === selectedDateString
  );

  const datesWithTasks = new Set(tasksWithDates.map((task) => normalizeDate(task.dueDate)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasTask: (date) => {
                const dateString = normalizeDateToIST(date);
                return datesWithTasks.has(dateString);
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Tasks for {selectedDate?.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') || "Selected Date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks scheduled for this date
            </p>
          ) : (
            <div className="space-y-3">
              {tasksForSelectedDate.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPin={onPin}
                  projects={projects}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
