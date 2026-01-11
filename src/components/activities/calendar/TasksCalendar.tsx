import { useMemo, useState } from 'react';
import { logger } from '@/utils/logger';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import type { Task, TaskStatus } from '@/types/task';
import TaskDetailPanel from '../TaskDetailPanel';
import TasksCalendarSkeleton from './TasksCalendarSkeleton';
import { formatDate } from '@/utils/dateUtils';

interface TasksCalendarProps {
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

// Setup the localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { 'tr': tr },
});

const statusColors: Record<TaskStatus, string> = {
  todo: '#ef4444', // red-500
  in_progress: '#eab308', // yellow-500
  completed: '#22c55e', // green-500
  postponed: '#6b7280', // gray-500
};

const TasksCalendar = ({
  searchQuery,
  selectedEmployee,
  selectedType,
  selectedStatus,
  startDate,
  endDate
}: TasksCalendarProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["activities", userData?.company_id, startDate, endDate],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      let query = client
        .from("activities")
        .select(`
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        ;

      // Tarih filtresi
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        // End date için günün sonunu ekle (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDateTime.toISOString());
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error("Error fetching tasks:", error);
        throw error;
      }

      return (data || []).map(task => ({
        ...task,
        assignee: task.assignee ? {
          id: task.assignee.id,
          first_name: task.assignee.first_name,
          last_name: task.assignee.last_name,
          avatar_url: task.assignee.avatar_url
        } : undefined
      })) as Task[];
    },
    enabled: !!userData?.company_id
  });

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEmployee = selectedEmployee === null ||
        task.assignee_id === selectedEmployee;

      const matchesType = selectedType === null ||
        task.type === selectedType;

      const matchesStatus = selectedStatus === null ||
        task.status === selectedStatus;

      return matchesSearch && matchesEmployee && matchesType && matchesStatus;
    });
  }, [tasks, searchQuery, selectedEmployee, selectedType, selectedStatus]);

  // Convert tasks to Calendar events
  const calendarEvents = useMemo(() => {
    return filteredTasks
      .filter(task => task.due_date) // Only show tasks with due dates
      .map(task => ({
        id: task.id,
        title: task.title || 'Başlıksız Görev',
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        resource: {
          task: task,
          status: task.status,
          assignee: task.assignee,
          color: statusColors[task.status as TaskStatus] || statusColors.todo
        }
      }));
  }, [filteredTasks]);

  const handleSelectEvent = (event: any) => {
    const task = event.resource.task as Task;
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderColor: event.resource.color,
        color: 'white',
        border: 'none',
        borderRadius: '4px'
      }
    };
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  if (isLoading) {
    return <TasksCalendarSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          step={60}
          showMultiDayTimes
          messages={{
            today: 'Bugün',
            previous: 'Geri',
            next: 'İleri',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün',
            agenda: 'Ajanda',
          }}
          formats={{
            dayRangeHeaderFormat: ({ start, end }) =>
              `${formatDate(start, 'dd/MM')} - ${formatDate(end, 'dd/MM')}`
          }}
        />
      </div>

      <TaskDetailPanel
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default TasksCalendar;