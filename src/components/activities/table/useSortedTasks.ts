
import { useMemo } from "react";
import { Task } from "@/types/task";
import { SortField, SortDirection } from "./types";

export const useSortedTasks = (
  tasks: Task[],
  sortField: SortField,
  sortDirection: SortDirection
): Task[] => {
  return useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Önce status'a göre sırala: completed olanlar en alta
      const statusOrder: Record<string, number> = {
        'todo': 1,
        'in_progress': 2,
        'postponed': 3,
        'completed': 4, // En alta
      };
      
      const aStatusOrder = statusOrder[a.status] || 99;
      const bStatusOrder = statusOrder[b.status] || 99;
      
      // Eğer status'lar farklıysa, status sırasına göre sırala
      if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder;
      }
      
      // Aynı status grubundaysa, özel sıralama kuralları uygula
      if (a.status === 'todo' && b.status === 'todo') {
        // Yapılacaklar: En yeni tarihli olanlar en üstte (descending)
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
        
        // Tarih yoksa en alta
        if (!a.due_date && !b.due_date) {
          // İkisi de tarih yoksa, created_at'e göre sırala (en yeni en üstte)
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bCreated - aCreated; // Descending
        }
        if (!a.due_date) return 1; // A tarih yoksa alta
        if (!b.due_date) return -1; // B tarih yoksa alta
        
        // Tarihli olanlar: En yeni tarihli en üstte (descending)
        return bDate - aDate;
      }
      
      // Diğer durumlar için normal sıralama
      let valueA: any;
      let valueB: any;
      let isNullA = false;
      let isNullB = false;
      
      switch (sortField) {
        case "title":
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          isNullA = !a.title;
          isNullB = !b.title;
          break;
        case "due_date":
          valueA = a.due_date ? new Date(a.due_date).getTime() : null;
          valueB = b.due_date ? new Date(b.due_date).getTime() : null;
          isNullA = !a.due_date;
          isNullB = !b.due_date;
          break;
        case "status":
          valueA = a.status || '';
          valueB = b.status || '';
          isNullA = !a.status;
          isNullB = !b.status;
          break;
        case "assignee":
          valueA = `${a.assignee?.first_name || ''} ${a.assignee?.last_name || ''}`.trim();
          valueB = `${b.assignee?.first_name || ''} ${b.assignee?.last_name || ''}`.trim();
          isNullA = !a.assignee?.first_name && !a.assignee?.last_name;
          isNullB = !b.assignee?.first_name && !b.assignee?.last_name;
          break;
        default:
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          isNullA = !a.title;
          isNullB = !b.title;
      }
      
      // Null değerleri en sona gönder
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1; // A null ise B'den sonra
      if (isNullB) return -1; // B null ise A'dan sonra
      
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
  }, [tasks, sortField, sortDirection]);
};
