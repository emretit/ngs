
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
import { Save, X, Star, Phone, Mail, MessageSquare, Calendar, User, Edit2, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UnifiedDatePicker } from "@/components/ui/unified-dialog";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OpportunitySelector from "@/components/opportunities/OpportunitySelector";
import CustomerSelector from "@/components/proposals/form/CustomerSelector";
import { SubtaskManager } from "./subtasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto border-l border-gray-200 bg-white">
        <SheetHeader className="text-left border-b pb-4 mb-4">
          {/* Modern Header with Gradient Background */}
          <div className="flex items-center justify-between p-4 -m-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
                <div className="flex items-center text-xs text-gray-600 mt-0.5 space-x-3">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Oluşturulma: {formatDate(task.created_at)}</span>
                  </div>
                  {task.updated_at && task.updated_at !== task.created_at && (
                    <div className="flex items-center">
                      <Edit2 className="h-3 w-3 mr-1" />
                      <span>Revize: {formatDate(task.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200">
                {status === 'todo' && 'Yapılacak'}
                {status === 'in_progress' && 'Devam Ediyor'}
                {status === 'completed' && 'Tamamlandı'}
                {status === 'postponed' && 'Ertelendi'}
              </span>
            </div>
          </div>
          
        </SheetHeader>
        
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
              <div>
                <Label className="text-xs">Başlık</Label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-800">Açıklama</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12 text-xs resize-none" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-800">Durum</Label>
                  <Select 
                    value={status}
                    onValueChange={(val) => setStatus(val as TaskStatus)}
                  >
                    <SelectTrigger className="border-gray-200 focus:ring-gray-100">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Yapılacak</SelectItem>
                      <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="postponed">Ertelendi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-800">Öncelik</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_important"
                      checked={isImportant}
                      onCheckedChange={setIsImportant}
                    />
                    <Label htmlFor="is_important" className="flex items-center space-x-1 cursor-pointer">
                      <Star className={`h-4 w-4 ${isImportant ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                      <span>Önemli</span>
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-800">Son Tarih</Label>
                  <UnifiedDatePicker
                    label="Son Tarih"
                    date={dueDate}
                    onSelect={(date) => setDueDate(date)}
                    placeholder="Tarih seçin"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-800">Görevli</Label>
                  <EmployeeSelector
                    value={selectedAssigneeId}
                    onChange={setSelectedAssigneeId}
                    placeholder="Görevli seçin..."
                    searchPlaceholder="Çalışan ara..."
                    noResultsText="Çalışan bulunamadı"
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Alt Görevler */}
              <div>
                <Label className="text-gray-800">Alt Görevler</Label>
                <SubtaskManager 
                  task={{...task, subtasks}} 
                  onUpdate={handleUpdateSubtasks} 
                  isUpdating={isUpdating}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSaveChanges}
                disabled={updateTaskMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </Button>
            </div>
          </div>

         {/* Geçmiş Bilgileri */}
         <div className="space-y-3">
           <h3 className="text-sm font-medium text-gray-800 border-b pb-1">Görev Geçmişi</h3>
            
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
        
        <SheetFooter className="flex justify-end pt-3 mt-4 border-t">
          <Button 
            onClick={handleSaveChanges}
            variant="outline" 
            size="sm"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 text-xs"
          >
            <Save className="mr-1 h-3 w-3" />
            Kaydet
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetails;
