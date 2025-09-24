import React, { useState } from 'react';
import { Plus, Calendar, List, LayoutGrid } from 'lucide-react';
import DefaultLayout from '@/components/layouts/DefaultLayout';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import TaskList from '@/components/tasks/TaskList';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskModal from '@/components/tasks/TaskModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskFilters as ITaskFilters, TaskWithOverdue } from '@/types/task';

interface TasksPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Tasks: React.FC<TasksPageProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [filters, setFilters] = useState<ITaskFilters>({});
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithOverdue | null>(null);
  const [activeView, setActiveView] = useState<'board' | 'calendar' | 'list'>('board');

  const handleCreateTask = () => {
    setIsNewTaskModalOpen(true);
  };

  const handleTaskClick = (task: TaskWithOverdue) => {
    setSelectedTask(task);
    setIsNewTaskModalOpen(true);
  };

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="Görev Panosu" 
      subtitle="Tüm görevlerinizi yönetin ve takip edin"
    >
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <TaskFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="board" className="flex items-center gap-1">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Pano</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Takvim</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Liste</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Görev
            </Button>
          </div>
        </div>

        {/* Content based on active view */}
        <div className="min-h-[600px]">
          {activeView === 'board' && (
            <TaskBoard filters={filters} />
          )}
          
          {activeView === 'calendar' && (
            <TaskCalendar filters={filters} onTaskClick={handleTaskClick} />
          )}
          
          {activeView === 'list' && (
            <TaskList filters={filters} onTaskClick={handleTaskClick} />
          )}
        </div>
      </div>

      {/* New Task Modal */}
      <TaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => {
          setIsNewTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        defaultStatus="todo"
      />
    </DefaultLayout>
  );
};

export default Tasks;