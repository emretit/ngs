import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export const useDashboardWidgets = () => {
  const { userData } = useCurrentUser();

  // Get current month start and end dates
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Monthly Turnover Query
  const { data: monthlyTurnover, isLoading: isMonthlyTurnoverLoading } = useQuery({
    queryKey: ['dashboard-monthly-turnover', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;

      const { data, error } = await supabase
        .from('sales_invoices')
        .select('toplam_tutar')
        .eq('company_id', userData.company_id)
        .eq('durum', 'onaylandi')
        .gte('fatura_tarihi', currentMonthStart)
        .lte('fatura_tarihi', currentMonthEnd);

      if (error) throw error;
      return data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Monthly Expenses Query
  const { data: monthlyExpenses, isLoading: isMonthlyExpensesLoading } = useQuery({
    queryKey: ['dashboard-monthly-expenses', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('company_id', userData.company_id)
        .eq('type', 'expense')
        .gte('date', currentMonthStart)
        .lte('date', currentMonthEnd);

      if (error) throw error;
      return data?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Stock Value Query
  const { data: stockValue, isLoading: isStockValueLoading } = useQuery({
    queryKey: ['dashboard-stock-value', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;

      // Calculate from warehouse_stock (quantity * unit_price from products)
      const { data: warehouseStock, error: wsError } = await supabase
        .from('warehouse_stock')
        .select(`
          quantity,
          product_id,
          products!inner(price, purchase_price)
        `)
        .eq('company_id', userData.company_id);

      if (wsError) throw wsError;

      // If warehouse_stock has data, use it
      if (warehouseStock && warehouseStock.length > 0) {
        return warehouseStock.reduce((sum, ws) => {
          const price = Number((ws.products as any)?.purchase_price || (ws.products as any)?.price || 0);
          return sum + (Number(ws.quantity) || 0) * price;
        }, 0);
      }

      // Fallback: calculate from products table
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('stock_quantity, purchase_price, price')
        .eq('company_id', userData.company_id)
        .eq('is_active', true);

      if (productsError) throw productsError;
      
      return products?.reduce((sum, p) => {
        const price = Number(p.purchase_price || p.price || 0);
        return sum + (Number(p.stock_quantity) || 0) * price;
      }, 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Assets Query
  const { data: assets, isLoading: isAssetsLoading } = useQuery({
    queryKey: ['dashboard-assets', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;

      const [bankAccounts, cashAccounts, customers, checks] = await Promise.all([
        supabase.from('bank_accounts').select('current_balance').eq('company_id', userData.company_id),
        supabase.from('cash_accounts').select('current_balance').eq('company_id', userData.company_id),
        supabase.from('customers').select('balance').eq('company_id', userData.company_id),
        supabase.from('checks').select('amount').eq('company_id', userData.company_id).eq('check_type', 'incoming').in('status', ['odenecek', 'tahsilat_bekleniyor', 'portfoyde'])
      ]);

      const bank = bankAccounts.data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const cash = cashAccounts.data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const receivables = customers.data?.reduce((sum, c) => sum + (Number(c.balance) || 0), 0) || 0;
      const checksAmount = checks.data?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

      return {
        bank,
        cash,
        receivables,
        checks: checksAmount,
        stock: stockValue || 0,
        total: bank + cash + receivables + checksAmount + (stockValue || 0)
      };
    },
    enabled: !!userData?.company_id && stockValue !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Liabilities Query
  const { data: liabilities, isLoading: isLiabilitiesLoading } = useQuery({
    queryKey: ['dashboard-liabilities', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;

      const [suppliers, creditCards, loans, einvoices] = await Promise.all([
        supabase.from('suppliers').select('balance').eq('company_id', userData.company_id),
        supabase.from('credit_cards').select('current_balance').eq('company_id', userData.company_id).eq('is_active', true),
        supabase.from('loans').select('remaining_debt').eq('company_id', userData.company_id).eq('status', 'odenecek'),
        supabase.from('einvoices').select('remaining_amount').eq('company_id', userData.company_id).in('status', ['pending', 'partially_paid'])
      ]);

      const payables = suppliers.data?.reduce((sum, s) => sum + (Number(s.balance) || 0), 0) || 0;
      const creditCardDebt = creditCards.data?.reduce((sum, cc) => sum + (Number(cc.current_balance) || 0), 0) || 0;
      const loansDebt = loans.data?.reduce((sum, l) => sum + (Number(l.remaining_debt) || 0), 0) || 0;
      const einvoicesDebt = einvoices.data?.reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0) || 0;

      return {
        payables,
        creditCards: creditCardDebt,
        loans: loansDebt,
        einvoices: einvoicesDebt,
        total: payables + creditCardDebt + loansDebt + einvoicesDebt
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Overdue Receivables Query
  const { data: overdueReceivables, isLoading: isOverdueReceivablesLoading } = useQuery({
    queryKey: ['dashboard-overdue-receivables', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('id, fatura_no, toplam_tutar, odenen_tutar, vade_tarihi, customers(name, company)')
        .eq('company_id', userData.company_id)
        .eq('odeme_durumu', 'odenmedi')
        .lt('vade_tarihi', today)
        .order('vade_tarihi', { ascending: true })
        .limit(10);

      if (error) throw error;

      return (data || []).map(inv => {
        const customer = inv.customers as any;
        const daysOverdue = Math.floor((new Date().getTime() - new Date(inv.vade_tarihi).getTime()) / (1000 * 60 * 60 * 24));
        const remaining = Number(inv.toplam_tutar) - Number(inv.odenen_tutar);

        return {
          id: inv.id,
          invoiceNumber: inv.fatura_no,
          customerName: customer?.name || customer?.company || 'Bilinmeyen',
          amount: remaining,
          daysOverdue
        };
      });
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Upcoming Checks Query
  const { data: upcomingChecks, isLoading: isUpcomingChecksLoading } = useQuery({
    queryKey: ['dashboard-upcoming-checks', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const today = new Date().toISOString().split('T')[0];
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      const next30DaysStr = next30Days.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('checks')
        .select('id, check_number, amount, due_date, issuer_name, payee, status')
        .eq('company_id', userData.company_id)
        .in('check_type', ['incoming', 'outgoing'])
        .in('status', ['odenecek', 'tahsilat_bekleniyor', 'portfoyde'])
        .gte('due_date', today)
        .lte('due_date', next30DaysStr)
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      return (data || []).map(check => ({
        id: check.id,
        checkNumber: check.check_number,
        amount: Number(check.amount) || 0,
        dueDate: check.due_date,
        issuerName: check.issuer_name || check.payee || 'Bilinmeyen',
        status: check.status
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Incoming E-Invoices Query
  const { data: incomingEInvoices, isLoading: isIncomingEInvoicesLoading } = useQuery({
    queryKey: ['dashboard-incoming-einvoices', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('veriban_incoming_invoices')
        .select('id, invoice_number, customer_title, payable_amount, issue_time, currency_code')
        .eq('company_id', userData.company_id)
        .eq('is_read', false)
        .order('issue_time', { ascending: false })
        .limit(10);

      if (error) {
        // Fallback to einvoices_received
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('einvoices_received')
          .select('id, invoice_id, supplier_name, total_amount, invoice_date, currency')
          .eq('company_id', userData.company_id)
          .order('invoice_date', { ascending: false })
          .limit(10);

        if (fallbackError) throw fallbackError;

        return (fallbackData || []).map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoice_id || 'N/A',
          supplierName: inv.supplier_name || 'Bilinmeyen',
          amount: Number(inv.total_amount) || 0,
          date: inv.invoice_date,
          currency: inv.currency || 'TRY'
        }));
      }

      return (data || []).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number || 'N/A',
        supplierName: inv.customer_title || 'Bilinmeyen',
        amount: Number(inv.payable_amount) || 0,
        date: inv.issue_time?.split('T')[0] || new Date().toISOString().split('T')[0],
        currency: inv.currency_code || 'TRY'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Upcoming Expenses Query
  const { data: upcomingExpenses, isLoading: isUpcomingExpensesLoading } = useQuery({
    queryKey: ['dashboard-upcoming-expenses', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const today = new Date().toISOString().split('T')[0];
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      const next30DaysStr = next30Days.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, date, description, category_id, cashflow_categories(name)')
        .eq('company_id', userData.company_id)
        .eq('type', 'expense')
        .eq('is_paid', false)
        .gte('date', today)
        .lte('date', next30DaysStr)
        .order('date', { ascending: true })
        .limit(10);

      if (error) throw error;

      return (data || []).map(exp => {
        const category = exp.cashflow_categories as any;
        return {
          id: exp.id,
          amount: Number(exp.amount) || 0,
          date: exp.date,
          description: exp.description || category?.name || 'Masraf',
          category: category?.name || 'Genel'
        };
      });
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // CRM: Aktif Fırsatlar
  const { data: activeOpportunities, isLoading: isActiveOpportunitiesLoading } = useQuery({
    queryKey: ['dashboard-active-opportunities', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, value, currency, status, expected_close_date, customers(name, company)')
        .eq('company_id', userData.company_id)
        .in('status', ['open', 'in_progress'])
        .order('expected_close_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(opp => ({
        id: opp.id,
        title: opp.title,
        value: Number(opp.value) || 0,
        currency: opp.currency || 'TRY',
        status: opp.status,
        expectedCloseDate: opp.expected_close_date,
        customerName: (opp.customers as any)?.name || (opp.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // CRM: Bekleyen Teklifler
  const { data: pendingProposals, isLoading: isPendingProposalsLoading } = useQuery({
    queryKey: ['dashboard-pending-proposals', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('proposals')
        .select('id, number, title, total_amount, currency, status, valid_until, customers(name, company)')
        .eq('company_id', userData.company_id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(prop => ({
        id: prop.id,
        number: prop.number,
        title: prop.title,
        totalAmount: Number(prop.total_amount) || 0,
        currency: prop.currency || 'TRY',
        validUntil: prop.valid_until,
        customerName: (prop.customers as any)?.name || (prop.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Bugünkü Satış
  const { data: todaySales, isLoading: isTodaySalesLoading } = useQuery({
    queryKey: ['dashboard-today-sales', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('toplam_tutar')
        .eq('company_id', userData.company_id)
        .eq('durum', 'onaylandi')
        .eq('fatura_tarihi', today);
      if (error) throw error;
      return data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Bekleyen Siparişler
  const { data: pendingOrders, isLoading: isPendingOrdersLoading } = useQuery({
    queryKey: ['dashboard-pending-orders', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, title, total_amount, currency, status, expected_delivery_date, customers(name, company)')
        .eq('company_id', userData.company_id)
        .in('status', ['pending', 'confirmed', 'processing'])
        .order('order_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        title: order.title,
        totalAmount: Number(order.total_amount) || 0,
        currency: order.currency || 'TRY',
        status: order.status,
        expectedDeliveryDate: order.expected_delivery_date,
        customerName: (order.customers as any)?.name || (order.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Bekleyen Teslimatlar
  const { data: pendingDeliveries, isLoading: isPendingDeliveriesLoading } = useQuery({
    queryKey: ['dashboard-pending-deliveries', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_number, status, planned_delivery_date, customers(name, company)')
        .eq('company_id', userData.company_id)
        .in('status', ['pending', 'prepared', 'shipped'])
        .order('planned_delivery_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(del => ({
        id: del.id,
        deliveryNumber: del.delivery_number,
        status: del.status,
        plannedDeliveryDate: del.planned_delivery_date,
        customerName: (del.customers as any)?.name || (del.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satın Alma: Bekleyen Satın Alma Talepleri
  const { data: pendingPurchaseRequests, isLoading: isPendingPurchaseRequestsLoading } = useQuery({
    queryKey: ['dashboard-pending-purchase-requests', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('id, request_number, title, total_budget, status, needed_by_date')
        .eq('company_id', userData.company_id)
        .in('status', ['draft', 'pending', 'approved'])
        .order('requested_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(pr => ({
        id: pr.id,
        requestNumber: pr.request_number,
        title: pr.title,
        totalBudget: Number(pr.total_budget) || 0,
        status: pr.status,
        neededByDate: pr.needed_by_date
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satın Alma: Onay Bekleyen Satın Alma Siparişleri
  const { data: pendingPurchaseOrders, isLoading: isPendingPurchaseOrdersLoading } = useQuery({
    queryKey: ['dashboard-pending-purchase-orders', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, order_number, total_amount, currency, status, expected_delivery_date, suppliers(name)')
        .eq('company_id', userData.company_id)
        .in('status', ['draft', 'pending'])
        .order('order_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(po => ({
        id: po.id,
        orderNumber: po.order_number,
        totalAmount: Number(po.total_amount) || 0,
        currency: po.currency || 'TRY',
        status: po.status,
        expectedDeliveryDate: po.expected_delivery_date,
        supplierName: (po.suppliers as any)?.name || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Stok: Düşük Stok Uyarıları
  const { data: lowStockItems, isLoading: isLowStockItemsLoading } = useQuery({
    queryKey: ['dashboard-low-stock', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, min_stock_level, purchase_price, price')
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .filter('stock_quantity', 'lt', supabase.raw('min_stock_level'))
        .order('stock_quantity', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockQuantity: Number(product.stock_quantity) || 0,
        minStockLevel: Number(product.min_stock_level) || 0,
        purchasePrice: Number(product.purchase_price || product.price) || 0
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Servis: Aktif Servis Talepleri
  const { data: activeServiceRequests, isLoading: isActiveServiceRequestsLoading } = useQuery({
    queryKey: ['dashboard-active-service-requests', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select('id, service_number, service_title, service_status, service_priority, service_due_date, customers(name, company)')
        .eq('company_id', userData.company_id)
        .in('service_status', ['new', 'assigned', 'in_progress'])
        .order('service_due_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(sr => ({
        id: sr.id,
        serviceNumber: sr.service_number,
        serviceTitle: sr.service_title,
        status: sr.service_status,
        priority: sr.service_priority,
        dueDate: sr.service_due_date,
        customerName: (sr.customers as any)?.name || (sr.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Servis: Bekleyen İş Emirleri
  const { data: pendingWorkOrders, isLoading: isPendingWorkOrdersLoading } = useQuery({
    queryKey: ['dashboard-pending-work-orders', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, code, title, status, priority, scheduled_start, customers(name, company)')
        .eq('company_id', userData.company_id)
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_start', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(wo => ({
        id: wo.id,
        code: wo.code,
        title: wo.title,
        status: wo.status,
        priority: wo.priority,
        scheduledStart: wo.scheduled_start,
        customerName: (wo.customers as any)?.name || (wo.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Araç: Yaklaşan Bakımlar
  const { data: upcomingMaintenances, isLoading: isUpcomingMaintenancesLoading } = useQuery({
    queryKey: ['dashboard-upcoming-maintenances', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const today = new Date().toISOString().split('T')[0];
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      const next30DaysStr = next30Days.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('id, maintenance_type, description, maintenance_date, cost, status, vehicles(plate_number, brand, model)')
        .eq('company_id', userData.company_id)
        .in('status', ['planlandı', 'devam_ediyor'])
        .gte('maintenance_date', today)
        .lte('maintenance_date', next30DaysStr)
        .order('maintenance_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(maint => ({
        id: maint.id,
        maintenanceType: maint.maintenance_type,
        description: maint.description,
        maintenanceDate: maint.maintenance_date,
        cost: Number(maint.cost) || 0,
        status: maint.status,
        vehicle: (maint.vehicles as any) ? `${(maint.vehicles as any).plate_number} - ${(maint.vehicles as any).brand} ${(maint.vehicles as any).model}` : 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Toplam Müşteri Sayısı
  const { data: totalCustomers, isLoading: isTotalCustomersLoading } = useQuery({
    queryKey: ['dashboard-total-customers', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return { total: 0, active: 0 };
      const { data, error } = await supabase
        .from('customers')
        .select('id, status, is_active')
        .eq('company_id', userData.company_id);
      if (error) throw error;
      const total = data?.length || 0;
      const active = data?.filter(c => c.status === 'aktif' || c.is_active === true).length || 0;
      return { total, active };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Önceki Ay Satışı (Trend için)
  const { data: previousMonthSales, isLoading: isPreviousMonthSalesLoading } = useQuery({
    queryKey: ['dashboard-previous-month-sales', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const now = new Date();
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('toplam_tutar')
        .eq('company_id', userData.company_id)
        .eq('durum', 'onaylandi')
        .gte('fatura_tarihi', previousMonthStart)
        .lte('fatura_tarihi', previousMonthEnd);
      if (error) throw error;
      return data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Toplam Alacaklar (Ödenmemiş Faturalar)
  const { data: totalReceivables, isLoading: isTotalReceivablesLoading } = useQuery({
    queryKey: ['dashboard-total-receivables', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      // Müşterilerin toplam alacağını hesapla (sadece pozitif bakiyeler)
      const { data, error } = await supabase
        .from('customers')
        .select('balance')
        .eq('company_id', userData.company_id);
      if (error) throw error;
      return data?.reduce((sum, customer) => {
        const balance = Number(customer.balance) || 0;
        // Sadece pozitif bakiyeleri topla (alacak = pozitif bakiye)
        return sum + (balance > 0 ? balance : 0);
      }, 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: Satış Fırsatları Toplam Değeri
  const { data: opportunitiesValue, isLoading: isOpportunitiesValueLoading } = useQuery({
    queryKey: ['dashboard-opportunities-value', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return { totalValue: 0, count: 0 };
      const { data, error } = await supabase
        .from('opportunities')
        .select('value, currency')
        .eq('company_id', userData.company_id)
        .in('status', ['open', 'in_progress']);
      if (error) throw error;
      const totalValue = data?.reduce((sum, opp) => sum + (Number(opp.value) || 0), 0) || 0;
      const count = data?.length || 0;
      return { totalValue, count };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  // Satış: En Çok Satan Ürünler
  const { data: topSellingProducts, isLoading: isTopSellingProductsLoading } = useQuery({
    queryKey: ['dashboard-top-selling-products', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('sales_invoice_items')
        .select('product_id, urun_adi, miktar, satir_toplami, products(id, name)')
        .eq('company_id', userData.company_id);
      if (error) throw error;

      // Group by product
      const productMap = new Map<string, { id: string; name: string; totalSales: number; quantity: number }>();
      (data || []).forEach((item: any) => {
        const productId = item.product_id || 'unknown';
        const productName = item.products?.name || item.urun_adi || 'Bilinmeyen Ürün';
        const quantity = Number(item.miktar) || 0;
        const sales = Number(item.satir_toplami) || 0;

        const existing = productMap.get(productId) || { id: productId, name: productName, totalSales: 0, quantity: 0 };
        productMap.set(productId, {
          id: productId,
          name: productName,
          totalSales: existing.totalSales + sales,
          quantity: existing.quantity + quantity
        });
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    monthlyTurnover: monthlyTurnover || 0,
    monthlyExpenses: monthlyExpenses || 0,
    stockValue: stockValue || 0,
    assets,
    liabilities,
    overdueReceivables: overdueReceivables || [],
    upcomingChecks: upcomingChecks || [],
    incomingEInvoices: incomingEInvoices || [],
    upcomingExpenses: upcomingExpenses || [],
    // CRM
    activeOpportunities: activeOpportunities || [],
    pendingProposals: pendingProposals || [],
    // Satış
    todaySales: todaySales || 0,
    pendingOrders: pendingOrders || [],
    pendingDeliveries: pendingDeliveries || [],
    // Satın Alma
    pendingPurchaseRequests: pendingPurchaseRequests || [],
    pendingPurchaseOrders: pendingPurchaseOrders || [],
    // Stok
    lowStockItems: lowStockItems || [],
    // Servis
    activeServiceRequests: activeServiceRequests || [],
    pendingWorkOrders: pendingWorkOrders || [],
    // Araç
    upcomingMaintenances: upcomingMaintenances || [],
    // Yeni Satış Metrikleri
    totalCustomers: totalCustomers?.total || 0,
    activeCustomers: totalCustomers?.active || 0,
    previousMonthSales: previousMonthSales || 0,
    totalReceivables: totalReceivables || 0,
    opportunitiesValue: opportunitiesValue?.totalValue || 0,
    opportunitiesCount: opportunitiesValue?.count || 0,
    topSellingProducts: topSellingProducts || [],
    // Individual loading states
    isAssetsLoading,
    isLiabilitiesLoading,
    isLoading: isMonthlyTurnoverLoading || isMonthlyExpensesLoading || isStockValueLoading || 
                isAssetsLoading || isLiabilitiesLoading || isOverdueReceivablesLoading || 
                isUpcomingChecksLoading || isIncomingEInvoicesLoading || isUpcomingExpensesLoading ||
                isActiveOpportunitiesLoading || isPendingProposalsLoading || isTodaySalesLoading ||
                isPendingOrdersLoading || isPendingDeliveriesLoading || isPendingPurchaseRequestsLoading ||
                isPendingPurchaseOrdersLoading || isLowStockItemsLoading || isActiveServiceRequestsLoading ||
                isPendingWorkOrdersLoading || isUpcomingMaintenancesLoading || isTotalCustomersLoading ||
                isPreviousMonthSalesLoading || isTotalReceivablesLoading || isOpportunitiesValueLoading ||
                isTopSellingProductsLoading
  };
};

