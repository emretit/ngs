import { useMemo } from "react";
import { ServiceRequest } from "@/hooks/service/types";
import { SortField, SortDirection } from "./ServicesTableHeader";

export const useSortedServices = (
  services: ServiceRequest[],
  sortField: SortField,
  sortDirection: SortDirection
): ServiceRequest[] => {
  return useMemo(() => {
    return [...services].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      let isNullA = false;
      let isNullB = false;
      
      switch (sortField) {
        case "service_number":
          valueA = a.service_number?.toLowerCase() || '';
          valueB = b.service_number?.toLowerCase() || '';
          isNullA = !a.service_number;
          isNullB = !b.service_number;
          break;
        case "service_title":
          valueA = a.service_title?.toLowerCase() || '';
          valueB = b.service_title?.toLowerCase() || '';
          isNullA = !a.service_title;
          isNullB = !b.service_title;
          break;
        case "created_at":
          valueA = a.created_at ? new Date(a.created_at).getTime() : null;
          valueB = b.created_at ? new Date(b.created_at).getTime() : null;
          isNullA = !a.created_at;
          isNullB = !b.created_at;
          break;
        case "service_status":
          valueA = a.service_status || '';
          valueB = b.service_status || '';
          isNullA = !a.service_status;
          isNullB = !b.service_status;
          break;
        case "service_priority":
          const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
          valueA = priorityOrder[a.service_priority as string] || 0;
          valueB = priorityOrder[b.service_priority as string] || 0;
          isNullA = !a.service_priority;
          isNullB = !b.service_priority;
          break;
        case "assigned_technician":
          valueA = (a.assigned_technician || a.technician_name || '').toLowerCase();
          valueB = (b.assigned_technician || b.technician_name || '').toLowerCase();
          isNullA = !a.assigned_technician && !a.technician_name;
          isNullB = !b.assigned_technician && !b.technician_name;
          break;
        default:
          valueA = a.service_title?.toLowerCase() || '';
          valueB = b.service_title?.toLowerCase() || '';
          isNullA = !a.service_title;
          isNullB = !b.service_title;
      }
      
      // Null değerleri en sona gönder
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1;
      if (isNullB) return -1;
      
      // Number karşılaştırması
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }
      
      // String karşılaştırması - Türkçe karakter desteği ile
      const aString = String(valueA).toLowerCase();
      const bString = String(valueB).toLowerCase();
      const comparison = aString.localeCompare(bString, 'tr', { numeric: true, sensitivity: 'base' });
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [services, sortField, sortDirection]);
};











