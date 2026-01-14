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
  const [taskType, setTaskType] = useState("general");
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
  const [isCustomerFromOpportunity, setIsCustomerFromOpportunity] = useState(false);

  // Form context for ProposalPartnerSelect
  const partnerForm = useForm({
    defaultValues: {
      customer_id: selectedCustomerId || "",
      supplier_id: ""
    }
  });

  // Fırsattan müşteri bilgisini çeken yardımcı fonksiyon
  const fetchCustomerFromOpportunity = async (oppId: string) => {
    const { data: opportunityData } = await supabase
      .from('opportunities')
      .select('customer_id, customer:customer_id(id, name, company)')
      .eq('id', oppId)
      .single();
    
    if (opportunityData?.customer_id && opportunityData.customer) {
      const customer = opportunityData.customer as { id: string; name: string; company?: string };
      setSelectedCustomerId(customer.id);
      setSelectedCustomerName(customer.name || "");
      setSelectedCompanyName(customer.company || customer.name || "");
      partnerForm.setValue("customer_id", customer.id);
      setIsCustomerFromOpportunity(true);
    }
  };

  // Başlangıçta opportunityId prop'u varsa müşteri bilgisini otomatik doldur
  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchCustomerFromOpportunity(opportunityId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, opportunityId]);

  // Fırsat seçildiğinde müşteri bilgisini otomatik doldur
  const handleOpportunityChange = async (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    
    if (opportunityId) {
      await fetchCustomerFromOpportunity(opportunityId);
    } else {
      // Fırsat temizlendiğinde müşteri kilidini aç ve müşteri bilgisini temizle
      setIsCustomerFromOpportunity(false);
      // Eğer müşteri sadece fırsattan geliyorsa, müşteri bilgisini de temizle
      setSelectedCustomerId("");
      setSelectedCustomerName("");
      setSelectedCompanyName("");
      partnerForm.setValue("customer_id", "");
    }
  };




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
          type: taskType,
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
    setTaskType("general");
    setIsImportant(false);
    setDueDate("");
    setSelectedOpportunityId("");
    setSelectedAssigneeId("");
    setSelectedCustomerId("");
    setSelectedCustomerName("");
    setSelectedCompanyName("");
    setIsCustomerFromOpportunity(false);
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
    console.log('[NewActivityDialog] handleClose called');
    resetForm();
    onClose();
  };

  // Watch form changes for customer_id and fetch customer details
  // Ancak fırsattan gelen müşteri seçimini override etme
  const watchedCustomerId = partnerForm.watch("customer_id");
  useEffect(() => {
    // Eğer müşteri fırsattan geliyorsa, form değişikliklerini ignore et
    if (isCustomerFromOpportunity) {
      return;
    }
    
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
    } else if (!watchedCustomerId && selectedCustomerId && !isCustomerFromOpportunity) {
      setSelectedCustomerId("");
      setSelectedCustomerName("");
      setSelectedCompanyName("");
    }
  }, [watchedCustomerId, isCustomerFromOpportunity]);

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni Aktivite"
      maxWidth="md"
      headerColor="blue"
      zIndex={60}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-1.5">
          {/* Başlık ve Açıklama */}
          <div className="space-y-1">
            <div className="space-y-0.5">
              <Label htmlFor="title" className="text-xs font-medium text-gray-700">Başlık *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Aktivite başlığını girin"
                className="h-10 text-xs"
                required
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="description" className="text-xs font-medium text-gray-700">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aktivite detaylarını girin"
                rows={2}
                className="resize-none min-h-[2.5rem] text-xs"
              />
            </div>
          </div>

          {/* Fırsat ve Görevli */}
          <div className="grid grid-cols-2 gap-1.5">
            <OpportunitySelector
              value={selectedOpportunityId}
              onChange={handleOpportunityChange}
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
          <div className="grid grid-cols-2 gap-1.5">
            <FormProvider {...partnerForm}>
              <ProposalPartnerSelect
                partnerType="customer"
                placeholder={isCustomerFromOpportunity ? selectedCompanyName || selectedCustomerName : "Müşteri seçin..."}
                hideLabel={false}
                disabled={isCustomerFromOpportunity}
              />
            </FormProvider>

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

          {/* Aktivite Tipi ve Durum */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-gray-700">Aktivite Tipi</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="h-10 bg-white border-gray-200 hover:border-primary/50 transition-colors w-full text-xs">
                  <SelectValue placeholder="Tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Genel</SelectItem>
                  <SelectItem value="opportunity">Fırsat</SelectItem>
                  <SelectItem value="proposal">Teklif</SelectItem>
                  <SelectItem value="service">Servis</SelectItem>
                  <SelectItem value="call">Arama</SelectItem>
                  <SelectItem value="meeting">Toplantı</SelectItem>
                  <SelectItem value="follow_up">Takip</SelectItem>
                  <SelectItem value="reminder">Hatırlatıcı</SelectItem>
                  <SelectItem value="email">E-posta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-gray-700">Durum</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 bg-white border-gray-200 hover:border-primary/50 transition-colors w-full text-xs">
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
          </div>

          {/* Önem */}
          <div className="space-y-0.5">
            <Label className="text-xs font-medium text-gray-700">Önem</Label>
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors cursor-pointer h-10",
              isImportant
                ? "bg-yellow-50 border-yellow-200"
                : "bg-white border-gray-200 hover:border-yellow-300"
            )}>
              <Label htmlFor="is_important" className="flex items-center gap-1.5 cursor-pointer text-xs font-medium flex-1">
                <Star className={cn(
                  "h-3.5 w-3.5 transition-all duration-200",
                  isImportant ? "text-yellow-500 fill-yellow-500 scale-110" : "text-gray-400"
                )} />
                <span className={isImportant ? "text-yellow-700" : "text-gray-600"}>Önemli</span>
              </Label>
              <Switch
                id="is_important"
                checked={isImportant}
                onCheckedChange={setIsImportant}
                className="scale-75"
              />
            </div>
          </div>

          {/* Tekrar Eden Görev */}
          <div className="space-y-1.5">
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border transition-all duration-200",
                isRecurring
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                  : "bg-gray-50 border-gray-100"
              )}
            >
              <div className="flex items-center gap-2">
                <Switch
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  className="scale-75"
                />
                <Label htmlFor="is_recurring" className="cursor-pointer text-xs font-medium text-gray-700">
                  Tekrar eden görev
                </Label>
              </div>
              {isRecurring && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </div>

            {isRecurring && (
              <div className="p-2.5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-lg border border-blue-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-gray-600">Tekrar Türü</Label>
                    <Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as any)}>
                      <SelectTrigger className="h-9 bg-white border-gray-200 text-xs">
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
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Her kaç günde</Label>
                      <Input
                        type="number"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        min={1}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                  )}

                  {recurrenceType === 'monthly' && (
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Ayın günü</Label>
                      <Input
                        type="number"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)}
                        min={1}
                        max={31}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {recurrenceType === 'weekly' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Haftanın günleri</Label>
                    <div className="flex gap-1">
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
                            "flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200",
                            recurrenceDays.includes(key)
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                              : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-0.5">
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
            <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <h4 className="text-xs font-medium text-blue-900">İlişkili Öğe</h4>
              </div>
              {relatedItemTitle && (
                <p className="text-xs text-blue-700 mt-0.5">
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
