
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task, TaskStatus, SubTask } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Star, Edit2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UnifiedDatePicker, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OpportunitySelector from "@/components/opportunities/OpportunitySelector";
import CustomerSelector from "@/components/proposals/form/CustomerSelector";
import { SubtaskManager } from "./subtasks";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface TaskDetailsProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetails = ({ task, isOpen, onClose }: TaskDetailsProps) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingValues, setEditingValues] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  
  // Form state'leri
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [isImportant, setIsImportant] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  // Task değiştiğinde state'leri güncelle
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setIsImportant(task.priority === 'high');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setSelectedAssigneeId(task.assignee_id || "");
      setSelectedOpportunityId(task.opportunity_id || "");
      setSubtasks(task.subtasks || []);
      setEditingValues(task);
    }
  }, [task]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      console.error("Invalid date:", dateString);
      return "-";
    }
  };

  const updateTaskMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data = {} 
    }: { 
      id: string; 
      data?: Partial<Task>;
    }) => {
      setIsUpdating(true);
      
      const { data: updatedTask, error } = await supabase
        .from("activities")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Görev başarıyla güncellendi");
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Görev güncellenirken bir hata oluştu");
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdateSubtasks = async (newSubtasks: SubTask[]) => {
    try {
      // Local state'i güncelle
      setSubtasks(newSubtasks);
      
      // Mevcut alt görevleri sil
      await supabase
        .from("subtasks")
        .delete()
        .eq("task_id", task.id);

      // Yeni alt görevleri ekle
      if (newSubtasks.length > 0) {
        const { error } = await supabase
          .from("subtasks")
          .insert(newSubtasks);

        if (error) throw error;
      }

      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Alt görevler başarıyla güncellendi");
    } catch (error) {
      console.error("Error updating subtasks:", error);
      toast.error("Alt görevler güncellenirken bir hata oluştu");
    }
  };

  const handleSaveChanges = async () => {
    if (!task) return;
    
    const updateData = {
      title,
      description,
      status,
      priority: isImportant ? 'high' as const : 'medium' as const,
      due_date: dueDate?.toISOString(),
      assignee_id: selectedAssigneeId || null,
      opportunity_id: selectedOpportunityId || null,
    };
    
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: updateData
    });
  };

  const handleCustomerChange = (customerId: string, customerName: string, companyName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setSelectedCompanyName(companyName);
  };


  if (!task) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col bg-white">
        {/* Header - UnifiedDialog stilinde */}
        <div className="flex items-center p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h2 className="text-lg font-semibold text-gray-900">Aktivite Detayları</h2>
            </div>
          </div>
          
        {/* Scrollable Content - NewActivityDialog form yapısı */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="p-3 space-y-3">
            {/* Başlık ve Açıklama */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Başlık *</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Aktivite başlığını girin"
                  className="h-8"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Açıklama</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Aktivite detaylarını girin"
                  rows={2}
                  className="resize-none h-8"
                />
              </div>
            </div>

            {/* Hızlı Seçimler */}
            <div className="grid grid-cols-2 gap-2">
              <OpportunitySelector
                value={selectedOpportunityId}
                onChange={setSelectedOpportunityId}
                label="Fırsat"
                placeholder="Fırsat seçin..."
                searchPlaceholder="Fırsat ara..."
                noResultsText="Fırsat bulunamadı"
                showLabel={true}
              />

              <EmployeeSelector
                value={selectedAssigneeId}
                onChange={setSelectedAssigneeId}
                label="Görevli"
                placeholder="Görevli seçin..."
                searchPlaceholder="Çalışan ara..."
                noResultsText="Çalışan bulunamadı"
                showLabel={true}
              />
                </div>

            {/* Müşteri ve Son Tarih */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <CustomerSelector
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  error=""
                />
              </div>
              <div className="space-y-1">
                  <UnifiedDatePicker
                    label="Son Tarih"
                    date={dueDate}
                    onSelect={(date) => setDueDate(date)}
                    placeholder="Tarih seçin"
                  />
                </div>
            </div>

            {/* Durum ve Önem */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Label className="text-xs font-medium text-gray-700">Durum</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="text-xs border-0 bg-transparent focus:ring-0 focus:outline-none font-normal"
                >
                  <option value="todo">Yapılacak</option>
                  <option value="in_progress">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="postponed">Ertelendi</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_important"
                  checked={isImportant}
                  onCheckedChange={setIsImportant}
                  className="scale-90"
                />
                <Label htmlFor="is_important" className="flex items-center space-x-1 cursor-pointer text-sm">
                  <Star className={`h-4 w-4 ${isImportant ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                  <span>Önemli</span>
                </Label>
                </div>
              </div>

              {/* Alt Görevler */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Alt Görevler</Label>
              <div className="p-2 bg-gray-50 rounded-lg">
                <SubtaskManager 
                  task={{...task, subtasks}} 
                  onUpdate={handleUpdateSubtasks} 
                  isUpdating={isUpdating}
                />
              </div>
            </div>
            
            {/* Görev Geçmişi */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Görev Geçmişi</Label>
            <div className="space-y-2">
              <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                <div className="p-1.5 rounded-full bg-green-100">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">Görev Oluşturuldu</span>
                    <span className="text-xs text-gray-500">
                      {task.created_at && format(new Date(task.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {task.title} başlıklı görev oluşturuldu
                  </p>
                </div>
              </div>
              
              {task.updated_at && task.updated_at !== task.created_at && (
                <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <Edit2 className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">Son Güncelleme</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(task.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Mevcut durum: {status === 'todo' && 'Yapılacak'}
                      {status === 'in_progress' && 'Devam Ediyor'}
                      {status === 'completed' && 'Tamamlandı'}
                      {status === 'postponed' && 'Ertelendi'}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
            </div>
          </div>
        
        {/* Footer - UnifiedDialogFooter stili */}
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose} disabled={updateTaskMutation.isPending} />
          <UnifiedDialogActionButton
            onClick={handleSaveChanges}
            variant="primary"
            disabled={updateTaskMutation.isPending}
            loading={updateTaskMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Değişiklikleri Kaydet
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetails;
