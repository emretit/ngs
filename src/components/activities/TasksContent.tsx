import { useState, useEffect, useRef } from "react";
import { TasksTable } from "./table";
import TaskDetailPanel from "./TaskDetailPanel";
import type { Task, TaskStatus } from "@/types/task";
import { Loader2 } from "lucide-react";

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
  onSelectTask?: (task: Task) => void;
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
  onSelectTask 
}: TasksContentProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasNextPage, isLoadingMore, isLoading]);

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
            />
          </div>
        </div>
        
        {/* Infinite scroll trigger */}
        {hasNextPage && !isLoading && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Daha fazla aktivite yükleniyor...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Tüm aktiviteler yüklendi mesajı */}
        {!hasNextPage && tasks.length > 0 && (
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
