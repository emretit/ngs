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
import CustomerSelector from "@/components/proposals/form/CustomerSelector";

interface NewActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relatedItemId?: string;
  relatedItemTitle?: string;
  relatedItemType?: string;
  opportunityId?: string;
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
  opportunityId
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

      const { data, error } = await supabase
        .from('activities')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority: isImportant ? 'high' : 'medium',
          type: 'general',
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assignee_id: selectedAssigneeId || null,
          company_id: user?.company_id || null,
          // Fırsat seçildiyse related_item kolonlarını doldur
          related_item_id: selectedOpportunity ? selectedOpportunity.id : null,
          related_item_type: selectedOpportunity ? 'opportunity' : null,
          related_item_title: selectedOpportunity ? selectedOpportunity.title : null,
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCustomerChange = (customerId: string, customerName: string, companyName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setSelectedCompanyName(companyName);
  };

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
              />
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
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Label className="text-xs font-medium text-gray-700">Durum</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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

          {/* Tekrar Eden Görev */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  className="scale-90"
                />
                <Label htmlFor="is_recurring" className="cursor-pointer text-sm font-medium">
                  Tekrar eden görev
                </Label>
              </div>
            </div>

            {isRecurring && (
              <div className="p-2 bg-blue-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Tekrar Türü</Label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white h-8"
                    >
                      <option value="none">Tekrarlanmaz</option>
                      <option value="daily">Günlük</option>
                      <option value="weekly">Haftalık</option>
                      <option value="monthly">Aylık</option>
                      <option value="custom">Özel Aralık</option>
                    </select>
                  </div>

                  {recurrenceType === 'custom' && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Her kaç günde</Label>
                      <input
                        type="number"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md h-8"
                      />
                    </div>
                  )}

                  {recurrenceType === 'monthly' && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Ayın günü</Label>
                      <input
                        type="number"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)}
                        min="1"
                        max="31"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md h-8"
                      />
                    </div>
                  )}
                </div>

                {recurrenceType === 'weekly' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Haftanın günleri</Label>
                    <div className="grid grid-cols-7 gap-1">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <label key={day} className="flex flex-col items-center space-y-1 p-1">
                          <input
                            type="checkbox"
                            checked={recurrenceDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRecurrenceDays([...recurrenceDays, day]);
                              } else {
                                setRecurrenceDays(recurrenceDays.filter(d => d !== day));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-xs">
                            {day === 'monday' ? 'Pzt' :
                             day === 'tuesday' ? 'Sal' :
                             day === 'wednesday' ? 'Çar' :
                             day === 'thursday' ? 'Per' :
                             day === 'friday' ? 'Cum' :
                             day === 'saturday' ? 'Cmt' : 'Paz'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">Bitiş Tarihi (opsiyonel)</Label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md h-8"
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
            onClick={() => {}}
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
