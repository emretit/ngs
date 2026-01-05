// Color utilities for calendar events

export const getActivityColor = (status: string): string => {
  switch (status) {
    case 'todo': return '#ef4444'; // red
    case 'in_progress': return '#eab308'; // yellow
    case 'completed': return '#22c55e'; // green
    case 'postponed': return '#6b7280'; // gray
    default: return '#6b7280';
  }
};

export const EVENT_COLORS = {
  // Order colors
  orderDate: '#3b82f6',        // blue
  expectedDelivery: '#f59e0b', // amber
  deliveryDate: '#10b981',     // emerald
  
  // Delivery colors
  plannedDelivery: '#8b5cf6',  // violet
  actualDelivery: '#10b981',   // emerald
  
  // Invoice colors
  invoiceDue: '#ef4444',       // red
  
  // Work order colors
  workOrderEnd: '#10b981',     // emerald
  workOrderSla: '#ef4444',     // red
  
  // Service colors
  serviceComplete: '#10b981',  // emerald
  
  // Check colors
  checkIssue: '#3b82f6',       // blue
  
  // Maintenance colors
  nextMaintenance: '#f59e0b',  // amber
} as const;

