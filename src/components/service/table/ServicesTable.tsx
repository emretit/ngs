import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  MapPin,
  User,
  Calendar,
  Circle
} from "lucide-react";
import type { ServiceRequest } from "@/hooks/service/types";
import ServicesTableHeader, { SortField, SortDirection } from "./ServicesTableHeader";
import { useSortedServices } from "./useSortedServices";

interface ServicesTableProps {
  services: ServiceRequest[];
  isLoading: boolean;
  onSelectService: (service: ServiceRequest) => void;
  searchQuery?: string;
  selectedStatus?: string | null;
  selectedPriority?: string | null;
  selectedTechnician?: string | null;
  selectedServices?: ServiceRequest[];
  onToggleServiceSelection?: (service: ServiceRequest) => void;
  onSelectAll?: (checked: boolean) => void;
}

const ServicesTable = ({
  services,
  isLoading,
  onSelectService,
  searchQuery = "",
  selectedStatus = null,
  selectedPriority = null,
  selectedTechnician = null,
  selectedServices = [],
  onToggleServiceSelection,
  onSelectAll
}: ServicesTableProps) => {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filtreleme
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Arama filtresi
      const customerData = service.customer_data as any;
      const matchesSearch = 
        !searchQuery ||
        service.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.service_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerData?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerData?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Durum filtresi
      if (selectedStatus && service.service_status !== selectedStatus) {
        return false;
      }

      // Öncelik filtresi
      if (selectedPriority && service.service_priority !== selectedPriority) {
        return false;
      }

      // Teknisyen filtresi
      if (selectedTechnician && service.assigned_technician !== selectedTechnician) {
        return false;
      }

      return true;
    });
  }, [services, searchQuery, selectedStatus, selectedPriority, selectedTechnician]);

  // Sıralama
  const sortedServices = useSortedServices(filteredServices, sortField, sortDirection);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Durum badge renkleri - form sayfalarındaki durumlarla eşleşmeli
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Yeni
        </Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          <Circle className="h-3 w-3 mr-1" />
          Atanmış
        </Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Devam Ediyor
        </Badge>;
      case 'on_hold':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Beklemede
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Tamamlandı
        </Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          İptal Edildi
        </Badge>;
      default:
        return <Badge variant="outline">{status || 'Bilinmiyor'}</Badge>;
    }
  };

  // Öncelik badge renkleri
  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Yüksek</Badge>;
      case 'medium':
        return <Badge variant="default">Orta</Badge>;
      case 'low':
        return <Badge variant="secondary">Düşük</Badge>;
      default:
        return priority ? <Badge variant="outline">{priority}</Badge> : null;
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Servisler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (filteredServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Servis bulunamadı</h3>
        <p className="text-muted-foreground">
          {searchQuery || selectedStatus || selectedPriority || selectedTechnician
            ? 'Arama kriterlerinize uygun sonuç bulunamadı.'
            : 'Henüz servis talebi bulunmuyor.'}
        </p>
      </div>
    );
  }

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const allSelected = sortedServices.length > 0 && sortedServices.every(s => isServiceSelected(s.id));

  return (
    <Table>
      <ServicesTableHeader
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        onToggleServiceSelection={!!onToggleServiceSelection}
        onSelectAll={onSelectAll}
        allSelected={allSelected}
      />
      <TableBody>
        {sortedServices.map((service) => {
          const customerData = service.customer_data as any;
          // Önce company name'i kontrol et, yoksa name'i göster
          const customerName = customerData?.company || customerData?.name || 
            (service.customer_id ? 'Yükleniyor...' : 'Belirtilmemiş');
          const isSelected = isServiceSelected(service.id);
          return (
            <TableRow 
              key={service.id} 
              className={`hover:bg-muted/50 ${isSelected ? 'bg-blue-50' : ''}`}
            >
              {onToggleServiceSelection && (
                <TableCell 
                  className="px-4 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleServiceSelection(service)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableCell>
              )}
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                <div className="text-sm font-mono text-muted-foreground">
                  {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()}
                </div>
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{service.service_title}</p>
                  {service.service_request_description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {service.service_request_description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                <div className="text-sm">
                  {customerName}
                </div>
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {service.service_location || 'Belirtilmemiş'}
                </div>
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                {getStatusBadge(service.service_status)}
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                {getPriorityBadge(service.service_priority)}
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {service.assigned_technician || service.technician_name || '-'}
                </div>
              </TableCell>
              <TableCell 
                className="px-4 py-4 cursor-pointer"
                onClick={() => onSelectService(service)}
              >
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(service.created_at)}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ServicesTable;

