import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Task } from "@/services/taskManagementService";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export interface TaskListMessageProps {
  tasks: Task[];
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
}

export const TaskListMessage = ({ tasks, stats }: TaskListMessageProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'pending': return <Circle className="h-4 w-4 text-gray-400" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: '🔴 Acil',
      high: '🟠 Yüksek',
      medium: '🟡 Orta',
      low: '🟢 Düşük'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <div className="rounded-lg p-3 border-2 border-blue-200 bg-blue-50">
      {/* Stats Header */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Circle className="h-4 w-4" />
          Görev Özeti
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-md p-2 border border-blue-100">
            <div className="text-xs text-gray-600">Toplam</div>
            <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-md p-2 border border-blue-100">
            <div className="text-xs text-gray-600">Bekleyen</div>
            <div className="text-lg font-bold text-blue-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-md p-2 border border-blue-100">
            <div className="text-xs text-gray-600">Devam Eden</div>
            <div className="text-lg font-bold text-orange-600">{stats.in_progress}</div>
          </div>
          <div className="bg-white rounded-md p-2 border border-blue-100">
            <div className="text-xs text-gray-600">Tamamlanan</div>
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
          </div>
        </div>
        {stats.overdue > 0 && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-700 font-medium">
              {stats.overdue} görevin vadesi geçmiş
            </span>
          </div>
        )}
      </div>

      {/* Task List */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-blue-900">Son Görevler</h5>
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className={cn(
                "bg-white rounded-md p-2 border transition-all duration-150 hover:shadow-sm",
                task.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium line-clamp-1",
                    task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] h-4 px-1.5", getPriorityColor(task.priority))}
                    >
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    {task.due_date && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(task.due_date), "d MMM", { locale: tr })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {tasks.length > 5 && (
            <p className="text-[10px] text-gray-500 text-center">
              +{tasks.length - 5} görev daha
            </p>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-4 text-xs text-gray-500">
          Henüz görev bulunmuyor
        </div>
      )}
    </div>
  );
};

