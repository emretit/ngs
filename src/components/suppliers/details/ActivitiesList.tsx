
import { useState, useMemo } from "react";
import { logger } from '@/utils/logger';
import { Supplier } from "@/types/supplier";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { TasksTable } from "@/components/activities/table";
import { Task, TaskStatus } from "@/types/task";
import { Plus } from "lucide-react";
import NewActivityDialog from "@/components/activities/NewActivityDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ActivitiesListProps {
  supplier: Supplier;
}

export const ActivitiesList = ({ supplier }: ActivitiesListProps) => {
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { userData, loading: userLoading } = useCurrentUser();
  const { getClient } = useAuth();
  const client = getClient();
  const queryClient = useQueryClient();

  // Tedarikçiye özel aktiviteleri doğrudan çek
  const {
    data: supplierActivities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "supplier-activities",
      supplier.id,
      userData?.company_id,
      searchQuery,
      typeFilter,
      statusFilter,
      startDate,
      endDate,
      sortField,
      sortDirection
    ],
    queryFn: async () => {
      if (userLoading || !userData?.company_id) {
        return [];
      }

      let query = client
        .from("activities")
        .select(
          `
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          subtasks(
            id,
            title,
            completed,
            created_at
          )
        `
        )
        
        .eq("related_item_type", "supplier")
        .eq("related_item_id", supplier.id);

      // Tarih filtresi
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDateTime.toISOString());
      }

      // Type filtresi
      if (typeFilter !== 'all') {
        query = query.eq("type", typeFilter);
      }

      // Status filtresi
      if (statusFilter !== 'all') {
        query = query.eq("status", statusFilter);
      }

      // Search filtresi
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Sıralama
      const ascending = sortDirection === 'asc';
      const orderField = sortField === 'assignee' ? 'assignee_id' : sortField;
      query = query.order(orderField || 'created_at', { ascending: sortDirection === 'asc' });

      const { data, error: queryError } = await query;

      if (queryError) {
        logger.error("Error fetching supplier activities:", queryError);
        throw queryError;
      }

      const transformedData = (data || []).map((task: any) => ({
        ...task,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              first_name: task.assignee.first_name,
              last_name: task.assignee.last_name,
              avatar_url: task.assignee.avatar_url,
            }
          : undefined,
      })) as Task[];

      return transformedData;
    },
    enabled: !!supplier.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleAddActivity = () => {
    setIsNewActivityDialogOpen(true);
  };

  const handleActivitySuccess = () => {
    setIsNewActivityDialogOpen(false);
    // Query'yi yenile
    queryClient.invalidateQueries({
      queryKey: ["supplier-activities", supplier.id]
    });
  };

  // İstatistik bilgilerini hesapla
  const activityStats = useMemo(() => {
    const total = supplierActivities.length;
    const todo = supplierActivities.filter(a => a.status === 'todo').length;
    const inProgress = supplierActivities.filter(a => a.status === 'in_progress').length;
    const completed = supplierActivities.filter(a => a.status === 'completed').length;
    const postponed = supplierActivities.filter(a => a.status === 'postponed').length;

    return {
      total,
      todo,
      inProgress,
      completed,
      postponed,
    };
  }, [supplierActivities]);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Aktivite Geçmişi</h3>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Yapılacaklar</span>
              <span className="text-sm font-semibold text-red-600">
                {activityStats.todo}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Devam Ediyor</span>
              <span className="text-sm font-semibold text-yellow-600">
                {activityStats.inProgress}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Tamamlandı</span>
              <span className="text-sm font-semibold text-green-600">
                {activityStats.completed}
              </span>
            </div>
            {activityStats.postponed > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Ertelendi</span>
                  <span className="text-sm font-semibold text-gray-600">
                    {activityStats.postponed}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tipler</SelectItem>
              <SelectItem value="general">Genel</SelectItem>
              <SelectItem value="call">Arama</SelectItem>
              <SelectItem value="meeting">Toplantı</SelectItem>
              <SelectItem value="follow_up">Takip</SelectItem>
              <SelectItem value="email">E-posta</SelectItem>
              <SelectItem value="reminder">Hatırlatıcı</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Durumlar</SelectItem>
              <SelectItem value="todo">Yapılacaklar</SelectItem>
              <SelectItem value="in_progress">Devam Ediyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="postponed">Ertelendi</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="Başlangıç"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Bitiş"
            />
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={handleAddActivity}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aktivite Ekle
          </Button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-red-500">Hata oluştu</div>
                </div>
              ) : (
                <TasksTable
                  tasks={supplierActivities}
                  isLoading={isLoading}
                  onSelectTask={handleSelectTask}
                  searchQuery={searchQuery}
                  selectedStatus={statusFilter !== 'all' ? statusFilter : null}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Activity Dialog */}
      <NewActivityDialog
        isOpen={isNewActivityDialogOpen}
        onClose={() => setIsNewActivityDialogOpen(false)}
        onSuccess={handleActivitySuccess}
        relatedItemId={supplier.id}
        relatedItemTitle={supplier.name || supplier.company || 'Tedarikçi'}
        relatedItemType="supplier"
      />
    </div>
  );
};

