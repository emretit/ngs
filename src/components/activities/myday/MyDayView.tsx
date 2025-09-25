import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isPast, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Sun,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Lightbulb,
  Calendar,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus } from '@/types/task';
import TaskDetailPanel from '../TaskDetailPanel';

interface MyDayViewProps {
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
}


const statusColors = {
  todo: 'text-red-600 bg-red-50',
  in_progress: 'text-yellow-600 bg-yellow-50',
  completed: 'text-green-600 bg-green-50',
  postponed: 'text-gray-600 bg-gray-50'
};

const MyDayView = ({
  searchQuery,
  selectedEmployee,
  selectedType,
  selectedStatus
}: MyDayViewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["activities", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
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
        .eq("company_id", userData.company_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
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

  // My Day logic: Show tasks due today, overdue, and user's current tasks
  const myDayTasks = useMemo(() => {
    const now = new Date();

    return tasks.filter(task => {
      // Apply filters first
      const matchesSearch = searchQuery === '' ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEmployee = selectedEmployee === null ||
        task.assignee_id === selectedEmployee;

      const matchesType = selectedType === null ||
        task.type === selectedType;

      const matchesStatus = selectedStatus === null ||
        task.status === selectedStatus;

      if (!matchesSearch || !matchesEmployee || !matchesType || !matchesStatus) {
        return false;
      }

      // Only show user's own tasks or unassigned tasks
      const isMyTask = task.assignee_id === userData?.id || !task.assignee_id;

      // Include if:
      // 1. Due today
      // 2. Overdue (due in the past and not completed)
      // 3. In progress tasks
      // 4. High priority tasks not completed
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const isDueToday = isToday(dueDate);
        const isOverdue = isPast(dueDate) && task.status !== 'completed';

        if (isDueToday || isOverdue) return isMyTask;
      }

      // Include in-progress tasks
      if (task.status === 'in_progress') return isMyTask;

      // Include important incomplete tasks
      if (task.is_important) {
        return isMyTask && task.status !== 'completed';
      }

      return false;
    });
  }, [tasks, searchQuery, selectedEmployee, selectedType, selectedStatus, userData?.id]);

  // Categorize tasks
  const categorizedTasks = useMemo(() => {
    const today = new Date();

    const overdue = myDayTasks.filter(task =>
      task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed'
    );

    const dueToday = myDayTasks.filter(task =>
      task.due_date && isToday(new Date(task.due_date))
    );

    const inProgress = myDayTasks.filter(task =>
      task.status === 'in_progress' && (!task.due_date || !isToday(new Date(task.due_date)))
    );

    const important = myDayTasks.filter(task =>
      task.is_important &&
      task.status !== 'completed' &&
      (!task.due_date || (!isToday(new Date(task.due_date)) && !isPast(new Date(task.due_date))))
    );

    return { overdue, dueToday, inProgress, important };
  }, [myDayTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => handleTaskClick(task)}
    >
      <div className="flex-shrink-0">
        {task.status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </p>
          {task.is_important && (
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          )}
        </div>

        <div className="flex items-center space-x-2 mt-1">
          {task.due_date && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(task.due_date), 'dd MMM', { locale: tr })}
              {isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && (
                <Badge variant="destructive" className="ml-2 text-xs">Gecikmiş</Badge>
              )}
            </div>
          )}

          <Badge variant="secondary" className={`text-xs ${statusColors[task.status as keyof typeof statusColors]}`}>
            {task.status === 'todo' ? 'Yapılacak' :
             task.status === 'in_progress' ? 'Devam Ediyor' :
             task.status === 'completed' ? 'Tamamlandı' : 'Ertelendi'}
          </Badge>
        </div>
      </div>

      {task.assignee && (
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {task.assignee.first_name?.charAt(0)}{task.assignee.last_name?.charAt(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Sun className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Bugün</h1>
                <p className="text-blue-100">
                  {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr })}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">{myDayTasks.length}</div>
            <div className="text-sm text-blue-100">Toplam Görev</div>
          </div>
        </div>
      </div>

      {/* Task Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        {categorizedTasks.overdue.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-600 flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Gecikmiş Görevler</span>
                <Badge variant="destructive">{categorizedTasks.overdue.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedTasks.overdue.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Due Today */}
        {categorizedTasks.dueToday.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-600 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Bugün Bitirilecek</span>
                <Badge variant="secondary">{categorizedTasks.dueToday.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedTasks.dueToday.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* In Progress */}
        {categorizedTasks.inProgress.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-600 flex items-center space-x-2">
                <Circle className="h-5 w-5" />
                <span>Devam Eden</span>
                <Badge variant="secondary">{categorizedTasks.inProgress.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedTasks.inProgress.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Important */}
        {categorizedTasks.important.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-600 flex items-center space-x-2">
                <Star className="h-5 w-5 fill-yellow-500" />
                <span>Önemli Görevler</span>
                <Badge variant="secondary">{categorizedTasks.important.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorizedTasks.important.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {myDayTasks.length === 0 && (
        <div className="text-center py-12">
          <Sun className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Bugün için görev yok</h3>
          <p className="text-gray-500 mb-6">
            Harika! Bugünlük tüm görevlerinizi tamamladınız veya henüz görev eklenmemiş.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Görev Ekle
          </Button>
        </div>
      )}

      {/* Suggestions (placeholder for future implementation) */}
      {myDayTasks.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-600 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Akıllı Öneriler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              Önce gecikmiş görevlerinizi tamamlamanızı öneriyoruz.
              Ardından bugün bitirilecek görevlere odaklanabilirsiniz.
            </p>
          </CardContent>
        </Card>
      )}

      <TaskDetailPanel
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default MyDayView;