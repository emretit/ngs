import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useKanbanTasks } from "../hooks/useKanbanTasks";
import TaskKanbanBoard from "../kanban/TaskKanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import type { TaskStatus } from "@/types/task";

interface MyDayViewProps {
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
}

const MyDayView = ({ searchQuery, selectedEmployee, selectedType, selectedStatus }: MyDayViewProps) => {
  const { userData, displayName, loading } = useCurrentUser();
  
  const { tasks, isLoading, error } = useKanbanTasks({
    searchQuery,
    selectedEmployee,
    selectedType,
    selectedStatus,
    isMyDay: true // Bu önemli - "Benim Günüm" filtresini aktif eder
  });

  if (loading || isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Benim Günüm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <User className="h-5 w-5" />
              Hata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Görevler yüklenirken bir hata oluştu.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData?.employee_id) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Benim Günüm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              "Benim Günüm" özelliğini kullanabilmek için profilinizde bir çalışan eşleştirmesi yapılmalıdır.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalTasks = Object.values(tasks).flat().length;
  const completedTasks = tasks.completed?.length || 0;
  const todoTasks = tasks.todo?.length || 0;
  const inProgressTasks = tasks.in_progress?.length || 0;

  return (
    <div className="space-y-6">
      {/* Benim Günüm Header */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoş geldin, {displayName}!</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">Toplam görev</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yapılacaklar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks}</div>
            <p className="text-xs text-muted-foreground">Bekleyen görev</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Aktif görev</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Bitirilen görev</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board - Sadece boş bir div şimdilik, çünkü TaskKanbanBoard tipi uyumsuz */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Görevlerim</h3>
        {totalTasks === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Size atanmış görev bulunmamaktadır.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            {/* Yapılacaklar */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Yapılacaklar ({todoTasks})</h4>
              <div className="space-y-2">
                {tasks.todo?.map(task => (
                  <div key={task.id} className="p-3 bg-background border rounded-lg">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Devam Eden */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Devam Eden ({inProgressTasks})</h4>
              <div className="space-y-2">
                {tasks.in_progress?.map(task => (
                  <div key={task.id} className="p-3 bg-background border rounded-lg">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ertelenen */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Ertelenen ({tasks.postponed?.length || 0})</h4>
              <div className="space-y-2">
                {tasks.postponed?.map(task => (
                  <div key={task.id} className="p-3 bg-background border rounded-lg">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tamamlanan */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Tamamlanan ({completedTasks})</h4>
              <div className="space-y-2">
                {tasks.completed?.map(task => (
                  <div key={task.id} className="p-3 bg-background border rounded-lg opacity-60">
                    <p className="font-medium text-sm line-through">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDayView;