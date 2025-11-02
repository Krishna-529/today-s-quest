import { Task } from "@/types";
import { Project } from "@/types";
import { DraggableTaskItem } from "./DraggableTaskItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface DraggableTaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder: (tasks: Task[]) => void;
  projects?: Project[];
}

export const DraggableTaskList = ({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  projects,
}: DraggableTaskListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder(newTasks);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              projects={projects}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
