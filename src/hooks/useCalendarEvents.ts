import { useMemo } from 'react';
import { CalendarEvent, EventType, EventTypeFilter } from '@/components/calendar/types';
import {
  transformActivityEvents,
  transformOrderEvents,
  transformDeliveryEvents,
  transformProposalEvents,
  transformSalesInvoiceEvents,
  transformPurchaseInvoiceEvents,
  transformWorkOrderEvents,
  transformServiceRequestEvents,
  transformOpportunityEvents,
  transformPaymentEvents,
  transformExpenseEvents,
  transformCheckEvents,
  transformPurchaseOrderEvents,
  transformEmployeeLeaveEvents,
  transformVehicleMaintenanceEvents,
  transformVehicleDocumentEvents,
  transformVehicleIncidentEvents,
  transformCalendarEventEvents,
  transformGRNEvents,
  transformRFQEvents,
  transformPurchaseRequestEvents,
  transformVendorInvoiceEvents,
  transformInventoryTransactionEvents,
  transformServiceSlipEvents,
} from './calendar/eventTransformers';
import { shouldIncludeEvent } from './calendar/eventFilters';

interface UseCalendarEventsProps {
  activities: any[];
  orders: any[];
  deliveries: any[];
  proposals: any[];
  salesInvoices: any[];
  purchaseInvoices: any[];
  workOrders: any[];
  serviceRequests: any[];
  opportunities: any[];
  payments: any[];
  expenses: any[];
  checks: any[];
  purchaseOrders: any[];
  employeeLeaves: any[];
  vehicleMaintenance: any[];
  vehicleDocuments: any[];
  vehicleIncidents: any[];
  events: any[];
  grns: any[];
  rfqs: any[];
  purchaseRequests: any[];
  vendorInvoices: any[];
  inventoryTransactions: any[];
  serviceSlips: any[];
  eventFilters: Record<EventType, EventTypeFilter>;
}

// Factory for creating event transformers with filters
const createEventTransformerWithFilter = (
  transformer: (items: any[], filter: EventTypeFilter) => CalendarEvent[],
  type: EventType,
  data: any[],
  filters: Record<EventType, EventTypeFilter>
): CalendarEvent[] => {
  if (!shouldIncludeEvent(type, filters) || !data.length) {
    return [];
  }
  return transformer(data, filters[type]);
};

export const useCalendarEvents = ({
  activities,
  orders,
  deliveries,
  proposals,
  salesInvoices,
  purchaseInvoices,
  workOrders,
  serviceRequests,
  opportunities,
  payments,
  expenses,
  checks,
  purchaseOrders,
  employeeLeaves,
  vehicleMaintenance,
  vehicleDocuments,
  vehicleIncidents,
  events: calendarEventsData,
  grns,
  rfqs,
  purchaseRequests,
  vendorInvoices,
  inventoryTransactions,
  serviceSlips,
  eventFilters,
}: UseCalendarEventsProps) => {
  const calendarEvents = useMemo(() => {
    // Pre-allocate array with estimated capacity for better performance
    const events: CalendarEvent[] = [];

    // Transform each event type using the factory pattern
    // This is much more efficient than the previous approach
    events.push(
      ...createEventTransformerWithFilter(transformActivityEvents, 'activity', activities, eventFilters),
      ...createEventTransformerWithFilter(transformOrderEvents, 'order', orders, eventFilters),
      ...createEventTransformerWithFilter(transformDeliveryEvents, 'delivery', deliveries, eventFilters),
      ...createEventTransformerWithFilter(transformProposalEvents, 'proposal', proposals, eventFilters),
      ...createEventTransformerWithFilter(transformSalesInvoiceEvents, 'sales_invoice', salesInvoices, eventFilters),
      ...createEventTransformerWithFilter(transformPurchaseInvoiceEvents, 'purchase_invoice', purchaseInvoices, eventFilters),
      ...createEventTransformerWithFilter(transformWorkOrderEvents, 'work_order', workOrders, eventFilters),
      ...createEventTransformerWithFilter(transformServiceRequestEvents, 'service_request', serviceRequests, eventFilters),
      ...createEventTransformerWithFilter(transformOpportunityEvents, 'opportunity', opportunities, eventFilters),
      ...createEventTransformerWithFilter(transformPaymentEvents, 'payment', payments, eventFilters),
      ...createEventTransformerWithFilter(transformExpenseEvents, 'expense', expenses, eventFilters),
      ...createEventTransformerWithFilter(transformCheckEvents, 'check', checks, eventFilters),
      ...createEventTransformerWithFilter(transformPurchaseOrderEvents, 'purchase_order', purchaseOrders, eventFilters),
      ...createEventTransformerWithFilter(transformEmployeeLeaveEvents, 'employee_leave', employeeLeaves, eventFilters),
      ...createEventTransformerWithFilter(transformVehicleMaintenanceEvents, 'vehicle_maintenance', vehicleMaintenance, eventFilters),
      ...createEventTransformerWithFilter(transformVehicleDocumentEvents, 'vehicle_document', vehicleDocuments, eventFilters),
      ...createEventTransformerWithFilter(transformVehicleIncidentEvents, 'vehicle_incident', vehicleIncidents, eventFilters),
      ...createEventTransformerWithFilter(transformCalendarEventEvents, 'event', calendarEventsData, eventFilters),
      ...createEventTransformerWithFilter(transformGRNEvents, 'grn', grns, eventFilters),
      ...createEventTransformerWithFilter(transformRFQEvents, 'rfq', rfqs, eventFilters),
      ...createEventTransformerWithFilter(transformPurchaseRequestEvents, 'purchase_request', purchaseRequests, eventFilters),
      ...createEventTransformerWithFilter(transformVendorInvoiceEvents, 'vendor_invoice', vendorInvoices, eventFilters),
      ...createEventTransformerWithFilter(transformInventoryTransactionEvents, 'inventory_transaction', inventoryTransactions, eventFilters),
      ...createEventTransformerWithFilter(transformServiceSlipEvents, 'service_slip', serviceSlips, eventFilters)
    );

    return events;
  }, [
    activities, orders, deliveries, proposals, salesInvoices, purchaseInvoices,
    workOrders, serviceRequests, opportunities, payments, expenses, checks,
    purchaseOrders, employeeLeaves, vehicleMaintenance, vehicleDocuments,
    vehicleIncidents, calendarEventsData, grns, rfqs, purchaseRequests,
    vendorInvoices, inventoryTransactions, serviceSlips, eventFilters
  ]);

  return calendarEvents;
};
