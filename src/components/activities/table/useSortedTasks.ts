
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
