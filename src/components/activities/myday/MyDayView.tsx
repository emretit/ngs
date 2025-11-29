import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useKanbanTasks } from "../hooks/useKanbanTasks";
import { useActivitiesInfiniteScroll } from "@/hooks/useActivitiesInfiniteScroll";
import TasksContent from "../TasksContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, CheckCircle2, Circle } from "lucide-react";
import type { TaskStatus } from "@/types/task";

interface MyDayViewProps {
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

// "Aktivitelerim" (My Activities) görünümü - Sadece kullanıcıya atanmış tüm görevler
const MyDayView = ({ searchQuery, selectedEmployee, selectedType, selectedStatus, startDate, endDate }: MyDayViewProps) => {
  const { userData, displayName, loading } = useCurrentUser();

  // İstatistikler için kanban tasks kullan - TARİH FİLTRESİ YOK, tüm görevler
  const { tasks: kanbanTasks, isLoading: isLoadingStats, error: statsError } = useKanbanTasks({
    searchQuery,
    selectedEmployee: selectedEmployee || userData?.employee_id || null,
    selectedType,
    selectedStatus,
    isMyDay: true,
    // Tarih filtresi yok - tüm görevler
  });

  // Liste görünümü için infinite scroll hook - TARİH FİLTRESİ YOK
  // Status sıralaması aktif: yapılacak -> devam ediyor -> tamamlandı
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
      sortField: 'status', // Duruma göre sıralama
      sortDirection: 'asc', // Yapılacak üstte, tamamlandı altta
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
              <Briefcase className="h-5 w-5" />
              Aktivitelerim
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
              <Briefcase className="h-5 w-5" />
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
              <Briefcase className="h-5 w-5" />
              Aktivitelerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              "Aktivitelerim" özelliğini kullanabilmek için profilinizde bir çalışan eşleştirmesi yapılmalıdır.
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
  const activeTasks = todoTasks + inProgressTasks; // Aktif görevler (tamamlanmamış)

  return (
    <div className="space-y-6">
      {/* Aktivitelerim İstatistikleri */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Hoş geldin, {displayName}!</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeTasks}</div>
            <p className="text-xs text-blue-600">Aktif görevin var</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Yapılacaklar</CardTitle>
            <Circle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{todoTasks}</div>
            <p className="text-xs text-red-600">Bekleyen görev</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Devam Eden</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{inProgressTasks}</div>
            <p className="text-xs text-yellow-600">Üzerinde çalışıyorsun</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Tamamlanan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{completedTasks}</div>
            <p className="text-xs text-green-600">Bitirilen görev</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste Görünümü - Duruma göre gruplandırılmış */}
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
        sortField="status"
        sortDirection="asc"
      />
    </div>
  );
};

export default MyDayView;