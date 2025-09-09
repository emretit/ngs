
import type { PipelineItem, PipelineFilter } from "@/types/pipeline";

export const filterItems = (
  items: PipelineItem[],
  searchTerm: string,
  filters: PipelineFilter
): PipelineItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  return items.filter(item => {
    // Search term filtering
    if (searchTerm) {
      const title = item.title?.toLowerCase() || '';
      const description = 'description' in item ? (item.description?.toLowerCase() || '') : '';
      
      if (!title.includes(searchTerm.toLowerCase()) && !description.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Employee/Assignee filtering
    if (filters.employeeId) {
      if ('assignee_id' in item && item.assignee_id !== filters.employeeId) {
        return false;
      }
      // For deals, check employee property
      if ('employeeName' in item && item.employeeName !== filters.employeeId) {
        return false;
      }
    }

    // Customer filtering
    if (filters.customerName && 'customerName' in item) {
      if (!item.customerName?.toLowerCase().includes(filters.customerName.toLowerCase())) {
        return false;
      }
    }

    // Status filtering
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) {
        return false;
      }
    }

    // Priority filtering
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(item.priority)) {
        return false;
      }
    }

    return true;
  });
};
