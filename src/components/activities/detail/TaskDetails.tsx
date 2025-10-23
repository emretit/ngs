
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task, TaskStatus, SubTask } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Star } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UnifiedDatePicker } from "@/components/ui/unified-dialog";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OpportunitySelector from "@/components/opportunities/OpportunitySelector";
import CustomerSelector from "@/components/proposals/form/CustomerSelector";
import { SubtaskManager } from "./subtasks";

interface TaskDetailsProps {
  task: Task;
  onClose?: () => void;
}

const TaskDetails = ({ task, onClose }: TaskDetailsProps) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<Task>(task);
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || []);
  
  // Form state'leri
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [isImportant, setIsImportant] = useState(task.priority === 'high');
  const [dueDate, setDueDate] = useState(task.due_date ? new Date(task.due_date) : undefined);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(task.assignee_id || "");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      console.error("Invalid date:", dateString);
      return "-";
    }
  };

  // Task prop'u değiştiğinde subtasks state'ini güncelle
  useEffect(() => {
    setSubtasks(task.subtasks || []);
  }, [task.subtasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Omit<Task, "subtasks">) => {
      setIsUpdating(true);
      
      // Sadece veritabanında olan kolonları gönder
      const { assignee, ...dbFields } = updatedTask;
      
      const { data, error } = await supabase
        .from("activities")
        .update(dbFields)
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Görev başarıyla güncellendi");
      if (onClose) onClose();
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

  const handleSave = () => {
    const updatedTask = {
      ...formData,
      title,
      description,
      status,
      priority: isImportant ? 'high' as const : 'medium' as const,
      due_date: dueDate?.toISOString(),
      assignee_id: selectedAssigneeId || null
    };
    updateTaskMutation.mutate(updatedTask);
  };

  const handleCustomerChange = (customerId: string, customerName: string, companyName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setSelectedCompanyName(companyName);
  };


  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-gray-900">Görev Detayları</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <form className="space-y-4">
          {/* Görev Başlığı ve Tarih Header */}
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Oluşturulma: {formatDate(task.created_at)}</span>
              {task.updated_at && task.updated_at !== task.created_at && (
                <span>Güncelleme: {formatDate(task.updated_at)}</span>
              )}
            </div>
          </div>

          {/* Başlık ve Açıklama */}
          <div className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Label className="text-xs font-medium text-gray-700">Durum</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="text-xs border-0 bg-transparent focus:ring-0 focus:outline-none font-normal"
              >
                <option value="todo">Yapılacak</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
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
          <div className="space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">Alt Görevler</h3>
            </div>
            
            <SubtaskManager 
              task={{...task, subtasks}} 
              onUpdate={handleUpdateSubtasks} 
              isUpdating={isUpdating}
            />
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
        {onClose && (
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
          >
            İptal
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 flex items-center space-x-2"
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Kaydediliyor...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Kaydet</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskDetails;
