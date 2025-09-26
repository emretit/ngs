import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/utils/errorHandler";
import { logger } from "@/utils/logger";
import { generateRecurringTasks, createNextTaskInstance } from "@/utils/recurringTaskScheduler";

interface NewActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relatedItemId?: string;
  relatedItemTitle?: string;
  relatedItemType?: string;
  opportunityId?: string;
}

interface Opportunity {
  id: string;
  title: string;
  status: string;
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
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isOpportunityPopoverOpen, setIsOpportunityPopoverOpen] = useState(false);
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);

  // Fırsatları yükle
  useEffect(() => {
    if (isOpen) {
      loadOpportunities();
      loadEmployees();
    }
  }, [isOpen]);

  const loadOpportunities = async () => {
    setIsLoadingOpportunities(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      handleError(error, {
        operation: "fetchOpportunities"
      });
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      handleError(error, {
        operation: "fetchEmployees"
      });
    } finally {
      setIsLoadingEmployees(false);
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
      const selectedOpportunity = selectedOpportunityId
        ? opportunities.find(opp => opp.id === selectedOpportunityId)
        : null;

      const { data, error } = await supabase
        .from('activities')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          status,
          is_important: isImportant,
          type: 'general',
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assignee_id: selectedAssigneeId || null,
          // Recurring task fields
          is_recurring: isRecurring,
          recurrence_type: recurrenceType,
          recurrence_interval: recurrenceInterval,
          recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
          recurrence_days: recurrenceDays.length > 0 ? recurrenceDays : null,
          recurrence_day_of_month: recurrenceDayOfMonth,
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
      onClose();
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">Yeni Aktivite</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Başlık ve Açıklama */}
          <div className="space-y-3">
            <div className="space-y-1">
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
            
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aktivite detaylarını girin"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Hızlı Seçimler */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">Fırsat</Label>
              <Popover open={isOpportunityPopoverOpen} onOpenChange={setIsOpportunityPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpportunityPopoverOpen}
                    className="w-full justify-between h-9 text-sm"
                  >
                    {selectedOpportunityId
                      ? opportunities.find((opportunity) => opportunity.id === selectedOpportunityId)?.title?.slice(0, 20) + "..."
                      : "Seç"}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <Command>
                    <CommandInput placeholder="Fırsat ara..." />
                    <CommandList>
                      <CommandEmpty>Fırsat bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setSelectedOpportunityId("");
                            setIsOpportunityPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedOpportunityId === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Fırsat seçilmedi
                        </CommandItem>
                        {opportunities.map((opportunity) => (
                          <CommandItem
                            key={opportunity.id}
                            value={opportunity.title}
                            onSelect={() => {
                              setSelectedOpportunityId(opportunity.id);
                              setIsOpportunityPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedOpportunityId === opportunity.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {opportunity.title} - ({opportunity.status})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">Görevli</Label>
              <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isAssigneePopoverOpen}
                    className="w-full justify-between h-9 text-sm"
                  >
                    {selectedAssigneeId
                      ? employees.find((employee) => employee.id === selectedAssigneeId)?.first_name?.slice(0, 10) + "..."
                      : "Seç"}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <Command>
                    <CommandInput placeholder="Çalışan ara..." />
                    <CommandList>
                      <CommandEmpty>Çalışan bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setSelectedAssigneeId("");
                            setIsAssigneePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAssigneeId === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Görevlendirilmedi
                        </CommandItem>
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.first_name + " " + employee.last_name}
                            onSelect={() => {
                              setSelectedAssigneeId(employee.id);
                              setIsAssigneePopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAssigneeId === employee.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {employee.first_name} {employee.last_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tarih */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Son Tarih</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Durum ve Önem */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Label className="text-sm font-medium text-gray-700">Durum</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
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
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
              <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Tekrar Türü</Label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as any)}
                      className="w-full p-2 text-sm border border-gray-200 rounded-md bg-white"
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
                        className="w-full p-2 text-sm border border-gray-200 rounded-md"
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
                        className="w-full p-2 text-sm border border-gray-200 rounded-md"
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
                    className="w-full p-2 text-sm border border-gray-200 rounded-md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* İlişkili Öğe Bilgileri */}
          {(relatedItemId || relatedItemTitle) && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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

          {/* Butonlar */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm"
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Oluşturuluyor...</span>
                </div>
              ) : (
                "Oluştur"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewActivityDialog;
