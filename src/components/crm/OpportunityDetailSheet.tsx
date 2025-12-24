import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, Phone, Mail, MessageSquare, Calendar, User, Edit2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Opportunity, OpportunityStatus, opportunityStatusLabels, ContactHistoryItem } from "@/types/crm";
import { crmService } from "@/services/crmService";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import NewActivityDialog from "@/components/activities/NewActivityDialog";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";

interface OpportunityDetailSheetProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OpportunityDetailSheet = ({ 
  opportunity, 
  isOpen, 
  onClose 
}: OpportunityDetailSheetProps) => {
  const [currentStatus, setCurrentStatus] = useState<OpportunityStatus | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Opportunity>>({});
  const [contactHistory, setContactHistory] = useState<ContactHistoryItem[]>([]);
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Form for ProposalPartnerSelect
  const partnerForm = useForm({
    defaultValues: {
      customer_id: opportunity?.customer_id || "",
      supplier_id: null
    }
  });

  // Set the current status when the opportunity changes
  useEffect(() => {
    if (opportunity && opportunity.status !== currentStatus) {
      setCurrentStatus(opportunity.status as OpportunityStatus);
      setEditingValues(opportunity);

      // Update partner form with customer_id
      if (opportunity.customer_id) {
        partnerForm.setValue("customer_id", opportunity.customer_id);
      }

      // Load contact history
      if (opportunity.contact_history) {
        setContactHistory(Array.isArray(opportunity.contact_history) ? opportunity.contact_history : []);
      }
    }
  }, [opportunity, currentStatus, partnerForm]);

  const updateOpportunityMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      data = {}
    }: {
      id: string;
      status?: OpportunityStatus;
      data?: Partial<Opportunity>;
    }) => {
      const updateData = { ...data };

      if (status) {
        updateData.status = status;
      }

      const { error } = await crmService.updateOpportunity(id, updateData);

      if (error) throw error;

      return { id, status, previousStatus: opportunity?.status };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      if (data.status) {
        toast.success('Durum güncellendi', {
          description: `Fırsat durumu başarıyla güncellendi.`,
          className: "bg-green-50 border-green-200",
        });
      } else {
        toast.success('Fırsat güncellendi', {
          description: `Fırsat başarıyla güncellendi.`,
          className: "bg-green-50 border-green-200",
        });
      }
    },
    onError: (error) => {
      toast.error('Hata', {
        description: 'Fırsat güncellenirken bir hata oluştu',
        className: "bg-gray-50 border-gray-200",
      });
      console.error('Error updating opportunity:', error);
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus as OpportunityStatus);
    // Update in editingValues so it will be saved with other changes
    setEditingValues(prev => ({ ...prev, status: newStatus as OpportunityStatus }));
  };

  const handleInputChange = (field: keyof Opportunity, value: any) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
  };

  const handleEmployeeChange = (value: string) => {
    setEditingValues(prev => ({ ...prev, employee_id: value }));
  };

  const handleSaveChanges = async () => {
    if (!opportunity) return;

    await updateOpportunityMutation.mutateAsync({
      id: opportunity.id,
      status: currentStatus !== opportunity.status ? currentStatus : undefined,
      data: editingValues
    });
  };


  const handleActivitySuccess = () => {
    setIsNewActivityDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  if (!opportunity) return null;

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
        <SheetHeader className="text-left border-b pb-3 mb-0 px-3 pt-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <SheetTitle className="text-lg font-semibold text-gray-900">Fırsat Detayları</SheetTitle>
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
                      value={editingValues.title || ""}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Fırsat başlığını girin"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs font-medium text-gray-700">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={editingValues.description || ""}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Fırsat detaylarını girin"
                      rows={2}
                      className="resize-none text-xs"
                    />
                  </div>
                </div>

                {/* Müşteri ve Sorumlu */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <FormProvider {...partnerForm}>
                      <ProposalPartnerSelect
                        partnerType="customer"
                        placeholder="Müşteri seçin..."
                        label="Müşteri"
                        hideLabel={false}
                        disabled={true}
                      />
                    </FormProvider>
                  </div>
                  <div className="space-y-1.5">
                    <EmployeeSelector
                      value={editingValues.employee_id || opportunity.employee_id || ""}
                      onChange={handleEmployeeChange}
                      label="Sorumlu Kişi"
                      placeholder="Sorumlu kişi seçin..."
                      searchPlaceholder="Çalışan ara..."
                      noResultsText="Çalışan bulunamadı"
                      showLabel={true}
                    />
                  </div>
                </div>

                {/* Durum ve Öncelik */}
                <div className="p-1.5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Durum</Label>
                      <Select
                        value={currentStatus || opportunity.status}
                        onValueChange={handleStatusChange}
                        disabled={updateOpportunityMutation.isPending}
                      >
                        <SelectTrigger className="h-9 bg-white border-gray-200 hover:border-primary/50 transition-colors w-full text-xs">
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(opportunityStatusLabels).map(([status, label]) => (
                            <SelectItem key={status} value={status}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Öncelik</Label>
                      <Select
                        value={editingValues.priority || opportunity.priority}
                        onValueChange={(val) => handleInputChange("priority", val)}
                      >
                        <SelectTrigger className="h-9 bg-white border-gray-200 hover:border-primary/50 transition-colors w-full text-xs">
                          <SelectValue placeholder="Öncelik seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Düşük</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Değer ve Para Birimi */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Tahmini Değer</Label>
                    <Input
                      type="number"
                      value={editingValues.value ?? opportunity.value}
                      onChange={(e) => handleInputChange("value", parseFloat(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Para Birimi</Label>
                    <Select
                      value={editingValues.currency || opportunity.currency || "TRY"}
                      onValueChange={(val) => handleInputChange("currency", val)}
                    >
                      <SelectTrigger className="h-8 border-gray-200 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Kapanış Tarihi */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Beklenen Kapanış Tarihi</Label>
                  <Input
                    type="date"
                    value={editingValues.expected_close_date?.split('T')[0] || ""}
                    onChange={(e) => handleInputChange("expected_close_date", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Aktiviteler */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-gray-700">Aktiviteler</Label>
                    <Button
                      onClick={() => setIsNewActivityDialogOpen(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Yeni
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {contactHistory.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">Henüz aktivite yok</p>
                    ) : (
                      contactHistory.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-2 p-1 bg-gray-50 rounded-lg">
                          <div className="p-1 rounded-full bg-blue-100">
                            {activity.contact_type === 'call' && <Phone className="h-3 w-3 text-blue-600" />}
                            {activity.contact_type === 'email' && <Mail className="h-3 w-3 text-blue-600" />}
                            {activity.contact_type === 'meeting' && <Calendar className="h-3 w-3 text-blue-600" />}
                            {activity.contact_type === 'other' && <MessageSquare className="h-3 w-3 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-900">
                                {activity.contact_type === 'call' && 'Telefon'}
                                {activity.contact_type === 'email' && 'E-posta'}
                                {activity.contact_type === 'meeting' && 'Toplantı'}
                                {activity.contact_type === 'other' && 'Diğer'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(activity.date), 'dd MMM yyyy', { locale: tr })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{activity.notes}</p>
                            {activity.employee_name && (
                              <p className="text-xs text-gray-500 mt-0.5">{activity.employee_name}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Fırsat Geçmişi */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Fırsat Geçmişi</Label>
                  <div className="space-y-1.5">
                    <div className="flex items-start space-x-2 p-1 bg-gray-50 rounded-lg">
                      <div className="p-1 rounded-full bg-green-100">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900">Fırsat Oluşturuldu</span>
                          <span className="text-xs text-gray-500">
                            {opportunity.created_at && format(new Date(opportunity.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {opportunity.title} başlıklı fırsat oluşturuldu
                        </p>
                        {opportunity.employee?.first_name && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Oluşturan: {opportunity.employee.first_name} {opportunity.employee.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {opportunity.updated_at && opportunity.updated_at !== opportunity.created_at && (
                      <div className="flex items-start space-x-2 p-1 bg-gray-50 rounded-lg">
                        <div className="p-1 rounded-full bg-blue-100">
                          <Edit2 className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900">Son Güncelleme</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(opportunity.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Mevcut durum: {opportunityStatusLabels[opportunity.status]}
                          </p>
                        </div>
                      </div>
                    )}

                    {opportunity.customer && (
                      <div className="flex items-start space-x-2 p-1 bg-gray-50 rounded-lg">
                        <div className="p-1 rounded-full bg-gray-100">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900">Müşteri Bilgileri</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {opportunity.customer.name}
                          </p>
                          {opportunity.customer.email && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              E-posta: {opportunity.customer.email}
                            </p>
                          )}
                          {opportunity.customer.phone && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Telefon: {opportunity.customer.phone}
                            </p>
                          )}
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
            disabled={updateOpportunityMutation.isPending}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            İptal
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={updateOpportunityMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updateOpportunityMutation.isPending ? (
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

    {/* New Activity Dialog */}
    <NewActivityDialog
      isOpen={isNewActivityDialogOpen}
      onClose={() => setIsNewActivityDialogOpen(false)}
      onSuccess={handleActivitySuccess}
      opportunityId={opportunity?.id}
      disabledOpportunity={true}
    />
    </>
  );
};

export default OpportunityDetailSheet;
