
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  employee_id: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface EmployeeTasksTabProps {
  employeeId: string;
  employeeName: string;
}

export const EmployeeTasksTab = ({ employeeId, employeeName }: EmployeeTasksTabProps) => {
  const [columns, setColumns] = useState<{ [key: string]: Column }>({
    todo: {
      id: 'todo',
      title: 'Yapılacaklar',
      tasks: []
    },
    in_progress: {
      id: 'in_progress',
      title: 'Devam Edenler',
      tasks: []
    },
    completed: {
      id: 'completed',
      title: 'Tamamlananlar',
      tasks: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    employee_id: employeeId
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        // This is a placeholder until the actual tasks table is created
        // Using mock data for now
        const mockTasks: Task[] = [
          {
            id: '1',
            title: 'Proje A için dokümantasyon',
            description: 'Proje A için teknik dokümanların hazırlanması',
            status: 'todo',
            priority: 'high',
            due_date: '2023-10-30',
            created_at: '2023-10-15T00:00:00Z',
            employee_id: employeeId
          },
          {
            id: '2',
            title: 'Haftalık rapor hazırlama',
            description: 'Geçen haftanın iş özeti ve ilerleyişi',
            status: 'in_progress',
            priority: 'medium',
            due_date: '2023-10-25',
            created_at: '2023-10-20T00:00:00Z',
            employee_id: employeeId
          },
          {
            id: '3',
            title: 'Müşteri toplantısı',
            description: 'ABC Firması ile yeni proje hakkında görüşme',
            status: 'completed',
            priority: 'high',
            due_date: '2023-10-18',
            created_at: '2023-10-10T00:00:00Z',
            employee_id: employeeId
          },
          {
            id: '4',
            title: 'Eğitim webinarına katılım',
            description: 'Yeni teknolojiler hakkında online eğitim',
            status: 'todo',
            priority: 'low',
            due_date: '2023-11-05',
            created_at: '2023-10-22T00:00:00Z',
            employee_id: employeeId
          }
        ];
        
        // Group the tasks by status
        const newColumns = { ...columns };
        newColumns.todo.tasks = mockTasks.filter(task => task.status === 'todo');
        newColumns.in_progress.tasks = mockTasks.filter(task => task.status === 'in_progress');
        newColumns.completed.tasks = mockTasks.filter(task => task.status === 'completed');
        
        setColumns(newColumns);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Görevler yüklenirken bir hata oluştu.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [employeeId, toast]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Find the task that was dragged
    const sourceColumn = columns[source.droppableId];
    const destinationColumn = columns[destination.droppableId];
    
    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const tasks = Array.from(sourceColumn.tasks);
      const [removed] = tasks.splice(source.index, 1);
      tasks.splice(destination.index, 0, removed);
      
      const newColumns = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: tasks
        }
      };
      
      setColumns(newColumns);
    } else {
      // Moving from one column to another
      const sourceTasks = Array.from(sourceColumn.tasks);
      const destinationTasks = Array.from(destinationColumn.tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      
      // Update the task's status
      const updatedTask = { ...removed, status: destination.droppableId as 'todo' | 'in_progress' | 'completed' };
      
      destinationTasks.splice(destination.index, 0, updatedTask);
      
      const newColumns = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: sourceTasks
        },
        [destination.droppableId]: {
          ...destinationColumn,
          tasks: destinationTasks
        }
      };
      
      setColumns(newColumns);
      
      // Here you would update the task in your database
      // This is a placeholder
      console.log('Task status updated:', updatedTask);
      
      toast({
        title: "Başarılı",
        description: "Görev durumu güncellendi.",
      });
    }
  };

  const handleCreateTask = () => {
    // Validate the task
    if (!newTask.title) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Görev başlığı zorunludur.",
      });
      return;
    }
    
    // Create a new task
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title || '',
      description: newTask.description || '',
      status: newTask.status as 'todo' | 'in_progress' | 'completed',
      priority: newTask.priority as 'low' | 'medium' | 'high',
      due_date: newTask.due_date,
      created_at: new Date().toISOString(),
      employee_id: employeeId
    };
    
    // Update the columns
    const newColumns = { ...columns };
    newColumns[task.status].tasks = [...newColumns[task.status].tasks, task];
    setColumns(newColumns);
    
    // Reset the form
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      employee_id: employeeId
    });
    
    setIsTaskFormOpen(false);
    
    toast({
      title: "Başarılı",
      description: "Yeni görev oluşturuldu.",
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    
    // Validate the task
    if (!editingTask.title) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Görev başlığı zorunludur.",
      });
      return;
    }
    
    // Find and update the task in the correct column
    const oldStatus = columns.todo.tasks.find(t => t.id === editingTask.id) ? 'todo' :
                     columns.in_progress.tasks.find(t => t.id === editingTask.id) ? 'in_progress' :
                     'completed';
    
    const newColumns = { ...columns };
    
    // If status changed, remove from old column and add to new one
    if (oldStatus !== editingTask.status) {
      newColumns[oldStatus].tasks = newColumns[oldStatus].tasks.filter(t => t.id !== editingTask.id);
      newColumns[editingTask.status].tasks = [...newColumns[editingTask.status].tasks, editingTask];
    } else {
      // Update in the same column
      newColumns[oldStatus].tasks = newColumns[oldStatus].tasks.map(t => 
        t.id === editingTask.id ? editingTask : t
      );
    }
    
    setColumns(newColumns);
    setEditingTask(null);
    
    toast({
      title: "Başarılı",
      description: "Görev güncellendi.",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    // Find which column contains the task
    let columnId: string | null = null;
    for (const [id, column] of Object.entries(columns)) {
      if (column.tasks.some(task => task.id === taskId)) {
        columnId = id;
        break;
      }
    }
    
    if (!columnId) return;
    
    // Remove the task from the column
    const newColumns = { ...columns };
    newColumns[columnId].tasks = newColumns[columnId].tasks.filter(task => task.id !== taskId);
    setColumns(newColumns);
    
    toast({
      title: "Başarılı",
      description: "Görev silindi.",
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Görev Yönetimi</h2>
        <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Görev
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Yeni Görev Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Görev Başlığı*
                </label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Açıklama
                </label>
                <Textarea
                  id="description"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Durum
                  </label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Yapılacak</SelectItem>
                      <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Öncelik
                  </label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="due_date" className="text-sm font-medium">
                    Bitiş Tarihi
                  </label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateTask}>Görev Oluştur</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(columns).reduce((count, column) => count + column.tasks.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Görevler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {columns.completed.tasks.length}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Tamamlanmış
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Görevler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(columns)
                .flatMap(column => column.tasks)
                .filter(task => 
                  task.status !== 'completed' && 
                  task.due_date && 
                  new Date(task.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-500" />
              Önümüzdeki 7 gün içinde
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Görevler yükleniyor...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(columns).map((column) => (
              <div key={column.id} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-medium">
                    {column.title} ({column.tasks.length})
                  </h3>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-4 min-h-[400px]"
                    >
                      {column.tasks.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 italic">
                          Bu kolonda görev bulunmamaktadır
                        </div>
                      ) : (
                        column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-gray-50 p-4 mb-3 rounded-lg border shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditTask(task)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {task.description || "Açıklama yok"}
                                </p>
                                <div className="flex justify-between items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                  </span>
                                  {task.due_date && (
                                    <span className="flex items-center text-xs text-gray-500 gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(task.due_date).toLocaleDateString('tr-TR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Görevi Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Görev Başlığı*
                </label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
                  Açıklama
                </label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-status" className="text-sm font-medium">
                    Durum
                  </label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value) => setEditingTask({ ...editingTask, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Yapılacak</SelectItem>
                      <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-priority" className="text-sm font-medium">
                    Öncelik
                  </label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-due_date" className="text-sm font-medium">
                    Bitiş Tarihi
                  </label>
                  <Input
                    id="edit-due_date"
                    type="date"
                    value={editingTask.due_date}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateTask}>Görevi Güncelle</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
