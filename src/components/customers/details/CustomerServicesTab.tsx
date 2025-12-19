import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Filter, 
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { DatePicker } from "@/components/ui/date-picker";
import ServicesTable from "@/components/service/table/ServicesTable";
import type { ServiceRequest } from "@/hooks/service/types";

interface CustomerServicesTabProps {
  customer: Customer;
}

export const CustomerServicesTab = ({ customer }: CustomerServicesTabProps) => {
  const navigate = useNavigate();
  
  // Filtreleme state'leri
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // Müşteriye özel servis taleplerini getir (customer_data ile)
  const { data: serviceRequests, isLoading, error } = useQuery({
    queryKey: ['customer-service-requests', customer.id],
    queryFn: async (): Promise<ServiceRequest[]> => {
      try {
        console.log('Fetching service requests for customer:', customer.id);
        
        const { data, error } = await supabase
          .from('service_requests')
          .select(`
            *,
            customers (
              id,
              name,
              company,
              email,
              mobile_phone,
              office_phone,
              address
            )
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Service requests error:', error);
          throw error;
        }
        
        console.log('Service requests data:', data);
        
        // ServiceRequest tipine uygun hale getir
        return (data || []).map((item: any): ServiceRequest => ({
          ...item,
          customer_data: item.customers ? {
            id: item.customers.id,
            name: item.customers.name,
            company: item.customers.company,
            email: item.customers.email,
            mobile_phone: item.customers.mobile_phone,
            office_phone: item.customers.office_phone,
            address: item.customers.address
          } : null,
          attachments: Array.isArray(item.attachments) 
            ? item.attachments.map((att: any) => ({
                name: String(att.name || ''),
                path: String(att.path || ''),
                type: String(att.type || ''),
                size: Number(att.size || 0)
              }))
            : [],
          notes: Array.isArray(item.notes) ? item.notes : undefined,
          warranty_info: typeof item.warranty_info === 'object' ? item.warranty_info : undefined
        }));
      } catch (err) {
        console.error('Service requests fetch error:', err);
        throw err;
      }
    },
  });

  // Teknisyenleri getir
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('is_technical', true)
        .eq('status', 'aktif');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Servis taleplerini tarih filtresine göre filtrele (ServicesTable kendi filtrelerini yapıyor)
  const filteredServices = useMemo(() => {
    if (!serviceRequests) return [];
    
    // Sadece tarih filtresini uygula (diğer filtreler ServicesTable'da yapılıyor)
    return serviceRequests.filter(request => {
      let matchesDate = true;
      if (startDate || endDate) {
        const requestDate = request.service_reported_date || request.created_at;
        if (requestDate) {
          const date = new Date(requestDate);
          if (startDate && date < startDate) matchesDate = false;
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            if (date > endDateTime) matchesDate = false;
          }
        } else {
          matchesDate = false;
        }
      }
      
      return matchesDate;
    });
  }, [serviceRequests, startDate, endDate]);

  const handleServiceClick = (service: ServiceRequest) => {
    navigate(`/service/edit/${service.id}`);
  };

  const handleNewService = () => {
    navigate(`/service/new?customer_id=${customer.id}`);
  };

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    const allServices = serviceRequests || [];
    return {
      total: allServices.length,
      new: allServices.filter(r => r.service_status === 'new' || r.service_status === 'assigned').length,
      inProgress: allServices.filter(r => r.service_status === 'in_progress').length,
      completed: allServices.filter(r => r.service_status === 'completed').length,
      urgent: allServices.filter(r => r.service_priority === 'urgent').length,
      unassigned: allServices.filter(r => !r.assigned_technician).length,
    };
  }, [serviceRequests]);


  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Servis Geçmişi</h3>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Yeni</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.new}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Devam Ediyor</span>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.inProgress}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Tamamlandı</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.completed}
              </span>
            </div>
            {stats.urgent > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Acil</span>
                  <span className="text-sm font-semibold text-red-600">
                    {stats.urgent}
                  </span>
                </div>
              </>
            )}
            {stats.unassigned > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Atanmamış</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {stats.unassigned}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="new">Yeni</SelectItem>
              <SelectItem value="in_progress">Devam Ediyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Öncelik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Öncelikler</SelectItem>
              <SelectItem value="urgent">Acil</SelectItem>
              <SelectItem value="high">Yüksek</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="low">Düşük</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="Başlangıç"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Bitiş"
            />
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={handleNewService}
          >
            <Plus className="h-4 w-4 mr-2" />
            Servis Ekle
          </Button>
        </div>
      </div>

      {/* Services Table - ServiceContent ile aynı yapı */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              <ServicesTable
                services={filteredServices}
                isLoading={isLoading}
                onSelectService={handleServiceClick}
                searchQuery=""
                selectedStatus={statusFilter !== 'all' ? statusFilter : null}
                selectedPriority={priorityFilter !== 'all' ? priorityFilter : null}
                selectedTechnician={null}
                technicians={technicians?.map(t => ({
                  id: t.id,
                  first_name: t.first_name || '',
                  last_name: t.last_name || ''
                })) || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
