import { CalendarEvent, EventTypeFilter } from '@/components/calendar/types';
import { getActivityColor, EVENT_COLORS } from './colorUtils';

// Type for event transformer functions
type EventTransformer<T = any> = (items: T[], filter: EventTypeFilter) => CalendarEvent[];

// Activity Events
export const transformActivityEvents: EventTransformer = (activities, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const activity of activities) {
    if (activity.due_date) {
      events.push({
        id: `activity-${activity.id}`,
        title: activity.title || 'Başlıksız Görev',
        start: new Date(activity.due_date),
        end: new Date(activity.due_date),
        resource: {
          type: 'activity',
          data: activity,
          color: getActivityColor(activity.status)
        }
      });
    }
  }
  
  return events;
};

// Order Events
export const transformOrderEvents: EventTransformer = (orders, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const order of orders) {
    if (order.order_date) {
      events.push({
        id: `order-date-${order.id}`,
        title: `Sipariş: ${order.order_number || order.title}`,
        start: new Date(order.order_date),
        end: new Date(order.order_date),
        resource: {
          type: 'order',
          data: { ...order, eventType: 'order_date' },
          color: EVENT_COLORS.orderDate
        }
      });
    }
    if (order.expected_delivery_date) {
      events.push({
        id: `order-expected-${order.id}`,
        title: `Beklenen Teslimat: ${order.order_number || order.title}`,
        start: new Date(order.expected_delivery_date),
        end: new Date(order.expected_delivery_date),
        resource: {
          type: 'order',
          data: { ...order, eventType: 'expected_delivery' },
          color: EVENT_COLORS.expectedDelivery
        }
      });
    }
    if (order.delivery_date) {
      events.push({
        id: `order-delivery-${order.id}`,
        title: `Teslimat: ${order.order_number || order.title}`,
        start: new Date(order.delivery_date),
        end: new Date(order.delivery_date),
        resource: {
          type: 'order',
          data: { ...order, eventType: 'delivery_date' },
          color: EVENT_COLORS.deliveryDate
        }
      });
    }
  }
  
  return events;
};

// Delivery Events
export const transformDeliveryEvents: EventTransformer = (deliveries, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const delivery of deliveries) {
    if (delivery.planned_delivery_date) {
      events.push({
        id: `delivery-planned-${delivery.id}`,
        title: `Planlanan Teslimat: ${delivery.delivery_number || 'Teslimat'}`,
        start: new Date(delivery.planned_delivery_date),
        end: new Date(delivery.planned_delivery_date),
        resource: {
          type: 'delivery',
          data: { ...delivery, eventType: 'planned' },
          color: EVENT_COLORS.plannedDelivery
        }
      });
    }
    if (delivery.actual_delivery_date) {
      events.push({
        id: `delivery-actual-${delivery.id}`,
        title: `Gerçekleşen Teslimat: ${delivery.delivery_number || 'Teslimat'}`,
        start: new Date(delivery.actual_delivery_date),
        end: new Date(delivery.actual_delivery_date),
        resource: {
          type: 'delivery',
          data: { ...delivery, eventType: 'actual' },
          color: EVENT_COLORS.actualDelivery
        }
      });
    }
  }
  
  return events;
};

// Proposal Events
export const transformProposalEvents: EventTransformer = (proposals, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const proposal of proposals) {
    if (proposal.offer_date) {
      events.push({
        id: `proposal-${proposal.id}`,
        title: `Teklif: ${proposal.number || proposal.title}`,
        start: new Date(proposal.offer_date),
        end: new Date(proposal.offer_date),
        resource: {
          type: 'proposal',
          data: proposal,
          color: filter.color
        }
      });
    }
    if (proposal.valid_until) {
      events.push({
        id: `proposal-valid-${proposal.id}`,
        title: `Teklif Geçerlilik: ${proposal.number || proposal.title}`,
        start: new Date(proposal.valid_until),
        end: new Date(proposal.valid_until),
        resource: {
          type: 'proposal',
          data: { ...proposal, eventType: 'valid_until' },
          color: EVENT_COLORS.expectedDelivery
        }
      });
    }
  }
  
  return events;
};

// Sales Invoice Events
export const transformSalesInvoiceEvents: EventTransformer = (invoices, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const invoice of invoices) {
    if (invoice.fatura_tarihi) {
      events.push({
        id: `sales-invoice-${invoice.id}`,
        title: `Satış Faturası: ${invoice.fatura_no}`,
        start: new Date(invoice.fatura_tarihi),
        end: new Date(invoice.fatura_tarihi),
        resource: {
          type: 'sales_invoice',
          data: invoice,
          color: filter.color
        }
      });
    }
    if (invoice.vade_tarihi) {
      events.push({
        id: `sales-invoice-due-${invoice.id}`,
        title: `Fatura Vadesi: ${invoice.fatura_no}`,
        start: new Date(invoice.vade_tarihi),
        end: new Date(invoice.vade_tarihi),
        resource: {
          type: 'sales_invoice',
          data: { ...invoice, eventType: 'due_date' },
          color: EVENT_COLORS.invoiceDue
        }
      });
    }
  }
  
  return events;
};

// Purchase Invoice Events
export const transformPurchaseInvoiceEvents: EventTransformer = (invoices, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const invoice of invoices) {
    if (invoice.invoice_date) {
      events.push({
        id: `purchase-invoice-${invoice.id}`,
        title: `Satın Alma Faturası: ${invoice.invoice_number}`,
        start: new Date(invoice.invoice_date),
        end: new Date(invoice.invoice_date),
        resource: {
          type: 'purchase_invoice',
          data: invoice,
          color: filter.color
        }
      });
    }
    if (invoice.due_date) {
      events.push({
        id: `purchase-invoice-due-${invoice.id}`,
        title: `Fatura Vadesi: ${invoice.invoice_number}`,
        start: new Date(invoice.due_date),
        end: new Date(invoice.due_date),
        resource: {
          type: 'purchase_invoice',
          data: { ...invoice, eventType: 'due_date' },
          color: EVENT_COLORS.invoiceDue
        }
      });
    }
  }
  
  return events;
};

// Work Order Events
export const transformWorkOrderEvents: EventTransformer = (workOrders, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const wo of workOrders) {
    if (wo.scheduled_start) {
      events.push({
        id: `work-order-start-${wo.id}`,
        title: `İş Emri Başlangıç: ${wo.title || wo.code}`,
        start: new Date(wo.scheduled_start),
        end: new Date(wo.scheduled_start),
        resource: {
          type: 'work_order',
          data: { ...wo, eventType: 'scheduled_start' },
          color: filter.color
        }
      });
    }
    if (wo.scheduled_end) {
      events.push({
        id: `work-order-end-${wo.id}`,
        title: `İş Emri Bitiş: ${wo.title || wo.code}`,
        start: new Date(wo.scheduled_end),
        end: new Date(wo.scheduled_end),
        resource: {
          type: 'work_order',
          data: { ...wo, eventType: 'scheduled_end' },
          color: EVENT_COLORS.workOrderEnd
        }
      });
    }
    if (wo.sla_due) {
      events.push({
        id: `work-order-sla-${wo.id}`,
        title: `SLA Vadesi: ${wo.title || wo.code}`,
        start: new Date(wo.sla_due),
        end: new Date(wo.sla_due),
        resource: {
          type: 'work_order',
          data: { ...wo, eventType: 'sla_due' },
          color: EVENT_COLORS.workOrderSla
        }
      });
    }
  }
  
  return events;
};

// Service Request Events
export const transformServiceRequestEvents: EventTransformer = (serviceRequests, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const sr of serviceRequests) {
    if (sr.service_due_date) {
      events.push({
        id: `service-request-${sr.id}`,
        title: `Hizmet Talebi: ${sr.service_title || sr.title || 'Hizmet'}`,
        start: new Date(sr.service_due_date),
        end: new Date(sr.service_due_date),
        resource: {
          type: 'service_request',
          data: sr,
          color: filter.color
        }
      });
    }
    if (sr.completion_date) {
      events.push({
        id: `service-request-complete-${sr.id}`,
        title: `Hizmet Tamamlandı: ${sr.service_title || sr.title || 'Hizmet'}`,
        start: new Date(sr.completion_date),
        end: new Date(sr.completion_date),
        resource: {
          type: 'service_request',
          data: { ...sr, eventType: 'completion' },
          color: EVENT_COLORS.serviceComplete
        }
      });
    }
  }
  
  return events;
};

// Opportunity Events
export const transformOpportunityEvents: EventTransformer = (opportunities, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const opp of opportunities) {
    if (opp.expected_close_date) {
      events.push({
        id: `opportunity-${opp.id}`,
        title: `Fırsat Kapanış: ${opp.title}`,
        start: new Date(opp.expected_close_date),
        end: new Date(opp.expected_close_date),
        resource: {
          type: 'opportunity',
          data: opp,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Payment Events
export const transformPaymentEvents: EventTransformer = (payments, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const payment of payments) {
    if (payment.payment_date) {
      events.push({
        id: `payment-${payment.id}`,
        title: `Ödeme: ${payment.amount ? payment.amount.toLocaleString('tr-TR') : ''} ${payment.currency || 'TRY'}`,
        start: new Date(payment.payment_date),
        end: new Date(payment.payment_date),
        resource: {
          type: 'payment',
          data: payment,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Expense Events
export const transformExpenseEvents: EventTransformer = (expenses, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const expense of expenses) {
    if (expense.date) {
      events.push({
        id: `expense-${expense.id}`,
        title: `Gider: ${expense.description || 'Gider'} - ${expense.amount ? expense.amount.toLocaleString('tr-TR') : ''} TRY`,
        start: new Date(expense.date),
        end: new Date(expense.date),
        resource: {
          type: 'expense',
          data: expense,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Check Events
export const transformCheckEvents: EventTransformer = (checks, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const check of checks) {
    if (check.due_date) {
      events.push({
        id: `check-due-${check.id}`,
        title: `Çek Vadesi: ${check.check_number || check.amount ? check.amount.toLocaleString('tr-TR') : 'Çek'}`,
        start: new Date(check.due_date),
        end: new Date(check.due_date),
        resource: {
          type: 'check',
          data: check,
          color: filter.color
        }
      });
    }
    if (check.issue_date) {
      events.push({
        id: `check-issue-${check.id}`,
        title: `Çek Kesim: ${check.check_number || check.amount ? check.amount.toLocaleString('tr-TR') : 'Çek'}`,
        start: new Date(check.issue_date),
        end: new Date(check.issue_date),
        resource: {
          type: 'check',
          data: { ...check, eventType: 'issue' },
          color: EVENT_COLORS.checkIssue
        }
      });
    }
  }
  
  return events;
};

// Purchase Order Events
export const transformPurchaseOrderEvents: EventTransformer = (purchaseOrders, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const po of purchaseOrders) {
    if (po.order_date) {
      events.push({
        id: `purchase-order-${po.id}`,
        title: `Satın Alma Siparişi: ${po.order_number || po.title}`,
        start: new Date(po.order_date),
        end: new Date(po.order_date),
        resource: {
          type: 'purchase_order',
          data: po,
          color: filter.color
        }
      });
    }
    if (po.expected_delivery_date) {
      events.push({
        id: `purchase-order-expected-${po.id}`,
        title: `Beklenen Teslimat: ${po.order_number || po.title}`,
        start: new Date(po.expected_delivery_date),
        end: new Date(po.expected_delivery_date),
        resource: {
          type: 'purchase_order',
          data: { ...po, eventType: 'expected_delivery' },
          color: EVENT_COLORS.expectedDelivery
        }
      });
    }
  }
  
  return events;
};

// Employee Leave Events
export const transformEmployeeLeaveEvents: EventTransformer = (employeeLeaves, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const leave of employeeLeaves) {
    if (leave.start_date && leave.end_date) {
      events.push({
        id: `employee-leave-${leave.id}`,
        title: `İzin: ${leave.employee?.first_name || ''} ${leave.employee?.last_name || ''}`,
        start: new Date(leave.start_date),
        end: new Date(leave.end_date),
        resource: {
          type: 'employee_leave',
          data: leave,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Vehicle Maintenance Events
export const transformVehicleMaintenanceEvents: EventTransformer = (vehicleMaintenance, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const maintenance of vehicleMaintenance) {
    if (maintenance.maintenance_date) {
      events.push({
        id: `vehicle-maintenance-${maintenance.id}`,
        title: `Araç Bakımı: ${maintenance.vehicle?.plate_number || maintenance.vehicle?.brand || 'Araç'}`,
        start: new Date(maintenance.maintenance_date),
        end: new Date(maintenance.maintenance_date),
        resource: {
          type: 'vehicle_maintenance',
          data: maintenance,
          color: filter.color
        }
      });
    }
    if (maintenance.next_maintenance_date) {
      events.push({
        id: `vehicle-maintenance-next-${maintenance.id}`,
        title: `Sonraki Bakım: ${maintenance.vehicle?.plate_number || maintenance.vehicle?.brand || 'Araç'}`,
        start: new Date(maintenance.next_maintenance_date),
        end: new Date(maintenance.next_maintenance_date),
        resource: {
          type: 'vehicle_maintenance',
          data: { ...maintenance, eventType: 'next' },
          color: EVENT_COLORS.nextMaintenance
        }
      });
    }
  }
  
  return events;
};

// Vehicle Document Events
export const transformVehicleDocumentEvents: EventTransformer = (vehicleDocuments, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const doc of vehicleDocuments) {
    if (doc.expiry_date) {
      events.push({
        id: `vehicle-document-${doc.id}`,
        title: `Belge Son Geçerlilik: ${doc.vehicle?.plate_number || doc.vehicle?.brand || 'Araç'} - ${doc.document_type || 'Belge'}`,
        start: new Date(doc.expiry_date),
        end: new Date(doc.expiry_date),
        resource: {
          type: 'vehicle_document',
          data: doc,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Vehicle Incident Events
export const transformVehicleIncidentEvents: EventTransformer = (vehicleIncidents, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const incident of vehicleIncidents) {
    if (incident.incident_date) {
      events.push({
        id: `vehicle-incident-${incident.id}`,
        title: `Araç Kazası: ${incident.vehicle?.plate_number || incident.vehicle?.brand || 'Araç'}`,
        start: new Date(incident.incident_date),
        end: new Date(incident.incident_date),
        resource: {
          type: 'vehicle_incident',
          data: incident,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Calendar Event Events
export const transformCalendarEventEvents: EventTransformer = (calendarEvents, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const event of calendarEvents) {
    if (event.start_time) {
      const endTime = event.end_time ? new Date(event.end_time) : new Date(event.start_time);
      events.push({
        id: `event-${event.id}`,
        title: event.title || 'Etkinlik',
        start: new Date(event.start_time),
        end: endTime,
        resource: {
          type: 'event',
          data: event,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// GRN Events (Goods Receipt Note)
export const transformGRNEvents: EventTransformer = (grns, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const grn of grns) {
    if (grn.received_date) {
      events.push({
        id: `grn-${grn.id}`,
        title: `Mal Kabul: ${grn.grn_number || 'GRN'}`,
        start: new Date(grn.received_date),
        end: new Date(grn.received_date),
        resource: {
          type: 'grn',
          data: grn,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// RFQ Events (Request for Quotation)
export const transformRFQEvents: EventTransformer = (rfqs, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const rfq of rfqs) {
    if (rfq.due_date) {
      events.push({
        id: `rfq-${rfq.id}`,
        title: `Teklif Talebi: ${rfq.rfq_number || 'RFQ'}`,
        start: new Date(rfq.due_date),
        end: new Date(rfq.due_date),
        resource: {
          type: 'rfq',
          data: rfq,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Purchase Request Events
export const transformPurchaseRequestEvents: EventTransformer = (purchaseRequests, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const pr of purchaseRequests) {
    if (pr.requested_date) {
      events.push({
        id: `purchase-request-${pr.id}`,
        title: `Satın Alma Talebi: ${pr.request_number || 'PR'}`,
        start: new Date(pr.requested_date),
        end: new Date(pr.requested_date),
        resource: {
          type: 'purchase_request',
          data: pr,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Vendor Invoice Events
export const transformVendorInvoiceEvents: EventTransformer = (vendorInvoices, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const invoice of vendorInvoices) {
    if (invoice.invoice_date) {
      events.push({
        id: `vendor-invoice-${invoice.id}`,
        title: `Tedarikçi Faturası: ${invoice.invoice_number}`,
        start: new Date(invoice.invoice_date),
        end: new Date(invoice.invoice_date),
        resource: {
          type: 'vendor_invoice',
          data: invoice,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Inventory Transaction Events
export const transformInventoryTransactionEvents: EventTransformer = (transactions, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const transaction of transactions) {
    if (transaction.transaction_date) {
      events.push({
        id: `inventory-transaction-${transaction.id}`,
        title: `Stok Hareketi: ${transaction.transaction_type || 'İşlem'}`,
        start: new Date(transaction.transaction_date),
        end: new Date(transaction.transaction_date),
        resource: {
          type: 'inventory_transaction',
          data: transaction,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

// Service Slip Events
export const transformServiceSlipEvents: EventTransformer = (serviceSlips, filter) => {
  const events: CalendarEvent[] = [];
  
  for (const slip of serviceSlips) {
    if (slip.service_date) {
      events.push({
        id: `service-slip-${slip.id}`,
        title: `Servis Fişi: ${slip.slip_number || 'Fiş'}`,
        start: new Date(slip.service_date),
        end: new Date(slip.service_date),
        resource: {
          type: 'service_slip',
          data: slip,
          color: filter.color
        }
      });
    }
  }
  
  return events;
};

