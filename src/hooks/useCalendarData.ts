import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { handleSupabaseError } from '@/utils/supabaseErrorHandler';

export const useCalendarData = () => {
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();

  // Fetch Activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["calendar-activities", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("activities")
        .select(`
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name
          )
        `)
        .eq("company_id", userData.company_id)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["calendar-orders", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("orders")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("order_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Deliveries
  const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ["calendar-deliveries", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("deliveries")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("planned_delivery_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Proposals
  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ["calendar-proposals", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("proposals")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("offer_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Sales Invoices
  const { data: salesInvoices = [], isLoading: isLoadingSalesInvoices } = useQuery({
    queryKey: ["calendar-sales-invoices", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("sales_invoices")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("fatura_tarihi", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Purchase Invoices
  const { data: purchaseInvoices = [], isLoading: isLoadingPurchaseInvoices } = useQuery({
    queryKey: ["calendar-purchase-invoices", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("purchase_invoices")
        .select(`
          *,
          supplier:suppliers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("invoice_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Work Orders
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } = useQuery({
    queryKey: ["calendar-work-orders", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("work_orders")
        .select("id, company_id, title, description, scheduled_start, scheduled_end, status, priority, assigned_to, customer_id, sla_due, created_at, updated_at")
        .eq("company_id", userData.company_id)
        .order("scheduled_start", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'İş emirleri yükleme', table: 'work_orders' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Service Requests
  const { data: serviceRequests = [], isLoading: isLoadingServiceRequests } = useQuery({
    queryKey: ["calendar-service-requests", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("service_requests")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("service_due_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Hizmet talepleri yükleme', table: 'service_requests' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Opportunities
  const { data: opportunities = [], isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ["calendar-opportunities", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("opportunities")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .not("expected_close_date", "is", null)
        .order("expected_close_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["calendar-payments", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("payments")
        .select("id, company_id, amount, currency, payment_date, payment_type, description, customer_id, supplier_id, account_id, created_at, updated_at")
        .eq("company_id", userData.company_id)
        .not("payment_date", "is", null)
        .order("payment_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Ödemeler yükleme', table: 'payments' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["calendar-expenses", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("expenses")
        .select("id, company_id, amount, type, date, category_id, description, payment_account_type, payment_account_id, created_at, updated_at")
        .eq("company_id", userData.company_id)
        .not("date", "is", null)
        .order("date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Giderler yükleme', table: 'expenses' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Checks
  const { data: checks = [], isLoading: isLoadingChecks } = useQuery({
    queryKey: ["calendar-checks", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("checks")
        .select("id, company_id, amount, due_date, issue_date, check_number, bank, status, notes, issuer_supplier_id, payee_supplier_id, created_at, updated_at")
        .eq("company_id", userData.company_id)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Çekler yükleme', table: 'checks' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Purchase Orders
  const { data: purchaseOrders = [], isLoading: isLoadingPurchaseOrders } = useQuery({
    queryKey: ["calendar-purchase-orders", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("order_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Employee Leaves
  const { data: employeeLeaves = [], isLoading: isLoadingEmployeeLeaves } = useQuery({
    queryKey: ["calendar-employee-leaves", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("employee_leaves")
        .select(`
          *,
          employee:employees(
            id,
            first_name,
            last_name
          )
        `)
        .eq("company_id", userData.company_id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Vehicle Maintenance
  const { data: vehicleMaintenance = [], isLoading: isLoadingVehicleMaintenance } = useQuery({
    queryKey: ["calendar-vehicle-maintenance", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("vehicle_maintenance")
        .select(`
          *,
          vehicle:vehicles(
            id,
            plate_number,
            brand,
            model
          )
        `)
        .eq("company_id", userData.company_id)
        .not("maintenance_date", "is", null)
        .order("maintenance_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Vehicle Documents
  const { data: vehicleDocuments = [], isLoading: isLoadingVehicleDocuments } = useQuery({
    queryKey: ["calendar-vehicle-documents", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("vehicle_documents")
        .select(`
          *,
          vehicle:vehicles(
            id,
            plate_number,
            brand,
            model
          )
        `)
        .eq("company_id", userData.company_id)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Vehicle Incidents
  const { data: vehicleIncidents = [], isLoading: isLoadingVehicleIncidents } = useQuery({
    queryKey: ["calendar-vehicle-incidents", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("vehicle_incidents")
        .select(`
          *,
          vehicle:vehicles(
            id,
            plate_number,
            brand,
            model
          )
        `)
        .eq("company_id", userData.company_id)
        .not("incident_date", "is", null)
        .order("incident_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Events
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["calendar-events", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("events")
        .select("id, company_id, title, description, start_time, end_time, event_type, category, assigned_to, created_at, updated_at")
        .eq("company_id", userData.company_id)
        .not("start_time", "is", null)
        .order("start_time", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Etkinlikler yükleme', table: 'events' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch GRNs
  const { data: grns = [], isLoading: isLoadingGRNs } = useQuery({
    queryKey: ["calendar-grns", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("grns")
        .select(`
          *,
          po:purchase_orders(
            id,
            order_number
          )
        `)
        .eq("company_id", userData.company_id)
        .not("received_date", "is", null)
        .order("received_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Mal kabul fişleri yükleme', table: 'grns' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch RFQs
  const { data: rfqs = [], isLoading: isLoadingRFQs } = useQuery({
    queryKey: ["calendar-rfqs", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("rfqs")
        .select("*")
        .eq("company_id", userData.company_id)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Teklif talepleri yükleme', table: 'rfqs' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Purchase Requests
  const { data: purchaseRequests = [], isLoading: isLoadingPurchaseRequests } = useQuery({
    queryKey: ["calendar-purchase-requests", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("purchase_requests")
        .select("*")
        .eq("company_id", userData.company_id)
        .order("requested_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Satın alma talepleri yükleme', table: 'purchase_requests' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Vendor Invoices
  const { data: vendorInvoices = [], isLoading: isLoadingVendorInvoices } = useQuery({
    queryKey: ["calendar-vendor-invoices", userData?.company_id],
    queryFn: async () => {
      // Tablo mevcut değil, boş array döndür
      return [];
    },
    enabled: false // Tablo mevcut değil, devre dışı
  });

  // Fetch Inventory Transactions
  const { data: inventoryTransactions = [], isLoading: isLoadingInventoryTransactions } = useQuery({
    queryKey: ["calendar-inventory-transactions", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("inventory_transactions")
        .select("*")
        .eq("company_id", userData.company_id)
        .not("transaction_date", "is", null)
        .order("transaction_date", { ascending: true });

      if (error) {
        handleSupabaseError(error, { operation: 'Stok hareketleri yükleme', table: 'inventory_transactions' });
        throw error;
      }
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Service Slips
  const { data: serviceSlips = [], isLoading: isLoadingServiceSlips } = useQuery({
    queryKey: ["calendar-service-slips", userData?.company_id],
    queryFn: async () => {
      // Tablo mevcut değil, boş array döndür
      return [];
    },
    enabled: false // Tablo mevcut değil, devre dışı
  });

  const isLoading = 
    isLoadingActivities || isLoadingOrders || isLoadingDeliveries ||
    isLoadingProposals || isLoadingSalesInvoices || isLoadingPurchaseInvoices ||
    isLoadingWorkOrders || isLoadingServiceRequests || isLoadingOpportunities ||
    isLoadingPayments || isLoadingExpenses || isLoadingChecks || isLoadingPurchaseOrders ||
    isLoadingEmployeeLeaves || isLoadingVehicleMaintenance || isLoadingVehicleDocuments ||
    isLoadingVehicleIncidents || isLoadingEvents || isLoadingGRNs || isLoadingRFQs ||
    isLoadingPurchaseRequests || isLoadingVendorInvoices || isLoadingInventoryTransactions ||
    isLoadingServiceSlips;

  return {
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
    events,
    grns,
    rfqs,
    purchaseRequests,
    vendorInvoices,
    inventoryTransactions,
    serviceSlips,
    isLoading,
  };
};

