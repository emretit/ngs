import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
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
      console.error('Fırsatlar yüklenirken hata:', error);
      toast.error('Fırsatlar yüklenemedi');
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
      console.error('Çalışanlar yüklenirken hata:', error);
      toast.error('Çalışanlar yüklenemedi');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  console.log("NewActivityDialog render:", { isOpen, title, description, status, priority, dueDate });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Başlık gereklidir');
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
          priority,
          type: 'general',
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assignee_id: selectedAssigneeId || null,
          // Fırsat seçildiyse related_item kolonlarını doldur
          related_item_id: selectedOpportunity ? selectedOpportunity.id : null,
          related_item_type: selectedOpportunity ? 'opportunity' : null,
          related_item_title: selectedOpportunity ? selectedOpportunity.title : null,
          opportunity_id: selectedOpportunityId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Aktivite başarıyla oluşturuldu');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Aktivite oluşturulurken hata:', error);
      toast.error('Aktivite oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setSelectedOpportunityId("");
    setSelectedAssigneeId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Yeni Aktivite Oluştur</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Başlık */}
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Aktivite başlığını girin"
              required
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aktivite detaylarını girin"
              rows={3}
            />
          </div>

          {/* İlişkili Fırsat */}
          <div className="space-y-2">
            <Label htmlFor="opportunity">İlişkili Fırsat</Label>
            <Popover open={isOpportunityPopoverOpen} onOpenChange={setIsOpportunityPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpportunityPopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedOpportunityId
                    ? opportunities.find((opportunity) => opportunity.id === selectedOpportunityId)?.title
                    : "Fırsat seçin (opsiyonel)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
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

          {/* Son Tarih */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Son Tarih</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="Tarih seçin"
            />
          </div>

          {/* Görevlendirilen Kişi */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Görevlendirilen Kişi</Label>
            <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isAssigneePopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedAssigneeId
                    ? employees.find((employee) => employee.id === selectedAssigneeId)?.first_name + " " + employees.find((employee) => employee.id === selectedAssigneeId)?.last_name
                    : "Görevlendirilen kişi seçin (opsiyonel)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
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
                          {employee.first_name} {employee.last_name} ({employee.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Durum ve Öncelik */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="todo">Yapılacak</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
          </div>

          {/* İlişkili Öğe Bilgileri */}
          {(relatedItemId || relatedItemTitle) && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium mb-2">İlişkili Öğe</h4>
              {relatedItemTitle && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Başlık:</strong> {relatedItemTitle}
                </p>
              )}
              {relatedItemType && (
                <p className="text-sm text-gray-600">
                  <strong>Tip:</strong> {relatedItemType}
                </p>
              )}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewActivityDialog;
