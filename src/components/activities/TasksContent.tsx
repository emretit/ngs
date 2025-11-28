import { useState, useEffect } from "react";
import { TasksTable } from "./table";
import TaskDetailPanel from "./TaskDetailPanel";
import type { Task, TaskStatus } from "@/types/task";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface TasksContentProps {
  tasks: Task[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error?: Error | null;
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  selectedTaskId?: string | null;
  onSelectTask?: (task: Task) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const TasksContent = ({ 
  tasks,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  searchQuery, 
  selectedEmployee, 
  selectedType,
  selectedStatus,
  startDate,
  endDate,
  selectedTaskId,
  onSelectTask,
  sortField,
  sortDirection,
  onSort
}: TasksContentProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // URL'den gelen task ID'sine göre task'ı seç ve paneli aç
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        setSelectedTask(task);
        setIsDetailOpen(true);
        if (onSelectTask) {
          onSelectTask(task);
        }
      }
    }
  }, [selectedTaskId, tasks, onSelectTask]);

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
    if (onSelectTask) {
      onSelectTask(task);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <TasksTable
              tasks={tasks}
              isLoading={false}
              onSelectTask={handleSelectTask}
              searchQuery={searchQuery}
              selectedEmployee={selectedEmployee}
              selectedType={selectedType}
              selectedStatus={selectedStatus}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </div>
        </div>
        
        {/* Infinite scroll trigger - TasksTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
        {hasNextPage && !isLoading && (
          <div className="px-4">
            <InfiniteScroll
              hasNextPage={hasNextPage}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore || (() => {})}
              className="mt-4"
            >
              <div />
            </InfiniteScroll>
          </div>
        )}
        
        {/* Tüm aktiviteler yüklendi mesajı */}
        {!hasNextPage && tasks.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm aktiviteler yüklendi ({totalCount || tasks.length} aktivite)
          </div>
        )}
        
        <TaskDetailPanel
          task={selectedTask}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
};

export default TasksContent;
