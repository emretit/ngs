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
import { MaintenanceCalendarView } from "@/components/service/MaintenanceCalendarView";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Teknisyenleri getir - sadece Teknik departmanındaki aktif çalışanlar
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, status, user_id")
        .eq("status", "aktif")
        .eq("department", "Teknik");
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
    navigate(`/service/edit/${service.id}`);
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
              <ServiceGanttView
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
                      const { error: notificationError } = await supabase
                        .from('notifications')
                        .insert({
                          user_id: technician.user_id,
                          title: 'Yeni Servis Ataması',
                          body: `${service.service_title} servisi size atandı. Tarih: ${formatDate(startTime, 'dd MMM yyyy HH:mm')}`,
                          type: 'service_assignment',
                          service_request_id: serviceId,
                          technician_id: technicianId,
                          company_id: service.company_id,
                          is_read: false,
                        });

                      if (notificationError) {
                        console.error('Bildirim gönderme hatası:', notificationError);
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
    </>
  );
}
