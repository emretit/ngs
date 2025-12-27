import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2,
  Circle,
  Clock,
  Star,
  Calendar,
  User,
  ChevronRight,
  Plus,
  Filter,
  LayoutList,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  assignee: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  progress?: number;
}

interface SmartTaskManagementProps {
  tasks?: Task[];
  onTaskClick?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onAddTask?: () => void;
}

const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400' },
  medium: { label: 'Orta', color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' }
};

const statusConfig = {
  todo: { label: 'Yapılacak', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-700' }
};

export const SmartTaskManagement = memo(({ tasks: propTasks, onTaskClick, onTaskComplete, onAddTask }: SmartTaskManagementProps) => {
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const [filter, setFilter] = useState<'all' | 'my' | 'high'>('all');

  // Mock data
  const mockTasks: Task[] = propTasks || [
    {
      id: '1',
      title: 'Müşteri sunumu hazırla',
      description: 'Q4 satış hedefleri için sunum',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2024-01-15',
      assignee: { name: 'Ahmet Yılmaz' },
      tags: ['Satış', 'Sunum'],
      progress: 65
    },
    {
      id: '2',
      title: 'Fatura kontrolü yap',
      description: 'Aralık ayı faturaları',
      priority: 'urgent',
      status: 'todo',
      dueDate: '2024-01-10',
      assignee: { name: 'Ayşe Demir' },
      tags: ['Finans', 'Kontrol'],
      progress: 0
    },
    {
      id: '3',
      title: 'Stok sayımı planla',
      description: 'Çeyrek dönem stok sayımı',
      priority: 'medium',
      status: 'todo',
      dueDate: '2024-01-20',
      assignee: { name: 'Mehmet Kaya' },
      tags: ['Stok', 'Planlama'],
      progress: 20
    },
    {
      id: '4',
      title: 'Yeni çalışan oryantasyonu',
      description: 'IT departmanı eğitim',
      priority: 'low',
      status: 'completed',
      dueDate: '2024-01-08',
      assignee: { name: 'Zeynep Şahin' },
      tags: ['İK', 'Eğitim'],
      progress: 100
    },
    {
      id: '5',
      title: 'Tedarikçi toplantısı',
      description: 'Yeni anlaşma görüşmesi',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2024-01-12',
      assignee: { name: 'Can Arslan' },
      tags: ['Satın Alma', 'Toplantı'],
      progress: 40
    },
    {
      id: '6',
      title: 'Raporlama sistemi güncellemesi',
      description: 'Dashboard metrikleri',
      priority: 'medium',
      status: 'todo',
      dueDate: '2024-01-18',
      assignee: { name: 'Elif Yıldız' },
      tags: ['IT', 'Geliştirme'],
      progress: 10
    }
  ];

  const filteredTasks = mockTasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'my') return true; // Buraya kullanıcı kontrolü eklenecek
    if (filter === 'high') return task.priority === 'high' || task.priority === 'urgent';
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const TaskCard = ({ task }: { task: Task }) => {
    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status];
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

    return (
      <div
        onClick={() => onTaskClick?.(task.id)}
        className={cn(
          "group p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg",
          task.status === 'completed' 
            ? "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 opacity-60" 
            : "bg-background border-border hover:border-primary/30"
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
              "mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
              task.status === 'completed'
                ? "bg-emerald-500 border-emerald-500"
                : "border-gray-300 hover:border-emerald-400 hover:scale-110"
            )}
          >
            {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-white" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title & Priority */}
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", priority.dot)} />
              <h4 className={cn(
                "text-sm font-semibold truncate",
                task.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] px-2 py-0.5", priority.color)}>
                  {priority.label}
                </Badge>
                <Badge className={cn("text-[10px] px-2 py-0.5", status.color)}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className={cn(isOverdue && "text-red-500 font-semibold")}>
                  {format(new Date(task.dueDate), "d MMM", { locale: tr })}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {task.progress !== undefined && task.status !== 'completed' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>İlerleme</span>
                  <span className="font-semibold">{task.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Akıllı Görev Yönetimi</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {filteredTasks.length} görev • {inProgressTasks.length} devam ediyor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
              <TabsList className="grid w-[180px] grid-cols-2 h-8">
                <TabsTrigger value="list" className="text-xs">
                  <LayoutList className="h-3.5 w-3.5 mr-1" />
                  Liste
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  Zaman
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filtrele
            </Button>

            {/* Add Task */}
            <Button onClick={onAddTask} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Yeni
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {view === 'list' ? (
          <div className="grid grid-cols-3 gap-4">
            {/* Todo Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Yapılacak ({todoTasks.length})
                </h3>
                <Circle className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Devam Eden ({inProgressTasks.length})
                </h3>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-2">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Completed Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Tamamlanan ({completedTasks.length})
                </h3>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Zaman çizelgesi görünümü</p>
            {filteredTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SmartTaskManagement.displayName = "SmartTaskManagement";

