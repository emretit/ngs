import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

interface CalendarDataOptions {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export const useCalendarData = (options: CalendarDataOptions = {}) => {
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();
  
  // Default olarak mevcut ay + önceki/sonraki ay
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = options.startDate || new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = options.endDate || new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [options.startDate, options.endDate]);

  // Ana aktiviteler ve eventler - yüksek öncelikli
  const { data: coreData, isLoading: isLoadingCore } = useQuery({
    queryKey: ["calendar-core-data", userData?.company_id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!userData?.company_id) return { activities: [], opportunities: [], events: [] };
      const client = getClient();
      
      const [activitiesRes, opportunitiesRes, eventsRes] = await Promise.all([
        client
          .from("activities")
          .select(`*, assignee:assignee_id(id, first_name, last_name)`)
          .not("due_date", "is", null)
          .gte("due_date", dateRange.start)
          .lte("due_date", dateRange.end),
        client
          .from("opportunities")
          .select(`*, customer:customers(id, name, company)`)
          .not("expected_close_date", "is", null)
          .gte("expected_close_date", dateRange.start)
          .lte("expected_close_date", dateRange.end),
        client
          .from("events")
          .select("id, company_id, title, description, start_time, end_time, event_type, category, assigned_to, created_at, updated_at")
          .not("start_time", "is", null)
          .gte("start_time", dateRange.start)
          .lte("start_time", dateRange.end)
      ]);

      return {
        activities: activitiesRes.data || [],
        opportunities: opportunitiesRes.data || [],
        events: eventsRes.data || [],
      };
    },
    enabled: !!userData?.company_id && (options.enabled !== false),
    staleTime: 3 * 60 * 1000, // 3 dakika
  });

  // CRM verileri - orta öncelikli
  const { data: crmData, isLoading: isLoadingCRM } = useQuery({
    queryKey: ["calendar-crm-data", userData?.company_id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!userData?.company_id) return { proposals: [], orders: [], deliveries: [] };
      const client = getClient();
      
      const [proposalsRes, ordersRes, deliveriesRes] = await Promise.all([
        client
          .from("proposals")
          .select(`*, customer:customers(id, name, company)`)
          .gte("offer_date", dateRange.start)
          .lte("offer_date", dateRange.end),
        client
          .from("orders")
          .select(`*, customer:customers(id, name, company)`)
          .gte("order_date", dateRange.start)
          .lte("order_date", dateRange.end),
        client
          .from("deliveries")
          .select(`*, customer:customers(id, name, company)`)
          .gte("planned_delivery_date", dateRange.start)
          .lte("planned_delivery_date", dateRange.end)
      ]);

      return {
        proposals: proposalsRes.data || [],
        orders: ordersRes.data || [],
        deliveries: deliveriesRes.data || [],
      };
    },
    enabled: !!userData?.company_id && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  // Finansal veriler - düşük öncelikli, isteğe bağlı
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["calendar-financial-data", userData?.company_id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!userData?.company_id) return { payments: [], expenses: [], checks: [], salesInvoices: [], purchaseInvoices: [] };
      const client = getClient();
      
      const [paymentsRes, expensesRes, checksRes, salesInvoicesRes, purchaseInvoicesRes] = await Promise.all([
        client
          .from("payments")
          .select("id, company_id, amount, currency, payment_date, payment_type, description, customer_id, supplier_id, account_id, created_at, updated_at")
          .not("payment_date", "is", null)
          .gte("payment_date", dateRange.start)
          .lte("payment_date", dateRange.end),
        client
          .from("expenses")
          .select("id, company_id, amount, type, date, category_id, description, payment_account_type, payment_account_id, created_at, updated_at")
          .not("date", "is", null)
          .gte("date", dateRange.start)
          .lte("date", dateRange.end),
        client
          .from("checks")
          .select("id, company_id, amount, due_date, issue_date, check_number, bank, status, notes, issuer_supplier_id, payee_supplier_id, created_at, updated_at")
          .not("due_date", "is", null)
          .gte("due_date", dateRange.start)
          .lte("due_date", dateRange.end),
        client
          .from("sales_invoices")
          .select(`*, customer:customers(id, name, company)`)
          .gte("fatura_tarihi", dateRange.start)
          .lte("fatura_tarihi", dateRange.end),
        client
          .from("purchase_invoices")
          .select(`*, supplier:suppliers(id, name, company)`)
          .gte("invoice_date", dateRange.start)
          .lte("invoice_date", dateRange.end)
      ]);

      return {
        payments: paymentsRes.data || [],
        expenses: expensesRes.data || [],
        checks: checksRes.data || [],
        salesInvoices: salesInvoicesRes.data || [],
        purchaseInvoices: purchaseInvoicesRes.data || [],
      };
    },
    enabled: !!userData?.company_id && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // 10 dakika - daha az güncellenir
  });

  // Operasyonel veriler - lazy load
  const { data: operationalData, isLoading: isLoadingOperational } = useQuery({
    queryKey: ["calendar-operational-data", userData?.company_id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!userData?.company_id) return { 
        workOrders: [], serviceRequests: [], purchaseOrders: [], 
        employeeLeaves: [], grns: [], rfqs: [], purchaseRequests: [],
        inventoryTransactions: []
      };
      const client = getClient();
      
      const [workOrdersRes, serviceRequestsRes, purchaseOrdersRes, employeeLeavesRes, 
             grnsRes, rfqsRes, purchaseRequestsRes, inventoryTransactionsRes] = await Promise.all([
        client
          .from("work_orders")
          .select("id, company_id, title, description, scheduled_start, scheduled_end, status, priority, assigned_to, customer_id, sla_due, created_at, updated_at")
          .gte("scheduled_start", dateRange.start)
          .lte("scheduled_start", dateRange.end),
        client
          .from("service_requests")
          .select(`*, customer:customers(id, name, company)`)
          .gte("service_due_date", dateRange.start)
          .lte("service_due_date", dateRange.end),
        client
          .from("purchase_orders")
          .select(`*, supplier:suppliers(id, name, company)`)
          .gte("order_date", dateRange.start)
          .lte("order_date", dateRange.end),
        client
          .from("employee_leaves")
          .select(`*, employee:employees(id, first_name, last_name)`)
          .gte("start_date", dateRange.start)
          .lte("start_date", dateRange.end),
        client
          .from("grns")
          .select(`*, po:purchase_orders(id, order_number)`)
          .not("received_date", "is", null)
          .gte("received_date", dateRange.start)
          .lte("received_date", dateRange.end),
        client
          .from("rfqs")
          .select("*")
          .not("due_date", "is", null)
          .gte("due_date", dateRange.start)
          .lte("due_date", dateRange.end),
        client
          .from("purchase_requests")
          .select("*")
          .gte("requested_date", dateRange.start)
          .lte("requested_date", dateRange.end),
        client
          .from("inventory_transactions")
          .select("*")
          .not("transaction_date", "is", null)
          .gte("transaction_date", dateRange.start)
          .lte("transaction_date", dateRange.end)
      ]);

      return {
        workOrders: workOrdersRes.data || [],
        serviceRequests: serviceRequestsRes.data || [],
        purchaseOrders: purchaseOrdersRes.data || [],
        employeeLeaves: employeeLeavesRes.data || [],
        grns: grnsRes.data || [],
        rfqs: rfqsRes.data || [],
        purchaseRequests: purchaseRequestsRes.data || [],
        inventoryTransactions: inventoryTransactionsRes.data || [],
      };
    },
    enabled: !!userData?.company_id && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // 10 dakika
  });

  // Araç verileri - çok düşük öncelikli
  const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ["calendar-vehicle-data", userData?.company_id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!userData?.company_id) return { 
        vehicleMaintenance: [], vehicleDocuments: [], vehicleIncidents: [] 
      };
      const client = getClient();
      
      const [maintenanceRes, documentsRes, incidentsRes] = await Promise.all([
        client
          .from("vehicle_maintenance")
          .select(`*, vehicle:vehicles(id, plate_number, brand, model)`)
          .not("maintenance_date", "is", null)
          .gte("maintenance_date", dateRange.start)
          .lte("maintenance_date", dateRange.end),
        client
          .from("vehicle_documents")
          .select(`*, vehicle:vehicles(id, plate_number, brand, model)`)
          .not("expiry_date", "is", null)
          .gte("expiry_date", dateRange.start)
          .lte("expiry_date", dateRange.end),
        client
          .from("vehicle_incidents")
          .select(`*, vehicle:vehicles(id, plate_number, brand, model)`)
          .not("incident_date", "is", null)
          .gte("incident_date", dateRange.start)
          .lte("incident_date", dateRange.end)
      ]);

      return {
        vehicleMaintenance: maintenanceRes.data || [],
        vehicleDocuments: documentsRes.data || [],
        vehicleIncidents: incidentsRes.data || [],
      };
    },
    enabled: !!userData?.company_id && (options.enabled !== false),
    staleTime: 15 * 60 * 1000, // 15 dakika
  });

  const isLoading = isLoadingCore || isLoadingCRM || isLoadingFinancial || isLoadingOperational || isLoadingVehicle;

  return {
    // Core data
    activities: coreData?.activities || [],
    opportunities: coreData?.opportunities || [],
    events: coreData?.events || [],
    
    // CRM data
    proposals: crmData?.proposals || [],
    orders: crmData?.orders || [],
    deliveries: crmData?.deliveries || [],
    
    // Financial data
    payments: financialData?.payments || [],
    expenses: financialData?.expenses || [],
    checks: financialData?.checks || [],
    salesInvoices: financialData?.salesInvoices || [],
    purchaseInvoices: financialData?.purchaseInvoices || [],
    
    // Operational data
    workOrders: operationalData?.workOrders || [],
    serviceRequests: operationalData?.serviceRequests || [],
    purchaseOrders: operationalData?.purchaseOrders || [],
    employeeLeaves: operationalData?.employeeLeaves || [],
    grns: operationalData?.grns || [],
    rfqs: operationalData?.rfqs || [],
    purchaseRequests: operationalData?.purchaseRequests || [],
    inventoryTransactions: operationalData?.inventoryTransactions || [],
    
    // Vehicle data
    vehicleMaintenance: vehicleData?.vehicleMaintenance || [],
    vehicleDocuments: vehicleData?.vehicleDocuments || [],
    vehicleIncidents: vehicleData?.vehicleIncidents || [],
    
    // Deprecated/unused
    vendorInvoices: [],
    serviceSlips: [],
    
    isLoading,
  };
};
