import { Task, Project } from "@/types";
import { Calendar } from "./ui/calendar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TaskItem } from "./TaskItem";
import { normalizeDate } from "@/lib/dateUtils";

interface CalendarViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  projects?: Project[];
}

export const CalendarView = ({ tasks, onToggle, onEdit, onDelete, projects }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksWithDates = tasks.filter((task) => task.dueDate);
  
  const selectedDateString = normalizeDate(selectedDate?.toISOString());
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
                const dateString = normalizeDate(date.toISOString());
                return datesWithTasks.has(dateString);
              },
            }}
            modifiersStyles={{
              hasTask: {
                fontWeight: "bold",
                textDecoration: "underline",
                color: "hsl(var(--primary))",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Tasks for {selectedDate?.toLocaleDateString() || "Selected Date"}
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
