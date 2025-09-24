import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTaskBoard } from '@/hooks/useTaskBoard';
import { TaskFilters, TaskWithOverdue } from '@/types/task';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TaskCalendarProps {
  filters?: TaskFilters;
  onTaskClick?: (task: TaskWithOverdue) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ filters, onTaskClick }) => {
  const { taskBoard, isLoading, error } = useTaskBoard(filters);

  const calendarEvents = useMemo(() => {
    const allTasks = [
      ...taskBoard.todo,
      ...taskBoard.in_progress,
      ...taskBoard.completed,
      ...taskBoard.postponed
    ];

    return allTasks
      .filter(task => task.due_date)
      .map(task => ({
        id: task.id,
        title: task.title,
        start: task.due_date,
        backgroundColor: getTaskColor(task),
        borderColor: getTaskColor(task),
        textColor: '#ffffff',
        extendedProps: {
          task: task,
          priority: task.priority,
          status: task.status,
          isOverdue: task.isOverdue
        }
      }));
  }, [taskBoard]);

  const getTaskColor = (task: TaskWithOverdue) => {
    if (task.isOverdue) return 'hsl(var(--destructive))';
    
    switch (task.priority) {
      case 'urgent': return 'hsl(var(--destructive))';
      case 'high': return 'hsl(var(--warning))';
      case 'medium': return 'hsl(var(--primary))';
      case 'low': return 'hsl(var(--muted-foreground))';
      default: return 'hsl(var(--primary))';
    }
  };

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    if (task && onTaskClick) {
      onTaskClick(task);
    }
  };

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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={calendarEvents}
        eventClick={handleEventClick}
        height="auto"
        locale="tr"
        firstDay={1}
        dayMaxEvents={3}
        moreLinkText="daha fazla"
        buttonText={{
          today: 'Bugün',
          month: 'Ay',
          week: 'Hafta',
          day: 'Gün'
        }}
        eventDisplay="block"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        dayHeaderFormat={{ weekday: 'short' }}
        titleFormat={{ year: 'numeric', month: 'long' }}
        eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
      />
    </div>
  );
};

export default TaskCalendar;