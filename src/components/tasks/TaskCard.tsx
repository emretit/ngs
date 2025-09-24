import React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskWithOverdue } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithOverdue;
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/20 text-primary',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive'
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging }) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDragging && "opacity-50 transform rotate-2",
        task.isOverdue && "border-destructive"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with priority */}
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-sm line-clamp-2 flex-1">
              {task.title}
            </h3>
            <Badge 
              variant="secondary"
              className={cn("text-xs ml-2", priorityColors[task.priority])}
            >
              {task.priority === 'low' && 'Düşük'}
              {task.priority === 'medium' && 'Orta'}
              {task.priority === 'high' && 'Yüksek'}
              {task.priority === 'urgent' && 'Acil'}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Due date */}
          {task.due_date && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              task.isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              {task.isOverdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              <span>
                {format(new Date(task.due_date), 'dd MMM yyyy', { locale: tr })}
              </span>
              {task.isOverdue && (
                <span className="text-destructive font-medium">
                  (Gecikmiş)
                </span>
              )}
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatar_url} />
                <AvatarFallback className="text-xs">
                  {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {task.assignee.first_name} {task.assignee.last_name}
              </span>
            </div>
          )}

          {/* Task ID for reference */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>#{task.id.slice(-6)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;