
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task, TaskStatus, SubTask } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Edit2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UnifiedDatePicker } from "@/components/ui/unified-dialog";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OpportunitySelector from "@/components/opportunities/OpportunitySelector";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useForm, FormProvider } from "react-hook-form";
import { SubtaskManager } from "./subtasks";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

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
  const [dueDate, setDueDate] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  // Form context for ProposalPartnerSelect
  const partnerForm = useForm({
    defaultValues: {
      customer_id: selectedCustomerId || "",
      supplier_id: ""
    }
  });

  // Task değiştiğinde state'leri güncelle
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setIsImportant(task.is_important || false);
      // Tarih formatını string'e çevir (YYYY-MM-DD)
      if (task.due_date) {
        const date = new Date(task.due_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate("");
      }
      setSelectedAssigneeId(task.assignee_id || "");
      setSelectedOpportunityId(task.opportunity_id || "");
      setSelectedCustomerId(task.customer_id || "");
      setSubtasks(task.subtasks || []);
      setEditingValues(task);
      
      // Form'u güncelle
      partnerForm.reset({
        customer_id: task.customer_id || "",
        supplier_id: ""
      });
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
      onClose();
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
      is_important: isImportant,
      due_date: dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : null,
      customer_id: selectedCustomerId || null,
      assignee_id: selectedAssigneeId || null,
      opportunity_id: selectedOpportunityId || null,
    };
    
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: updateData
    });
  };

  // Watch form changes for customer_id
  const watchedCustomerId = partnerForm.watch("customer_id");
  useEffect(() => {
    if (watchedCustomerId && watchedCustomerId !== selectedCustomerId) {
      setSelectedCustomerId(watchedCustomerId);
      // Fetch customer details
      const fetchCustomerDetails = async () => {
        const { data } = await supabase
          .from("customers")
          .select("id, name, company")
          .eq("id", watchedCustomerId)
          .single();
        
        if (data) {
          setSelectedCustomerName(data.name || "");
          setSelectedCompanyName(data.company || data.name || "");
        }
      };
      fetchCustomerDetails();
    } else if (!watchedCustomerId && selectedCustomerId) {
      setSelectedCustomerId("");
      setSelectedCustomerName("");
      setSelectedCompanyName("");
    }
  }, [watchedCustomerId]);


  if (!task) return null;

  return (
    <>
      {/* Custom Overlay for modal={false} */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
          style={{ pointerEvents: 'auto' }}
          onClick={() => onClose()}
        />
      )}

      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col border-l border-gray-200 bg-white">
        {/* Header */}
        <SheetHeader className="text-left border-b pb-3 mb-0 px-3 pt-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <SheetTitle className="text-lg font-semibold text-gray-900">Aktivite Detayları</SheetTitle>
          </div>
        </SheetHeader>
          
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
              <div className="space-y-2">
            {/* Başlık ve Açıklama */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs font-medium text-gray-700">Başlık *</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Aktivite başlığını girin"
                  className="h-8 text-xs"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-medium text-gray-700">Açıklama</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Aktivite detaylarını girin"
                  rows={2}
                  className="resize-none text-xs"
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
                <FormProvider {...partnerForm}>
                  <ProposalPartnerSelect 
                    partnerType="customer" 
                    placeholder="Müşteri seçin..."
                    hideLabel={false}
                  />
                </FormProvider>
              </div>
              <div className="space-y-1">
                <UnifiedDatePicker
                  label="Son Tarih"
                  date={dueDate ? new Date(dueDate + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      // Timezone kaymasını önlemek için yerel tarih formatını kullan
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setDueDate(`${year}-${month}-${day}`);
                    } else {
                      setDueDate("");
                    }
                  }}
                  placeholder="Tarih seçin"
                />
              </div>
            </div>

            {/* Durum ve Önem */}
            <div className="p-1.5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Durum</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 hover:border-primary/50 transition-colors w-full text-xs">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Yapılacak</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span>Devam Ediyor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Tamamlandı</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="postponed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>Ertelendi</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Önem</Label>
                  <div className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer h-9",
                    isImportant 
                      ? "bg-yellow-50 border-yellow-200" 
                      : "bg-white border-gray-200 hover:border-yellow-300"
                  )}>
                    <Label htmlFor="is_important" className="flex items-center gap-1.5 cursor-pointer text-xs font-medium flex-1">
                      <Star className={cn(
                        "h-4 w-4 transition-all duration-200",
                        isImportant ? "text-yellow-500 fill-yellow-500 scale-110" : "text-gray-400"
                      )} />
                      <span className={isImportant ? "text-yellow-700" : "text-gray-600"}>Önemli</span>
                    </Label>
                    <Switch
                      id="is_important"
                      checked={isImportant}
                      onCheckedChange={setIsImportant}
                      className="scale-90"
                    />
                  </div>
                </div>
              </div>
            </div>

              {/* Alt Görevler */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Alt Görevler</Label>
              <div className="p-1 bg-gray-50 rounded-lg">
                <SubtaskManager 
                  task={{...task, subtasks}} 
                  onUpdate={handleUpdateSubtasks} 
                  isUpdating={isUpdating}
                />
              </div>
            </div>
            
            {/* Görev Geçmişi */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Görev Geçmişi</Label>
            <div className="space-y-1.5">
              <div className="flex items-start space-x-2 p-1 bg-gray-50 rounded-lg">
                <div className="p-1 rounded-full bg-green-100">
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
                <div className="flex items-start space-x-2 p-1 bg-gray-50 rounded-lg">
                  <div className="p-1 rounded-full bg-blue-100">
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
          </div>
        </div>
        
        {/* Footer */}
        <SheetFooter className="flex justify-end gap-2 pt-2 px-3 pb-3 mt-auto border-t flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={updateTaskMutation.isPending}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            İptal
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={updateTaskMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updateTaskMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  );
};

export default TaskDetails;
