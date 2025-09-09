
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
      let valueA, valueB;
      
      switch (sortField) {
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case "due_date":
          valueA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          valueB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          valueA = priorityOrder[a.priority as keyof typeof priorityOrder];
          valueB = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "assignee":
          valueA = a.assignee?.first_name || "";
          valueB = b.assignee?.first_name || "";
          break;
        default:
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
      }
      
      const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return sortDirection === "asc" ? compareResult : -compareResult;
    });
  }, [tasks, sortField, sortDirection]);
};
