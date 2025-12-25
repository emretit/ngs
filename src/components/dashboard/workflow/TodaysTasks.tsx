import { useState } from "react";
import { CheckCircle2, Circle, Clock, Star, ChevronRight, Plus, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string;
  isCompleted: boolean;
  isImportant: boolean;
  assignee?: string;
  relatedTo?: {
    type: 'opportunity' | 'proposal' | 'order' | 'customer';
    title: string;
  };
  type: 'call' | 'meeting' | 'follow_up' | 'task' | 'reminder';
}

interface TodaysTasksProps {
  tasks: Task[];
  onTaskComplete?: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: () => void;
}

const taskTypeConfig = {
  call: { label: 'Arama', color: 'text-blue-600 bg-blue-50' },
  meeting: { label: 'Toplantı', color: 'text-purple-600 bg-purple-50' },
  follow_up: { label: 'Takip', color: 'text-amber-600 bg-amber-50' },
  task: { label: 'Görev', color: 'text-gray-600 bg-gray-50' },
  reminder: { label: 'Hatırlatma', color: 'text-teal-600 bg-teal-50' }
};

export function TodaysTasks({ tasks, onTaskComplete, onTaskClick, onAddTask }: TodaysTasksProps) {
  const today = format(new Date(), "d MMMM EEEE", { locale: tr });
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bugünün Görevleri</h3>
            <p className="text-xs text-gray-500">{today}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onAddTask} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Ekle
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">{completedCount} / {tasks.length} tamamlandı</span>
          <span className="font-medium text-gray-700">{tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Bugün için görev yok</p>
            <Button size="sm" variant="ghost" onClick={onAddTask} className="mt-2">
              Yeni görev ekle
            </Button>
          </div>
        ) : (
          tasks.map((task) => {
            const typeConfig = taskTypeConfig[task.type];
            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task.id)}
                className={cn(
                  "group p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                  task.isCompleted 
                    ? "bg-gray-50 border-gray-100 opacity-60" 
                    : "bg-white border-gray-200 hover:border-primary/30 hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete?.(task.id);
                    }}
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      task.isCompleted 
                        ? "bg-green-500 border-green-500" 
                        : "border-gray-300 hover:border-green-400"
                    )}
                  >
                    {task.isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {task.isImportant && (
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm font-medium truncate",
                        task.isCompleted ? "line-through text-gray-400" : "text-gray-900"
                      )}>
                        {task.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", typeConfig.color)}>
                        {typeConfig.label}
                      </span>
                      {task.dueTime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueTime}
                        </span>
                      )}
                      {task.relatedTo && (
                        <span className="text-xs text-gray-400 truncate">
                          • {task.relatedTo.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pending Summary */}
      {pendingCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{pendingCount} görev bekliyor</span>
            <Button size="sm" variant="link" className="text-primary p-0 h-auto">
              Tümünü gör
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
