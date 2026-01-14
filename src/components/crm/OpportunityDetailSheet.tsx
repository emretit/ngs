import { useState } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Phone, Mail, Calendar, MessageSquare, CheckCircle2, Edit2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Opportunity, opportunityStatusLabels } from "@/types/crm";
import { crmService } from "@/services/crmService";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import NewActivityDialog from "@/components/activities/NewActivityDialog";
import { EditableDetailSheet, FieldConfig } from "@/components/common/EditableDetailSheet";

interface OpportunityDetailSheetProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

// Validation schema
const opportunitySchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  value: z.number().optional(),
  currency: z.string().optional(),
  expected_close_date: z.string().optional(),
  employee_id: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

// Status options
const statusOptions = Object.entries(opportunityStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

// Priority options
const priorityOptions = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
];

// Currency options
const currencyOptions = [
  { value: 'TRY', label: 'TRY (₺)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export const OpportunityDetailSheet = ({
  opportunity,
  isOpen,
  onClose
}: OpportunityDetailSheetProps) => {
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Update mutation
  const updateOpportunityMutation = useMutation({
    mutationFn: async (values: OpportunityFormData) => {
      if (!opportunity?.id) throw new Error('Opportunity ID is required');

      const { error } = await crmService.updateOpportunity(opportunity.id, values);
      if (error) throw error;

      return { id: opportunity.id };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Fırsat güncellendi', {
        description: 'Fırsat başarıyla güncellendi.',
        className: "bg-green-50 border-green-200",
      });
    },
    onError: (error) => {
      toast.error('Hata', {
        description: 'Fırsat güncellenirken bir hata oluştu',
        className: "bg-gray-50 border-gray-200",
      });
      console.error('Error updating opportunity:', error);
    }
  });

  const handleActivitySuccess = () => {
    setIsNewActivityDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const handleSave = async (values: OpportunityFormData) => {
    await updateOpportunityMutation.mutateAsync(values);
  };

  // Form fields configuration
  const fields: FieldConfig<OpportunityFormData>[] = [
    {
      name: 'title',
      label: 'Başlık',
      type: 'text',
      placeholder: 'Fırsat başlığını girin',
      required: true,
      gridColumn: 'col-span-full',
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      placeholder: 'Fırsat detaylarını girin',
      gridColumn: 'col-span-full',
    },
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      options: statusOptions,
      gridColumn: 'col-span-1',
    },
    {
      name: 'priority',
      label: 'Öncelik',
      type: 'select',
      options: priorityOptions,
      gridColumn: 'col-span-1',
    },
    {
      name: 'value',
      label: 'Tahmini Değer',
      type: 'number',
      placeholder: '0',
      gridColumn: 'col-span-1',
    },
    {
      name: 'currency',
      label: 'Para Birimi',
      type: 'select',
      options: currencyOptions,
      gridColumn: 'col-span-1',
    },
    {
      name: 'expected_close_date',
      label: 'Beklenen Kapanış Tarihi',
      type: 'date',
      gridColumn: 'col-span-full',
    },
    {
      name: 'employee_id',
      label: 'Sorumlu Kişi',
      type: 'custom',
      gridColumn: 'col-span-full',
      render: (field) => (
        <EmployeeSelector
          value={field.value || ''}
          onChange={field.onChange}
          label="Sorumlu Kişi"
          placeholder="Sorumlu kişi seçin..."
          searchPlaceholder="Çalışan ara..."
          noResultsText="Çalışan bulunamadı"
          showLabel={false}
          triggerClassName="h-10"
        />
      ),
    },
  ];

  // Render custom actions
  const renderActions = () => (
    <div className="space-y-4">
      {/* Add Activity Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Aktiviteler</h3>
        <Button
          onClick={() => setIsNewActivityDialogOpen(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white h-10"
        >
          <Plus className="h-3 w-3 mr-1" />
          Yeni
        </Button>
      </div>

      {/* Contact History */}
      {opportunity?.contact_history && Array.isArray(opportunity.contact_history) && opportunity.contact_history.length > 0 && (
        <div className="space-y-2">
          {opportunity.contact_history.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
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
          ))}
        </div>
      )}

      <Separator />

      {/* Opportunity History */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Fırsat Geçmişi</h3>

        {/* Created */}
        {opportunity?.created_at && (
          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="p-1 rounded-full bg-green-100">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">Fırsat Oluşturuldu</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(opportunity.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
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
        )}

        {/* Updated */}
        {opportunity?.updated_at && opportunity.updated_at !== opportunity.created_at && (
          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
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

        {/* Customer Info */}
        {opportunity?.customer && (
          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
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
  );

  return (
    <>
      {/* Custom Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
          style={{ pointerEvents: 'auto' }}
          onClick={() => onClose()}
        />
      )}

      <EditableDetailSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Fırsat Detayları"
        data={opportunity as OpportunityFormData}
        fields={fields}
        schema={opportunitySchema}
        onSave={handleSave}
        isSaving={updateOpportunityMutation.isPending}
        renderActions={renderActions}
        saveButtonText="Değişiklikleri Kaydet"
        cancelButtonText="İptal"
        size="2xl"
      />

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
