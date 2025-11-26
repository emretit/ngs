import React, { useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useKanbanTasks } from "../hooks/useKanbanTasks";
import { useActivitiesInfiniteScroll } from "@/hooks/useActivitiesInfiniteScroll";
import TasksContent from "../TasksContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import type { TaskStatus } from "@/types/task";

interface MyDayViewProps {
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

const MyDayView = ({ searchQuery, selectedEmployee, selectedType, selectedStatus, startDate, endDate }: MyDayViewProps) => {
  const { userData, displayName, loading } = useCurrentUser();
  
  // Bugün için tarih filtresi
  const todayStart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const todayEnd = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }, []);

  // İstatistikler için kanban tasks kullan (bugün filtresi ile)
  const { tasks: kanbanTasks, isLoading: isLoadingStats, error: statsError } = useKanbanTasks({
    searchQuery,
    selectedEmployee: selectedEmployee || userData?.employee_id || null,
    selectedType,
    selectedStatus,
    isMyDay: true,
    startDate: todayStart,
    endDate: todayEnd
  });

  // Liste görünümü için infinite scroll hook (bugün filtresi ile)
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    isLoadingMore,
    hasNextPage,
    error: tasksError,
    loadMore,
    totalCount,
  } = useActivitiesInfiniteScroll(
    {
      searchQuery,
      selectedEmployee: selectedEmployee || userData?.employee_id || null,
      selectedType,
      selectedStatus: selectedStatus || undefined,
      startDate: todayStart,
      endDate: todayEnd,
    },
    20
  );

  const isLoading = loading || isLoadingStats || isLoadingTasks;
  const error = statsError || tasksError;

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

  const totalTasks = Object.values(kanbanTasks).flat().length;
  const completedTasks = kanbanTasks.completed?.length || 0;
  const todoTasks = kanbanTasks.todo?.length || 0;
  const inProgressTasks = kanbanTasks.in_progress?.length || 0;

  return (
    <div className="space-y-6">
      {/* Bugün İstatistikleri */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoş geldin, {displayName}!</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">Bugün toplam görev</p>
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

      {/* Liste Görünümü - Bugün ile ilgili detaylar */}
      <TasksContent 
        tasks={tasks}
        isLoading={isLoadingTasks}
        isLoadingMore={isLoadingMore}
        hasNextPage={hasNextPage}
        loadMore={loadMore}
        totalCount={totalCount}
        error={tasksError ? (typeof tasksError === 'string' ? new Error(tasksError) : tasksError) : null}
        searchQuery={searchQuery}
        selectedEmployee={selectedEmployee || userData?.employee_id || null}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        startDate={todayStart}
        endDate={todayEnd}
      />
    </div>
  );
};

export default MyDayView;