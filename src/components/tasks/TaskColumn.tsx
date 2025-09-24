import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TaskCard from './TaskCard';
import { TaskWithOverdue, TaskStatus } from '@/types/task';

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskWithOverdue[];
  onTaskClick: (task: TaskWithOverdue) => void;
  onAddTask: (status: TaskStatus) => void;
}

const statusColors = {
  todo: 'bg-muted',
  in_progress: 'bg-primary/10',
  completed: 'bg-success/10',
  postponed: 'bg-warning/10'
};

const TaskColumn: React.FC<TaskColumnProps> = ({
  id,
  title,
  tasks,
  onTaskClick,
  onAddTask
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(id)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pb-3">
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[500px] space-y-3 p-2 rounded-lg transition-colors ${
                snapshot.isDraggingOver 
                  ? 'bg-primary/5 border-2 border-dashed border-primary' 
                  : statusColors[id]
              }`}
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick(task)}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-muted-foreground text-sm">
                    Henüz görev yok
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddTask(id)}
                    className="mt-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Yeni görev oluştur
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
};

export default TaskColumn;