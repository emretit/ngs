import { useMemo } from 'react';
import { CalendarEvent, EventType, EventTypeFilter } from '@/components/calendar/types';

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

const getActivityColor = (status: string) => {
  switch (status) {
    case 'todo': return '#ef4444'; // red
    case 'in_progress': return '#eab308'; // yellow
    case 'completed': return '#22c55e'; // green
    case 'postponed': return '#6b7280'; // gray
    default: return '#6b7280';
  }
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
    const events: CalendarEvent[] = [];

    // Activities
    if (eventFilters.activity.enabled) {
      activities.forEach((activity: any) => {
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
      });
    }

    // Orders
    if (eventFilters.order.enabled) {
      orders.forEach((order: any) => {
        if (order.order_date) {
          events.push({
            id: `order-date-${order.id}`,
            title: `Sipariş: ${order.order_number || order.title}`,
            start: new Date(order.order_date),
            end: new Date(order.order_date),
            resource: {
              type: 'order',
              data: { ...order, eventType: 'order_date' },
              color: '#3b82f6'
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
              color: '#f59e0b'
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
              color: '#10b981'
            }
          });
        }
      });
    }

    // Deliveries
    if (eventFilters.delivery.enabled) {
      deliveries.forEach((delivery: any) => {
        if (delivery.planned_delivery_date) {
          events.push({
            id: `delivery-planned-${delivery.id}`,
            title: `Planlanan Teslimat: ${delivery.delivery_number || 'Teslimat'}`,
            start: new Date(delivery.planned_delivery_date),
            end: new Date(delivery.planned_delivery_date),
            resource: {
              type: 'delivery',
              data: { ...delivery, eventType: 'planned' },
              color: '#8b5cf6'
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
              color: '#10b981'
            }
          });
        }
      });
    }

    // Proposals
    if (eventFilters.proposal.enabled) {
      proposals.forEach((proposal: any) => {
        if (proposal.offer_date) {
          events.push({
            id: `proposal-${proposal.id}`,
            title: `Teklif: ${proposal.number || proposal.title}`,
            start: new Date(proposal.offer_date),
            end: new Date(proposal.offer_date),
            resource: {
              type: 'proposal',
              data: proposal,
              color: eventFilters.proposal.color
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
              color: '#f59e0b'
            }
          });
        }
      });
    }

    // Sales Invoices
    if (eventFilters.sales_invoice.enabled) {
      salesInvoices.forEach((invoice: any) => {
        if (invoice.fatura_tarihi) {
          events.push({
            id: `sales-invoice-${invoice.id}`,
            title: `Satış Faturası: ${invoice.fatura_no}`,
            start: new Date(invoice.fatura_tarihi),
            end: new Date(invoice.fatura_tarihi),
            resource: {
              type: 'sales_invoice',
              data: invoice,
              color: eventFilters.sales_invoice.color
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
              color: '#ef4444'
            }
          });
        }
      });
    }

    // Purchase Invoices
    if (eventFilters.purchase_invoice.enabled) {
      purchaseInvoices.forEach((invoice: any) => {
        if (invoice.invoice_date) {
          events.push({
            id: `purchase-invoice-${invoice.id}`,
            title: `Satın Alma Faturası: ${invoice.invoice_number}`,
            start: new Date(invoice.invoice_date),
            end: new Date(invoice.invoice_date),
            resource: {
              type: 'purchase_invoice',
              data: invoice,
              color: eventFilters.purchase_invoice.color
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
              color: '#ef4444'
            }
          });
        }
      });
    }

    // Work Orders
    if (eventFilters.work_order.enabled) {
      workOrders.forEach((wo: any) => {
        if (wo.scheduled_start) {
          events.push({
            id: `work-order-start-${wo.id}`,
            title: `İş Emri Başlangıç: ${wo.title || wo.code}`,
            start: new Date(wo.scheduled_start),
            end: new Date(wo.scheduled_start),
            resource: {
              type: 'work_order',
              data: { ...wo, eventType: 'scheduled_start' },
              color: eventFilters.work_order.color
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
              color: '#10b981'
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
              color: '#ef4444'
            }
          });
        }
      });
    }

    // Service Requests
    if (eventFilters.service_request.enabled) {
      serviceRequests.forEach((sr: any) => {
        if (sr.service_due_date) {
          events.push({
            id: `service-request-${sr.id}`,
            title: `Hizmet Talebi: ${sr.service_title || sr.title || 'Hizmet'}`,
            start: new Date(sr.service_due_date),
            end: new Date(sr.service_due_date),
            resource: {
              type: 'service_request',
              data: sr,
              color: eventFilters.service_request.color
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
              color: '#10b981'
            }
          });
        }
      });
    }

    // Opportunities
    if (eventFilters.opportunity.enabled) {
      opportunities.forEach((opp: any) => {
        if (opp.expected_close_date) {
          events.push({
            id: `opportunity-${opp.id}`,
            title: `Fırsat Kapanış: ${opp.title}`,
            start: new Date(opp.expected_close_date),
            end: new Date(opp.expected_close_date),
            resource: {
              type: 'opportunity',
              data: opp,
              color: eventFilters.opportunity.color
            }
          });
        }
      });
    }

    // Payments
    if (eventFilters.payment.enabled) {
      payments.forEach((payment: any) => {
        if (payment.payment_date) {
          events.push({
            id: `payment-${payment.id}`,
            title: `Ödeme: ${payment.amount ? payment.amount.toLocaleString('tr-TR') : ''} ${payment.currency || 'TRY'}`,
            start: new Date(payment.payment_date),
            end: new Date(payment.payment_date),
            resource: {
              type: 'payment',
              data: payment,
              color: eventFilters.payment.color
            }
          });
        }
      });
    }

    // Expenses
    if (eventFilters.expense.enabled) {
      expenses.forEach((expense: any) => {
        if (expense.date) {
          events.push({
            id: `expense-${expense.id}`,
            title: `Gider: ${expense.description || 'Gider'} - ${expense.amount ? expense.amount.toLocaleString('tr-TR') : ''} TRY`,
            start: new Date(expense.date),
            end: new Date(expense.date),
            resource: {
              type: 'expense',
              data: expense,
              color: eventFilters.expense.color
            }
          });
        }
      });
    }

    // Checks
    if (eventFilters.check.enabled) {
      checks.forEach((check: any) => {
        if (check.due_date) {
          events.push({
            id: `check-due-${check.id}`,
            title: `Çek Vadesi: ${check.check_number || check.amount ? check.amount.toLocaleString('tr-TR') : 'Çek'}`,
            start: new Date(check.due_date),
            end: new Date(check.due_date),
            resource: {
              type: 'check',
              data: check,
              color: eventFilters.check.color
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
              color: '#3b82f6'
            }
          });
        }
      });
    }

    // Purchase Orders
    if (eventFilters.purchase_order.enabled) {
      purchaseOrders.forEach((po: any) => {
        if (po.order_date) {
          events.push({
            id: `purchase-order-${po.id}`,
            title: `Satın Alma Siparişi: ${po.order_number || po.title}`,
            start: new Date(po.order_date),
            end: new Date(po.order_date),
            resource: {
              type: 'purchase_order',
              data: po,
              color: eventFilters.purchase_order.color
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
              color: '#f59e0b'
            }
          });
        }
      });
    }

    // Employee Leaves
    if (eventFilters.employee_leave.enabled) {
      employeeLeaves.forEach((leave: any) => {
        if (leave.start_date && leave.end_date) {
          events.push({
            id: `employee-leave-${leave.id}`,
            title: `İzin: ${leave.employee?.first_name || ''} ${leave.employee?.last_name || ''}`,
            start: new Date(leave.start_date),
            end: new Date(leave.end_date),
            resource: {
              type: 'employee_leave',
              data: leave,
              color: eventFilters.employee_leave.color
            }
          });
        }
      });
    }

    // Vehicle Maintenance
    if (eventFilters.vehicle_maintenance.enabled) {
      vehicleMaintenance.forEach((maintenance: any) => {
        if (maintenance.maintenance_date) {
          events.push({
            id: `vehicle-maintenance-${maintenance.id}`,
            title: `Araç Bakımı: ${maintenance.vehicle?.plate_number || maintenance.vehicle?.brand || 'Araç'}`,
            start: new Date(maintenance.maintenance_date),
            end: new Date(maintenance.maintenance_date),
            resource: {
              type: 'vehicle_maintenance',
              data: maintenance,
              color: eventFilters.vehicle_maintenance.color
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
              color: '#f59e0b'
            }
          });
        }
      });
    }

    // Vehicle Documents
    if (eventFilters.vehicle_document.enabled) {
      vehicleDocuments.forEach((doc: any) => {
        if (doc.expiry_date) {
          events.push({
            id: `vehicle-document-${doc.id}`,
            title: `Belge Son Geçerlilik: ${doc.vehicle?.plate_number || doc.vehicle?.brand || 'Araç'} - ${doc.document_type || 'Belge'}`,
            start: new Date(doc.expiry_date),
            end: new Date(doc.expiry_date),
            resource: {
              type: 'vehicle_document',
              data: doc,
              color: eventFilters.vehicle_document.color
            }
          });
        }
      });
    }

    // Vehicle Incidents
    if (eventFilters.vehicle_incident.enabled) {
      vehicleIncidents.forEach((incident: any) => {
        if (incident.incident_date) {
          events.push({
            id: `vehicle-incident-${incident.id}`,
            title: `Araç Kazası: ${incident.vehicle?.plate_number || incident.vehicle?.brand || 'Araç'}`,
            start: new Date(incident.incident_date),
            end: new Date(incident.incident_date),
            resource: {
              type: 'vehicle_incident',
              data: incident,
              color: eventFilters.vehicle_incident.color
            }
          });
        }
      });
    }

    // Events
    if (eventFilters.event.enabled) {
      calendarEventsData.forEach((event: any) => {
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
              color: eventFilters.event.color
            }
          });
        }
      });
    }

    // Filter events based on enabled types
    return events.filter(event => eventFilters[event.resource.type]?.enabled !== false);
  }, [
    activities, orders, deliveries, proposals, salesInvoices, purchaseInvoices,
    workOrders, serviceRequests, opportunities, payments, expenses, checks,
    purchaseOrders, employeeLeaves, vehicleMaintenance, vehicleDocuments,
    vehicleIncidents, calendarEventsData, eventFilters
  ]);

  return calendarEvents;
};

