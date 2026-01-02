import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { handleError, handleSuccess } from "@/utils/errorHandler";
import { logger } from "@/utils/logger";
import { generateRecurringTasks, createNextTaskInstance } from "@/utils/recurringTaskScheduler";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OpportunitySelector from "@/components/opportunities/OpportunitySelector";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useForm, FormProvider } from "react-hook-form";

interface NewActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relatedItemId?: string;
  relatedItemTitle?: string;
  relatedItemType?: string;
  opportunityId?: string;
  disabledOpportunity?: boolean;
}


interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const NewActivityDialog: React.FC<NewActivityDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  relatedItemId,
  relatedItemTitle,
  relatedItemType,
  opportunityId,
  disabledOpportunity = false
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [isImportant, setIsImportant] = useState(false);
  const [dueDate, setDueDate] = useState("");
  // Recurring task states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'custom'>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(opportunityId || "");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form context for ProposalPartnerSelect
  const partnerForm = useForm({
    defaultValues: {
      customer_id: selectedCustomerId || "",
      supplier_id: ""
    }
  });




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      handleError(new Error("Başlık gereklidir"), {
        operation: "validateActivityForm"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Seçilen fırsat bilgilerini al
      let selectedOpportunity = null;
      if (selectedOpportunityId) {
        const { data: opportunityData } = await supabase
          .from('opportunities')
          .select('id, title, status')
          .eq('id', selectedOpportunityId)
          .single();
        selectedOpportunity = opportunityData;
      }

      // İlişkili öğe bilgilerini belirle
      let finalRelatedItemId = relatedItemId || null;
      let finalRelatedItemType = relatedItemType || null;
      let finalRelatedItemTitle = relatedItemTitle || null;
      
      // Eğer props'ta related item yoksa ve fırsat seçildiyse, fırsat bilgilerini kullan
      if (!finalRelatedItemId && selectedOpportunity) {
        finalRelatedItemId = selectedOpportunity.id;
        finalRelatedItemType = 'opportunity';
        finalRelatedItemTitle = selectedOpportunity.title;
      } else if (!finalRelatedItemId && selectedCustomerId) {
        // Müşteri seçildiyse müşteri bilgilerini kullan
        finalRelatedItemId = selectedCustomerId;
        finalRelatedItemType = 'customer';
        finalRelatedItemTitle = selectedCustomerName || selectedCompanyName || null;
      }

      const { data, error } = await supabase
        .from('activities')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority: isImportant ? 'high' : 'medium',
          is_important: isImportant,
          type: 'general',
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assignee_id: selectedAssigneeId || null,
          company_id: user?.company_id || null,
          // İlişkili öğe bilgileri
          related_item_id: finalRelatedItemId,
          related_item_type: finalRelatedItemType,
          related_item_title: finalRelatedItemTitle,
          opportunity_id: selectedOpportunityId || null
        })
        .select()
        .single();

      if (error) throw error;

      // If this is a recurring task, generate future instances
      if (isRecurring && recurrenceType !== 'none' && dueDate) {
        try {
          const instances = generateRecurringTasks(
            new Date(dueDate),
            {
              recurrence_type: recurrenceType,
              recurrence_interval: recurrenceInterval,
              recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
              recurrence_days: recurrenceDays,
              recurrence_day_of_month: recurrenceDayOfMonth,
            },
            20 // Generate up to 20 future instances
          );

          // Skip the first instance (it's the parent task we just created)
          const futureInstances = instances.slice(1);

          if (futureInstances.length > 0) {
            const tasksToInsert = futureInstances.map(instance =>
              createNextTaskInstance(data, instance.due_date, instance.title_suffix)
            );

            const { error: batchError } = await supabase
              .from("activities")
              .insert(tasksToInsert);

            if (batchError) {
              logger.error("Error creating recurring task instances", batchError);
            }
          }
        } catch (error) {
          logger.error("Error generating recurring tasks", error);
        }
      }

      handleSuccess("Aktivite başarıyla oluşturuldu", "createActivity");
      resetForm();
      onSuccess();
    } catch (error) {
      handleError(error, {
        operation: "createActivity",
        metadata: { title }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setIsImportant(false);
    setDueDate("");
    setSelectedOpportunityId("");
    setSelectedAssigneeId("");
    setSelectedCustomerId("");
    setSelectedCustomerName("");
    setSelectedCompanyName("");
    // Reset recurring fields
    setIsRecurring(false);
    setRecurrenceType('none');
    setRecurrenceInterval(1);
    setRecurrenceEndDate("");
    setRecurrenceDays([]);
    setRecurrenceDayOfMonth(1);
    // Reset form
    partnerForm.reset({
      customer_id: "",
      supplier_id: ""
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Watch form changes for customer_id and fetch customer details
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

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni Aktivite"
      maxWidth="lg"
      headerColor="blue"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
          {/* Başlık ve Açıklama */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">Başlık *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Aktivite başlığını girin"
                className="h-10"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aktivite detaylarını girin"
                rows={3}
                className="resize-none min-h-[80px]"
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
              disabled={disabledOpportunity}
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
          <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Durum</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 bg-white border-gray-200 hover:border-primary/50 transition-colors w-full">
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
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>İptal Edildi</span>
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
                  <Label htmlFor="is_important" className="flex items-center gap-1.5 cursor-pointer text-sm font-medium flex-1">
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

          {/* Tekrar Eden Görev */}
          <div className="space-y-3">
            <div 
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                isRecurring 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" 
                  : "bg-gray-50 border-gray-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Switch
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="is_recurring" className="cursor-pointer text-sm font-medium text-gray-700">
                  Tekrar eden görev
                </Label>
              </div>
              {isRecurring && (
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </div>

            {isRecurring && (
              <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Tekrar Türü</Label>
                    <Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as any)}>
                      <SelectTrigger className="h-9 bg-white border-gray-200">
                        <SelectValue placeholder="Tekrar türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tekrarlanmaz</SelectItem>
                        <SelectItem value="daily">Günlük</SelectItem>
                        <SelectItem value="weekly">Haftalık</SelectItem>
                        <SelectItem value="monthly">Aylık</SelectItem>
                        <SelectItem value="custom">Özel Aralık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recurrenceType === 'custom' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Her kaç günde</Label>
                      <Input
                        type="number"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        min={1}
                        className="h-9 bg-white"
                      />
                    </div>
                  )}

                  {recurrenceType === 'monthly' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Ayın günü</Label>
                      <Input
                        type="number"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)}
                        min={1}
                        max={31}
                        className="h-9 bg-white"
                      />
                    </div>
                  )}
                </div>

                {recurrenceType === 'weekly' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Haftanın günleri</Label>
                    <div className="flex gap-1.5">
                      {[
                        { key: 'monday', label: 'Pzt' },
                        { key: 'tuesday', label: 'Sal' },
                        { key: 'wednesday', label: 'Çar' },
                        { key: 'thursday', label: 'Per' },
                        { key: 'friday', label: 'Cum' },
                        { key: 'saturday', label: 'Cmt' },
                        { key: 'sunday', label: 'Paz' }
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (recurrenceDays.includes(key)) {
                              setRecurrenceDays(recurrenceDays.filter(d => d !== key));
                            } else {
                              setRecurrenceDays([...recurrenceDays, key]);
                            }
                          }}
                          className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                            recurrenceDays.includes(key)
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <UnifiedDatePicker
                    label="Bitiş Tarihi (opsiyonel)"
                    date={recurrenceEndDate ? new Date(recurrenceEndDate + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setRecurrenceEndDate(`${year}-${month}-${day}`);
                      } else {
                        setRecurrenceEndDate("");
                      }
                    }}
                    placeholder="Bitiş tarihi seçin"
                  />
                </div>
              </div>
            )}
          </div>

          {/* İlişkili Öğe Bilgileri */}
          {(relatedItemId || relatedItemTitle) && (
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="text-sm font-medium text-blue-900">İlişkili Öğe</h4>
              </div>
              {relatedItemTitle && (
                <p className="text-sm text-blue-700 mt-1">
                  {relatedItemTitle}
                </p>
              )}
            </div>
          )}
          </div>
        </div>
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={handleClose} disabled={isLoading} />
          <UnifiedDialogActionButton
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Oluştur
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default NewActivityDialog;
