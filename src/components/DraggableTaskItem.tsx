import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import { Task } from '@/types';
import { Project } from '@/types';
import { GripVertical } from 'lucide-react';

interface DraggableTaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  projects?: Project[];
}

export const DraggableTaskItem = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  projects,
}: DraggableTaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <TaskItem
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        projects={projects}
      />
    </div>
  );
};
