import { useState, useEffect } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task, TaskStatus, SubTask } from "@/types/task";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCircle2, Edit2, Star, Calendar, User, Building2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EditableDetailSheet, FieldConfig } from "@/components/common/EditableDetailSheet";
import { SubtaskManager } from "./subtasks";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OpportunitySelector from "@/components/opportunities/OpportunitySelector";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useForm, FormProvider } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface TaskDetailsProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

// Zod schema for validation
const taskSchema = z.object({
  title: z.string().min(1, "Başlık gereklidir"),
  description: z.string().optional(),
  type: z.enum(["general", "opportunity", "proposal", "service", "call", "meeting", "follow_up", "reminder", "email"]),
  status: z.enum(["todo", "in_progress", "completed", "postponed"]),
  priority: z.enum(["low", "medium", "high"]),
  is_important: z.boolean().optional(),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
  opportunity_id: z.string().optional(),
  related_item_id: z.string().optional(),
  related_item_type: z.string().optional(),
  related_item_title: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Status options
const statusOptions = [
  { value: "todo", label: "🔴 Yapılacak" },
  { value: "in_progress", label: "🟡 Devam Ediyor" },
  { value: "completed", label: "🟢 Tamamlandı" },
  { value: "postponed", label: "⚪ Ertelendi" },
];

const TaskDetails = ({ task, isOpen, onClose }: TaskDetailsProps) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  // Form context for ProposalPartnerSelect
  const partnerForm = useForm({
    defaultValues: {
      customer_id: task?.related_item_type === 'customer' ? task.related_item_id || "" : "",
      supplier_id: ""
    }
  });

  // Update subtasks when task changes
  useEffect(() => {
    if (task?.subtasks) {
      setSubtasks(task.subtasks);
    }
  }, [task]);

  // Update partner form when task changes
  useEffect(() => {
    if (task) {
      partnerForm.reset({
        customer_id: task.related_item_type === 'customer' ? task.related_item_id || "" : "",
        supplier_id: ""
      });
    }
  }, [task, partnerForm]);

  // Watch customer_id changes
  const watchedCustomerId = partnerForm.watch("customer_id");
  useEffect(() => {
    if (watchedCustomerId) {
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
    } else {
      setSelectedCustomerName("");
      setSelectedCompanyName("");
    }
  }, [watchedCustomerId]);

  // Update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!task?.id) throw new Error('Task ID is required');

      const { data: updatedTask, error } = await supabase
        .from("activities")
        .update({
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          priority: data.priority,
          is_important: data.is_important,
          due_date: data.due_date ? new Date(data.due_date + 'T00:00:00').toISOString() : null,
          related_item_id: watchedCustomerId || null,
          related_item_type: watchedCustomerId ? 'customer' : null,
          related_item_title: watchedCustomerId ? selectedCompanyName : null,
          assignee_id: data.assignee_id || null,
          opportunity_id: data.opportunity_id || null,
        })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;
      return updatedTask;
    },
    onSuccess: async () => {
      toast.success("Görev başarıyla güncellendi");
      await queryClient.invalidateQueries({ 
        queryKey: ["activities", userData?.company_id],
        exact: false,
        refetchType: 'active'
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Görev güncellenirken bir hata oluştu");
    }
  });

  const handleUpdateSubtasks = async (newSubtasks: SubTask[]) => {
    try {
      setSubtasks(newSubtasks);
      
      const existingSubtasks = subtasks || [];
      const existingIds = new Set(existingSubtasks.map(st => st.id));

      // Find subtasks to insert (exist in new but not in old)
      const toInsert = newSubtasks.filter(st => !existingIds.has(st.id));
      
      // Find subtasks to update (exist in both but may have changed)
      const toUpdate = newSubtasks.filter(st => {
        if (!existingIds.has(st.id)) return false;
        const existing = existingSubtasks.find(e => e.id === st.id);
        return existing && (existing.title !== st.title || existing.completed !== st.completed);
      });

      // Execute operations - NO DELETE, just insert and update
      if (toInsert.length > 0) {
        const subtasksToInsert = toInsert.map(st => ({
          id: st.id,
          task_id: task!.id,
          title: st.title,
          completed: st.completed,
          created_at: st.created_at
        }));

        const { error } = await supabase
          .from("subtasks")
          .insert(subtasksToInsert);
        
        if (error) throw error;
      }

      if (toUpdate.length > 0) {
        for (const st of toUpdate) {
          const { error } = await supabase
            .from("subtasks")
            .update({
              title: st.title,
              completed: st.completed
            })
            .eq("id", st.id);
          
          if (error) throw error;
        }
      }

      queryClient.invalidateQueries({ 
        queryKey: ["activities", userData?.company_id],
        exact: false 
      });
      toast.success("Alt görevler başarıyla güncellendi");
    } catch (error) {
      console.error("Error updating subtasks:", error);
      toast.error("Alt görevler güncellenirken bir hata oluştu");
    }
  };

  const handleSave = async (values: TaskFormData) => {
    await updateTaskMutation.mutateAsync(values);
  };

  // Prepare form data
  const formData: TaskFormData = task ? {
    title: task.title,
    description: task.description || "",
    type: task.type,
    status: task.status,
    priority: task.priority || "medium",
    is_important: task.is_important || false,
    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
    assignee_id: task.assignee_id || "",
    opportunity_id: task.opportunity_id || "",
    related_item_id: task.related_item_type === 'customer' ? task.related_item_id || "" : "",
    related_item_type: task.related_item_type || "",
    related_item_title: task.related_item_title || "",
  } : {} as TaskFormData;

  // Field configuration
  const fields: FieldConfig<TaskFormData>[] = [
    {
      name: 'title',
      label: 'Başlık',
      type: 'text',
      placeholder: 'Aktivite başlığını girin',
      required: true,
      gridColumn: 'col-span-full',
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      placeholder: 'Aktivite detaylarını girin',
      gridColumn: 'col-span-full',
    },
    {
      name: 'opportunity_id',
      label: 'Fırsat',
      type: 'custom',
      gridColumn: 'col-span-1',
      render: (field) => (
        <OpportunitySelector
          value={field.value || ''}
          onChange={field.onChange}
          label="Fırsat"
          placeholder="Fırsat seçin..."
          searchPlaceholder="Fırsat ara..."
          noResultsText="Fırsat bulunamadı"
          showLabel={false}
        />
      ),
    },
    {
      name: 'assignee_id',
      label: 'Görevli',
      type: 'custom',
      gridColumn: 'col-span-1',
      render: (field) => (
        <EmployeeSelector
          value={field.value || ''}
          onChange={field.onChange}
          label="Görevli"
          placeholder="Görevli seçin..."
          searchPlaceholder="Çalışan ara..."
          noResultsText="Çalışan bulunamadı"
          showLabel={false}
        />
      ),
    },
    {
      name: 'related_item_id',
      label: 'Müşteri',
      type: 'custom',
      gridColumn: 'col-span-1',
      render: () => (
        <FormProvider {...partnerForm}>
          <ProposalPartnerSelect 
            partnerType="customer" 
            placeholder="Müşteri seçin..."
            hideLabel={true}
          />
        </FormProvider>
      ),
    },
    {
      name: 'due_date',
      label: 'Son Tarih',
      type: 'date',
      gridColumn: 'col-span-1',
    },
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      options: statusOptions,
      gridColumn: 'col-span-1',
    },
    {
      name: 'type',
      label: 'Aktivite Tipi',
      type: 'select',
      options: [
        { value: 'general', label: 'Genel' },
        { value: 'opportunity', label: 'Fırsat' },
        { value: 'proposal', label: 'Teklif' },
        { value: 'service', label: 'Servis' },
        { value: 'call', label: 'Arama' },
        { value: 'meeting', label: 'Toplantı' },
        { value: 'follow_up', label: 'Takip' },
        { value: 'reminder', label: 'Hatırlatıcı' },
        { value: 'email', label: 'E-posta' },
      ],
      gridColumn: 'col-span-1',
    },
    {
      name: 'is_important',
      label: 'Önem',
      type: 'custom',
      gridColumn: 'col-span-1',
      render: (field) => (
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors cursor-pointer h-7",
          field.value 
            ? "bg-yellow-50 border-yellow-200" 
            : "bg-white border-gray-200 hover:border-yellow-300"
        )}>
          <Label htmlFor="is_important" className="flex items-center gap-1 cursor-pointer text-[10px] font-medium flex-1">
            <Star className={cn(
              "h-3 w-3 transition-all duration-200",
              field.value ? "text-yellow-500 fill-yellow-500 scale-110" : "text-gray-400"
            )} />
            <span className={field.value ? "text-yellow-700" : "text-gray-600"}>Önemli</span>
          </Label>
          <Switch
            id="is_important"
            checked={field.value || false}
            onCheckedChange={field.onChange}
            className="scale-75"
          />
        </div>
      ),
    },
  ];

  // Get status badge color
  const getStatusBadge = (status: TaskStatus) => {
    const badges = {
      todo: { label: "Yapılacak", className: "bg-red-100 text-red-700 border-red-200" },
      in_progress: { label: "Devam Ediyor", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      completed: { label: "Tamamlandı", className: "bg-green-100 text-green-700 border-green-200" },
      postponed: { label: "Ertelendi", className: "bg-gray-100 text-gray-700 border-gray-200" },
    };
    return badges[status] || badges.todo;
  };

  // Task type labels
  const taskTypeLabels: Record<string, string> = {
    general: "Genel",
    opportunity: "Fırsat",
    proposal: "Teklif",
    service: "Servis",
    call: "Arama",
    meeting: "Toplantı",
    follow_up: "Takip",
    reminder: "Hatırlatıcı",
    email: "E-posta",
  };

  // Render header with status badge
  const renderHeader = () => {
    if (!task) return null;
    
    const statusBadge = getStatusBadge(task.status);
    const typeLabel = taskTypeLabels[task.type] || task.type;

    return (
      <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{task.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {typeLabel} • {task.created_at && format(new Date(task.created_at), 'dd MMM yyyy', { locale: tr })}
          </p>
        </div>
        <Badge className={cn("text-xs px-2 py-0.5 border flex-shrink-0", statusBadge.className)}>
          {statusBadge.label}
        </Badge>
      </div>
    );
  };

  // Render actions (subtasks + history accordion)
  const renderActions = () => {
    if (!task) return null;

    const historyCount = task.updated_at && task.updated_at !== task.created_at ? 2 : 1;

    return (
      <div className="space-y-2">
        {/* Alt Görevler */}
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <SubtaskManager 
            task={{...task, subtasks}} 
            onUpdate={handleUpdateSubtasks} 
            isUpdating={updateTaskMutation.isPending}
          />
        </div>

        {/* Görev Geçmişi Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-none">
            <AccordionTrigger className="py-2 px-0 hover:no-underline">
              <span className="text-xs font-medium text-gray-700">
                Görev Geçmişi ({historyCount})
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1.5">
                {/* Created */}
                <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md">
                  <div className="p-1 rounded-full bg-green-100 flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">Görev Oluşturuldu</span>
                      <span className="text-xs text-gray-500">
                        {task.created_at && format(new Date(task.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                      {task.title} başlıklı görev oluşturuldu
                    </p>
                  </div>
                </div>
                
                {/* Updated */}
                {task.updated_at && task.updated_at !== task.created_at && (
                  <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md">
                    <div className="p-1 rounded-full bg-blue-100 flex-shrink-0">
                      <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">Son Güncelleme</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Mevcut durum: {statusOptions.find(s => s.value === task.status)?.label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  return (
    <EditableDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title=""
      data={formData}
      fields={fields}
      schema={taskSchema}
      onSave={handleSave}
      isSaving={updateTaskMutation.isPending}
      renderHeader={renderHeader}
      renderActions={renderActions}
      saveButtonText="Değişiklikleri Kaydet"
      cancelButtonText="İptal"
      size="md"
    />
  );
};

export default TaskDetails;
