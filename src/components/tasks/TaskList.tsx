import React, { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, User, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTaskBoard } from '@/hooks/useTaskBoard';
import { TaskFilters, TaskWithOverdue, TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskListProps {
  filters?: TaskFilters;
  onTaskClick?: (task: TaskWithOverdue) => void;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/20 text-primary',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive'
};

const statusLabels = {
  todo: 'Yapılacak',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  postponed: 'Ertelendi'
};

const TaskList: React.FC<TaskListProps> = ({ filters, onTaskClick }) => {
  const { taskBoard, isLoading, error } = useTaskBoard(filters);
  const [expandedSections, setExpandedSections] = useState<Record<TaskStatus, boolean>>({
    todo: true,
    in_progress: true,
    completed: false,
    postponed: false
  });

  const toggleSection = (status: TaskStatus) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const TaskItem: React.FC<{ task: TaskWithOverdue }> = ({ task }) => (
    <div
      className={cn(
        "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
        task.isOverdue && "border-destructive bg-destructive/5"
      )}
      onClick={() => onTaskClick?.(task)}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm">{task.title}</h3>
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

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4">
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

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>#{task.id.slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Görevler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sections = [
    { status: 'todo' as TaskStatus, tasks: taskBoard.todo },
    { status: 'in_progress' as TaskStatus, tasks: taskBoard.in_progress },
    { status: 'completed' as TaskStatus, tasks: taskBoard.completed },
    { status: 'postponed' as TaskStatus, tasks: taskBoard.postponed }
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ status, tasks }) => (
        <Card key={status}>
          <Collapsible
            open={expandedSections[status]}
            onOpenChange={() => toggleSection(status)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{statusLabels[status]}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tasks.length}
                    </Badge>
                  </div>
                  {expandedSections[status] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Bu kategoride görev bulunmuyor
                  </p>
                ) : (
                  tasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default TaskList;