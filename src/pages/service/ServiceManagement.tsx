import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ServiceContent from "@/components/service/ServiceContent";
import ServicePageHeader from "@/components/service/header/ServicePageHeader";
import ServiceFilterBar from "@/components/service/filters/ServiceFilterBar";
import ServiceBulkActions from "@/components/service/ServiceBulkActions";
import { ViewType } from "@/components/service/ServiceViewToggle";
import ServiceKanbanBoard from "@/components/service/ServiceKanbanBoard";
import ServiceCalendarView from "@/components/service/ServiceCalendarView";
import ServiceGanttView from "@/components/service/ServiceGanttView";
import { ServiceDispatchBoard } from "@/components/service/dispatch/ServiceDispatchBoard";
import { MaintenanceCalendarView } from "@/components/service/MaintenanceCalendarView";
import ServiceDetailSheet from "@/components/service/ServiceDetailSheet";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

export default function ServiceManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: serviceRequests = [], isLoading } = useServiceRequests();
  
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [selectedServices, setSelectedServices] = useState<ServiceRequest[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Teknisyenleri getir - sadece teknik personel olan aktif çalışanlar
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, status, user_id")
        .eq("status", "aktif")
        .eq("is_technical", true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Müşterileri getir
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-for-service"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Servisleri duruma göre grupla (header için istatistikler)
  const groupedServices = useMemo(() => {
    const grouped: {
      new?: any[];
      assigned?: any[];
      in_progress?: any[];
      on_hold?: any[];
      completed?: any[];
      cancelled?: any[];
    } = {};

    serviceRequests.forEach(service => {
      const status = service.service_status || 'new';
      if (!grouped[status as keyof typeof grouped]) {
        grouped[status as keyof typeof grouped] = [];
      }
      grouped[status as keyof typeof grouped]!.push(service);
    });

    return grouped;
  }, [serviceRequests]);

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, serviceIds }: { action: string; serviceIds: string[] }) => {
      let updates: any = {};
      
      switch (action) {
        case 'complete':
          updates.service_status = 'completed';
          updates.completion_date = new Date().toISOString();
          break;
        case 'in_progress':
          updates.service_status = 'in_progress';
          break;
        case 'cancel':
          updates.service_status = 'cancelled';
          break;
        case 'delete':
          // Silme işlemi
          const { error: deleteError } = await supabase
            .from('service_requests')
            .delete()
            .in('id', serviceIds);
          if (deleteError) throw deleteError;
          return;
        default:
          throw new Error('Geçersiz işlem');
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updates)
        .in('id', serviceIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      setSelectedServices([]);
      toast.success(`${variables.serviceIds.length} servis başarıyla güncellendi`);
    },
    onError: (error: any) => {
      toast.error(`Hata: ${error.message}`);
    }
  });

  const handleToggleServiceSelection = (service: ServiceRequest) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Filtrelenmiş servisleri seç
      const filtered = serviceRequests.filter(service => {
        const customerData = service.customer_data as any;
        const matchesSearch = 
          !searchQuery ||
          service.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.service_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customerData?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (selectedStatus && service.service_status !== selectedStatus) return false;
        if (selectedPriority && service.service_priority !== selectedPriority) return false;
        if (selectedTechnician && service.assigned_technician !== selectedTechnician) return false;
        return true;
      });
      setSelectedServices(filtered);
    } else {
      setSelectedServices([]);
    }
  };

  const handleBulkAction = (action: string, serviceIds: string[]) => {
    bulkActionMutation.mutate({ action, serviceIds });
  };

  const handleAddService = () => {
    navigate('/service/new');
  };

  const handleSelectService = (service: ServiceRequest) => {
    setSelectedService(service);
  };

  const handleCloseDetail = () => {
    setSelectedService(null);
  };

  const handleUpdateStatus = async (serviceId: string, newStatus: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ service_status: newStatus })
      .eq('id', serviceId);
    
    if (error) {
      toast.error('Durum güncellenirken hata oluştu');
    } else {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    }
  };

  return (
    <>
      <div className="space-y-2">
        <ServicePageHeader 
          onCreateService={handleAddService} 
          services={groupedServices}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        {activeView !== "maintenance" && (
          <ServiceFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedPriority={selectedPriority}
            setSelectedPriority={setSelectedPriority}
            selectedTechnician={selectedTechnician}
            setSelectedTechnician={setSelectedTechnician}
            technicians={technicians.map(t => ({
              id: t.id,
              first_name: t.first_name || '',
              last_name: t.last_name || ''
            }))}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        )}

        {activeView === "table" && (
          <ServiceBulkActions
            selectedServices={selectedServices}
            onClearSelection={() => setSelectedServices([])}
            onBulkAction={handleBulkAction}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Servisler yükleniyor...</p>
            </div>
          </div>
        ) : activeView === "maintenance" ? (
          <MaintenanceCalendarView />
        ) : (
          <>
            {activeView === "table" && (
              <ServiceContent 
                services={serviceRequests}
                isLoading={isLoading}
                searchQuery={searchQuery}
                selectedStatus={selectedStatus}
                selectedPriority={selectedPriority}
                selectedTechnician={selectedTechnician}
                selectedServices={selectedServices}
                onToggleServiceSelection={handleToggleServiceSelection}
                onSelectAll={handleSelectAll}
                onSelectService={handleSelectService}
                technicians={technicians}
                onDeleteService={async (service) => {
                  const { error } = await supabase
                    .from('service_requests')
                    .delete()
                    .eq('id', service.id);
                  if (!error) {
                    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
                    toast.success('Servis silindi');
                  } else {
                    toast.error('Servis silinirken hata oluştu');
                  }
                }}
              />
            )}
            {activeView === "kanban" && (
              <ServiceKanbanBoard
                serviceRequests={serviceRequests}
                technicians={technicians}
                customers={customers}
                onSelectRequest={handleSelectService}
                onDeleteService={async (request: ServiceRequest) => {
                  const { error } = await supabase
                    .from('service_requests')
                    .delete()
                    .eq('id', request.id);
                  if (!error) {
                    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
                    toast.success('Servis silindi');
                  }
                }}
                onUpdateStatus={handleUpdateStatus}
                searchQuery={searchQuery}
                priorityFilter={selectedPriority || 'all'}
              />
            )}
            {activeView === "calendar" && (
              <ServiceCalendarView
                serviceRequests={serviceRequests}
                technicians={technicians}
                onSelectService={handleSelectService}
              />
            )}
            {activeView === "gantt" && (
              <ServiceDispatchBoard
                serviceRequests={serviceRequests}
                technicians={technicians}
                onSelectService={handleSelectService}
                onUpdateAssignment={async (serviceId, technicianId, startTime, endTime) => {
                  try {
                    // Servis bilgisini al
                    const { data: service, error: serviceError } = await supabase
                      .from('service_requests')
                      .select('service_title, company_id')
                      .eq('id', serviceId)
                      .single();

                    if (serviceError || !service) {
                      throw new Error('Servis bulunamadı');
                    }

                    // Eğer technicianId boş ise, atamayı kaldır
                    if (!technicianId || technicianId.trim() === '') {
                      const { error } = await supabase
                        .from('service_requests')
                        .update({
                          assigned_technician: null,
                          service_status: 'new'
                        })
                        .eq('id', serviceId);

                      if (error) {
                        throw error;
                      }

                      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
                      toast.success("Servis ataması kaldırıldı.");
                      return;
                    }

                    // Teknisyenin user_id'sini bul
                    const { data: technician, error: techError } = await supabase
                      .from('employees')
                      .select('user_id, first_name, last_name')
                      .eq('id', technicianId)
                      .single();

                    if (techError || !technician) {
                      throw new Error('Teknisyen bulunamadı');
                    }

                    // Servis atama güncellemesi
                    const { error } = await supabase
                      .from('service_requests')
                      .update({
                        assigned_technician: technicianId,
                        issue_date: startTime.toISOString(),
                        service_due_date: endTime.toISOString(),
                        service_status: 'assigned'
                      })
                      .eq('id', serviceId);

                    if (error) {
                      throw error;
                    }

                    // Teknisyene bildirim gönder (eğer user_id varsa)
                    if (technician.user_id) {
                      const notificationTitle = 'Yeni Servis Ataması';
                      const notificationBody = `${service.service_title} servisi size atandı. Tarih: ${formatDate(startTime, 'dd MMM yyyy HH:mm')}`;
                      
                      // Database'e bildirim kaydı ekle
                      const { error: notificationError } = await supabase
                        .from('notifications')
                        .insert({
                          user_id: technician.user_id,
                          title: notificationTitle,
                          body: notificationBody,
                          type: 'service_assignment',
                          service_request_id: serviceId,
                          technician_id: technicianId,
                          company_id: service.company_id,
                          is_read: false,
                        });

                      if (notificationError) {
                        console.error('Bildirim kaydı hatası:', notificationError);
                      }

                      // Push notification gönder (mobil uygulamaya)
                      try {
                        console.log('📱 Push notification gönderiliyor...', {
                          user_id: technician.user_id,
                          title: notificationTitle,
                          body: notificationBody
                        });

                        const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
                          body: {
                            user_id: technician.user_id,
                            title: notificationTitle,
                            body: notificationBody,
                            data: {
                              type: 'service_assignment',
                              service_request_id: serviceId,
                              action: 'open_service_request',
                            }
                          }
                        });

                        if (pushError) {
                          console.error('❌ Push notification gönderme hatası:', pushError);
                          // Hata detaylarını göster
                          toast.error(`Push notification hatası: ${pushError.message || 'Bilinmeyen hata'}`);
                        } else {
                          console.log('✅ Push notification başarıyla gönderildi:', pushData);
                          if (pushData?.fcm_message_id) {
                            console.log('📨 FCM Message ID:', pushData.fcm_message_id);
                          }
                        }
                      } catch (pushErr: any) {
                        console.error('❌ Push notification çağrı hatası:', pushErr);
                        console.error('Hata detayları:', {
                          message: pushErr?.message,
                          stack: pushErr?.stack,
                          name: pushErr?.name
                        });
                        toast.error(`Push notification gönderilemedi: ${pushErr?.message || 'Bilinmeyen hata'}`);
                        // Push notification hatası kritik değil, devam et
                      }
                    }

                    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
                    toast.success("Servis teknisyene atandı ve bildirim gönderildi.");
                  } catch (error: any) {
                    console.error('Servis atama hatası:', error);
                    toast.error(error.message || "Servis ataması güncellenirken bir hata oluştu.");
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Sheet */}
      {selectedService && (
        <ServiceDetailSheet
          service={selectedService}
          open={!!selectedService}
          onOpenChange={(open) => !open && handleCloseDetail()}
          technicians={technicians.map(t => ({
            id: t.id,
            first_name: t.first_name || '',
            last_name: t.last_name || ''
          }))}
        />
      )}
    </>
  );
}
