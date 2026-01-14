import { useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Phone, Mail, Calendar, MessageSquare, CheckCircle2, Edit2, User, Activity, Target, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Opportunity, opportunityStatusLabels } from "@/types/crm";
import { crmService } from "@/services/crmService";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import QuickActivityForm from "@/components/activities/QuickActivityForm";
import EditActivityForm from "@/components/activities/EditActivityForm";
import { EditableDetailSheet, FieldConfig } from "@/components/common/EditableDetailSheet";
import { supabase } from "@/integrations/supabase/client";

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
  const [showQuickActivityForm, setShowQuickActivityForm] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fırsata ait aktiviteleri çek
  const { data: activities = [] } = useQuery({
    queryKey: ['opportunity-activities', opportunity?.id],
    queryFn: async () => {
      if (!opportunity?.id) return [];
      
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name
          )
        `)
        .eq('opportunity_id', opportunity.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!opportunity?.id && isOpen,
  });

  const handleClose = () => {
    console.log('[OpportunityDetailSheet] handleClose called');
    setShowQuickActivityForm(false);
    setEditingActivityId(null);
    onClose();
  };

  // Update mutation
  const updateOpportunityMutation = useMutation({
    mutationFn: async (values: OpportunityFormData) => {
      if (!opportunity?.id) throw new Error('Opportunity ID is required');

      const { error } = await crmService.updateOpportunity(opportunity.id, values as any);
      if (error) throw error;

      return { id: opportunity.id };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['opportunities'], exact: false });
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
    setShowQuickActivityForm(false);
    setEditingActivityId(null);
    queryClient.invalidateQueries({ queryKey: ['activities'] });
    queryClient.invalidateQueries({ queryKey: ['opportunity-activities', opportunity?.id] });
  };

  const handleEditClick = (activityId: string) => {
    // Yeni form ekleme modunu kapat
    setShowQuickActivityForm(false);
    // Düzenleme modunu aç/kapat
    setEditingActivityId(editingActivityId === activityId ? null : activityId);
  };

  const handleSave = async (values: OpportunityFormData) => {
    await updateOpportunityMutation.mutateAsync(values);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      new: { label: 'Yeni', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      contacted: { label: 'İletişim Kuruldu', className: 'bg-purple-100 text-purple-700 border-purple-200' },
      qualified: { label: 'Nitelikli', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      proposal: { label: 'Teklif Verildi', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      negotiation: { label: 'Müzakere', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      won: { label: 'Kazanıldı', className: 'bg-green-100 text-green-700 border-green-200' },
      lost: { label: 'Kaybedildi', className: 'bg-red-100 text-red-700 border-red-200' },
      postponed: { label: 'Ertelendi', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    return badges[status as keyof typeof badges] || badges.new;
  };

  // Render header with status badge
  const renderHeader = () => {
    if (!opportunity) return null;

    const statusBadge = getStatusBadge(opportunity.status);

    return (
      <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{opportunity.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {opportunity.created_at && format(new Date(opportunity.created_at), 'dd MMM yyyy', { locale: tr })}
          </p>
        </div>
        <Badge className={cn("text-xs px-2 py-0.5 border flex-shrink-0", statusBadge.className)}>
          {statusBadge.label}
        </Badge>
      </div>
    );
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

  // Get status badge for activities
  const getActivityStatusBadge = (status: string) => {
    const badges = {
      todo: { label: 'Yapılacak', className: 'bg-red-100 text-red-700' },
      in_progress: { label: 'Devam Ediyor', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Tamamlandı', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'İptal', className: 'bg-gray-100 text-gray-700' },
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  // Render custom actions
  const renderActions = () => {
    const activityCount = activities.length;
    const contactHistoryCount = opportunity?.contact_history?.length || 0;
    
    return (
      <div className="space-y-2">
        {/* Aktiviteler Section */}
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-50">
                <Activity className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">Aktiviteler</h4>
              {activityCount > 0 && (
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                  {activityCount}
                </span>
              )}
            </div>
            <Button
              onClick={() => {
                setShowQuickActivityForm(!showQuickActivityForm);
                setEditingActivityId(null); // Edit modunu kapat
              }}
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
            >
              <Plus className="h-3 w-3 mr-1" />
              {showQuickActivityForm ? 'İptal' : 'Yeni'}
            </Button>
          </div>

          {/* Quick Activity Form */}
          {showQuickActivityForm && (
            <div className="mb-3">
              <QuickActivityForm
                opportunityId={opportunity?.id || ''}
                customerId={opportunity?.customer_id || undefined}
                customerName={opportunity?.customer?.name || undefined}
                onSuccess={handleActivitySuccess}
                onCancel={() => setShowQuickActivityForm(false)}
              />
            </div>
          )}

          {/* Aktiviteler Listesi */}
          {activityCount > 0 ? (
            <div className="space-y-1.5">
              {activities.map((activity: any) => {
                const statusBadge = getActivityStatusBadge(activity.status);
                const isEditing = editingActivityId === activity.id;
                
                return (
                  <div key={activity.id} className="bg-white rounded-md border border-gray-100">
                    <div className="p-2 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-xs font-medium text-gray-900 truncate">
                              {activity.title}
                            </h5>
                            {activity.is_important && (
                              <span className="text-yellow-500 flex-shrink-0">
                                <Target className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(activity.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                            {activity.assignee && (
                              <>
                                <span>•</span>
                                <span>{activity.assignee.first_name} {activity.assignee.last_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cn("text-xs px-2 py-0.5", statusBadge.className)}>
                            {statusBadge.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(activity.id)}
                            className="h-7 w-7 p-0 hover:bg-blue-100"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Edit Form - Accordion tarzı */}
                    {isEditing && (
                      <div className="border-t border-gray-100">
                        <EditActivityForm
                          activity={activity}
                          onSuccess={handleActivitySuccess}
                          onCancel={() => setEditingActivityId(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !showQuickActivityForm && (
            <div className="text-center py-4 text-gray-500">
              <Activity className="h-8 w-8 mx-auto opacity-20 mb-2" />
              <p className="text-xs">Henüz aktivite bulunmuyor</p>
            </div>
          )}

          {/* Contact History Accordion */}
          {contactHistoryCount > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="activities" className="border-none">
                  <AccordionTrigger className="py-2 px-0 hover:no-underline">
                    <span className="text-xs font-medium text-gray-700">
                      İletişim Geçmişi ({contactHistoryCount})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-1.5">
                      {opportunity?.contact_history?.map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-2 p-2 bg-white rounded-md">
                          <div className="p-1 rounded-full bg-blue-100 flex-shrink-0">
                            {activity.contact_type === 'call' && <Phone className="h-3.5 w-3.5 text-blue-600" />}
                            {activity.contact_type === 'email' && <Mail className="h-3.5 w-3.5 text-blue-600" />}
                            {activity.contact_type === 'meeting' && <Calendar className="h-3.5 w-3.5 text-blue-600" />}
                            {activity.contact_type === 'other' && <MessageSquare className="h-3.5 w-3.5 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
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
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{activity.notes}</p>
                            {activity.employee_name && (
                              <p className="text-xs text-gray-500 mt-0.5">{activity.employee_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>

        {/* Fırsat Geçmişi Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-none">
            <AccordionTrigger className="py-2 px-0 hover:no-underline">
              <span className="text-xs font-medium text-gray-700">
                Fırsat Geçmişi ({opportunity?.updated_at && opportunity.updated_at !== opportunity.created_at ? 3 : 2})
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1.5">
                {/* Created */}
                {opportunity?.created_at && (
                  <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md">
                    <div className="p-1 rounded-full bg-green-100 flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">Fırsat Oluşturuldu</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(opportunity.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
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
                  <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md">
                    <div className="p-1 rounded-full bg-blue-100 flex-shrink-0">
                      <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
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
                  <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md">
                    <div className="p-1 rounded-full bg-gray-100 flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">Müşteri Bilgileri</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {opportunity.customer.name}
                      </p>
                      {opportunity.customer.email && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  return (
    <>
      {/* Custom Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            console.log('[OpportunityDetailSheet] Custom overlay clicked', {
              target: e.target,
              currentTarget: e.currentTarget,
              isDirectClick: e.target === e.currentTarget
            });
            if (e.target === e.currentTarget) {
              console.log('[OpportunityDetailSheet] Closing sheet via overlay');
              handleClose();
            }
          }}
        />
      )}

      <EditableDetailSheet
        isOpen={isOpen}
        onClose={handleClose}
        title="Fırsat Detayı"
        subtitle={opportunity?.title}
        data={opportunity as OpportunityFormData}
        fields={fields}
        schema={opportunitySchema}
        onSave={handleSave}
        isSaving={updateOpportunityMutation.isPending}
        renderHeader={renderHeader}
        renderActions={renderActions}
        saveButtonText="Değişiklikleri Kaydet"
        cancelButtonText="İptal"
        size="md"
      />
    </>
  );
};

export default OpportunityDetailSheet;
