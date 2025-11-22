import { Activity, ShoppingCart, Truck, FileText, Receipt, Wrench, Target, DollarSign, CreditCard, CalendarDays, Car, Package, ClipboardList, FileCheck, Warehouse } from 'lucide-react';

export type EventType = 
  | 'activity' 
  | 'order' 
  | 'delivery' 
  | 'proposal' 
  | 'sales_invoice' 
  | 'purchase_invoice' 
  | 'vendor_invoice'
  | 'work_order' 
  | 'service_request' 
  | 'service_slip'
  | 'opportunity' 
  | 'payment' 
  | 'expense' 
  | 'check' 
  | 'purchase_order' 
  | 'purchase_request'
  | 'grn'
  | 'rfq'
  | 'inventory_transaction'
  | 'employee_leave' 
  | 'vehicle_maintenance' 
  | 'vehicle_document' 
  | 'vehicle_incident' 
  | 'event';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: EventType;
    data: any;
    color: string;
  };
}

export interface EventTypeFilter {
  label: string;
  color: string;
  icon: any;
  enabled: boolean;
}

export const DEFAULT_EVENT_FILTERS: Record<EventType, EventTypeFilter> = {
  activity: { label: 'Aktiviteler', color: '#ef4444', icon: Activity, enabled: true },
  order: { label: 'Siparişler', color: '#3b82f6', icon: ShoppingCart, enabled: true },
  delivery: { label: 'Teslimatlar', color: '#8b5cf6', icon: Truck, enabled: true },
  proposal: { label: 'Teklifler', color: '#06b6d4', icon: FileText, enabled: true },
  sales_invoice: { label: 'Satış Faturaları', color: '#10b981', icon: Receipt, enabled: true },
  purchase_invoice: { label: 'Satın Alma Faturaları', color: '#f59e0b', icon: Receipt, enabled: true },
  vendor_invoice: { label: 'Tedarikçi Faturaları', color: '#f97316', icon: Receipt, enabled: true },
  work_order: { label: 'İş Emirleri', color: '#8b5cf6', icon: Wrench, enabled: true },
  service_request: { label: 'Hizmet Talepleri', color: '#ec4899', icon: Wrench, enabled: true },
  service_slip: { label: 'Hizmet Fişleri', color: '#be185d', icon: FileCheck, enabled: true },
  opportunity: { label: 'Fırsatlar', color: '#6366f1', icon: Target, enabled: true },
  payment: { label: 'Ödemeler', color: '#22c55e', icon: DollarSign, enabled: true },
  expense: { label: 'Giderler', color: '#ef4444', icon: DollarSign, enabled: true },
  check: { label: 'Çekler', color: '#f97316', icon: CreditCard, enabled: true },
  purchase_order: { label: 'Satın Alma Siparişleri', color: '#14b8a6', icon: ShoppingCart, enabled: true },
  purchase_request: { label: 'Satın Alma Talepleri', color: '#06b6d4', icon: ClipboardList, enabled: true },
  grn: { label: 'Mal Kabul Fişleri', color: '#10b981', icon: Package, enabled: true },
  rfq: { label: 'Teklif Talepleri', color: '#3b82f6', icon: FileText, enabled: true },
  inventory_transaction: { label: 'Stok Hareketleri', color: '#64748b', icon: Warehouse, enabled: true },
  employee_leave: { label: 'İzinler', color: '#a855f7', icon: CalendarDays, enabled: true },
  vehicle_maintenance: { label: 'Araç Bakımları', color: '#eab308', icon: Car, enabled: true },
  vehicle_document: { label: 'Araç Belgeleri', color: '#64748b', icon: FileText, enabled: true },
  vehicle_incident: { label: 'Araç Kazaları', color: '#dc2626', icon: Car, enabled: true },
  event: { label: 'Etkinlikler', color: '#0ea5e9', icon: CalendarDays, enabled: true },
};

