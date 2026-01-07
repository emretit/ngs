import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Fuse from "fuse.js";
import { useMemo, useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: "Müşteri" | "Çalışan" | "Teklif" | "Ürün" | "Görev" | "Sipariş" | "Fırsat" | "Tedarikçi" | "Satış Faturası" | "Satın Alma Faturası" | "Teslimat" | "Satın Alma Siparişi" | "Araç";
  url: string;
}

interface SearchData {
  customers: any[];
  employees: any[];
  proposals: any[];
  products: any[];
  activities: any[];
  orders: any[];
  opportunities: any[];
  suppliers: any[];
  salesInvoices: any[];
  purchaseInvoices: any[];
  deliveries: any[];
  purchaseOrders: any[];
  vehicles: any[];
}

export const useGlobalSearch = (query: string) => {
  // Get current user and company_id
  const { userData, loading: userLoading } = useCurrentUser();
  const companyId = userData?.company_id;

  // Debounced query state - wait 300ms after user stops typing
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Only fetch data when query is at least 3 characters
  const shouldFetch = debouncedQuery.length >= 3;

  // Fetch all searchable data with company filter - LAZY LOADED
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ["global-search-data", companyId, debouncedQuery],
    queryFn: async () => {
      try {
        if (!companyId) {
          console.warn('No company_id found for user');
          return {
            customers: [],
            employees: [],
            proposals: [],
            products: [],
            activities: [],
            orders: [],
            opportunities: [],
            suppliers: [],
            salesInvoices: [],
            purchaseInvoices: [],
            deliveries: [],
            purchaseOrders: [],
            vehicles: [],
          };
        }

        // Core business entities - En çok kullanılan kategoriler
        const [
          customersResult, 
          employeesResult, 
          proposalsResult, 
          productsResult, 
          activitiesResult,
          ordersResult,
          opportunitiesResult,
          suppliersResult,
          salesInvoicesResult,
          purchaseInvoicesResult,
          deliveriesResult,
          purchaseOrdersResult,
          vehiclesResult,
        ] = await Promise.all([
          supabase.from("customers").select("id, name, email, office_phone, company").limit(100),
          supabase.from("employees").select("id, first_name, last_name, email, phone, position").limit(100),
          supabase.from("proposals").select("id, title, number, customer_id, customer:customer_id(name)").limit(100),
          supabase.from("products").select("id, name, sku, barcode, description").limit(100),
          supabase.from("activities").select("id, title, description, type, status, assignee_id, employee:assignee_id(first_name, last_name)").limit(100),
          supabase.from("orders").select("id, order_number, title, status, customer_id, customer:customer_id(name)").limit(100),
          supabase.from("opportunities").select("id, title, status, value, customer_id, customer:customer_id(name)").limit(100),
          supabase.from("suppliers").select("id, name, email, company, office_phone").limit(100),
          supabase.from("sales_invoices").select("id, fatura_no, customer_id, toplam_tutar, customer:customer_id(name)").limit(100),
          supabase.from("purchase_invoices").select("id, invoice_number, supplier_id, total_amount, supplier:supplier_id(name)").limit(100),
          supabase.from("deliveries").select("id, delivery_number, customer_id, status, customer:customer_id(name)").limit(100),
          supabase.from("purchase_orders").select("id, order_number, supplier_id, status, supplier:supplier_id(name)").limit(100),
          supabase.from("vehicles").select("id, plate_number, brand, model").limit(100),
        ]);

        // Check for errors in each query (log but don't fail)
        const queries = [
          { name: 'customers', result: customersResult },
          { name: 'employees', result: employeesResult },
          { name: 'proposals', result: proposalsResult },
          { name: 'products', result: productsResult },
          { name: 'activities', result: activitiesResult },
          { name: 'orders', result: ordersResult },
          { name: 'opportunities', result: opportunitiesResult },
          { name: 'suppliers', result: suppliersResult },
          { name: 'salesInvoices', result: salesInvoicesResult },
          { name: 'purchaseInvoices', result: purchaseInvoicesResult },
          { name: 'deliveries', result: deliveriesResult },
          { name: 'purchaseOrders', result: purchaseOrdersResult },
          { name: 'vehicles', result: vehiclesResult },
        ];

        queries.forEach(({ name, result }) => {
          if (result.error) {
            console.error(`${name} fetch error:`, result.error);
          }
        });

        return {
          customers: customersResult.data || [],
          employees: employeesResult.data || [],
          proposals: proposalsResult.data || [],
          products: productsResult.data || [],
          activities: activitiesResult.data || [],
          orders: ordersResult.data || [],
          opportunities: opportunitiesResult.data || [],
          suppliers: suppliersResult.data || [],
          salesInvoices: salesInvoicesResult.data || [],
          purchaseInvoices: purchaseInvoicesResult.data || [],
          deliveries: deliveriesResult.data || [],
          purchaseOrders: purchaseOrdersResult.data || [],
          vehicles: vehiclesResult.data || [],
        } as SearchData;
      } catch (error) {
        console.error('Error in global search query:', error);
        // Return empty data on error to prevent UI breaking
        return {
          customers: [],
          employees: [],
          proposals: [],
          products: [],
          activities: [],
          orders: [],
          opportunities: [],
          suppliers: [],
          salesInvoices: [],
          purchaseInvoices: [],
          deliveries: [],
          purchaseOrders: [],
          vehicles: [],
        };
      }
    },
    enabled: !!companyId && !userLoading && shouldFetch, // LAZY: Only fetch when query >= 3 chars
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
  });

  // Perform fuzzy search
  const results = useMemo(() => {
    // Don't search if query is too short
    if (!debouncedQuery || !searchData || debouncedQuery.length < 3) return [];

    const allResults: SearchResult[] = [];

    // Search customers
    if (searchData.customers.length > 0) {
      const customerFuse = new Fuse(searchData.customers, {
        keys: ["name", "email", "office_phone", "company"],
        threshold: 0.3,
      });
      const customerResults = customerFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...customerResults.map((result) => ({
          id: result.item.id,
          title: result.item.name,
          subtitle: result.item.company || result.item.email,
          category: "Müşteri" as const,
          url: `/customers/${result.item.id}`,
        }))
      );
    }

    // Search employees
    if (searchData.employees.length > 0) {
      const employeeFuse = new Fuse(searchData.employees, {
        keys: ["first_name", "last_name", "email", "phone", "position"],
        threshold: 0.3,
      });
      const employeeResults = employeeFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...employeeResults.map((result) => ({
          id: result.item.id,
          title: `${result.item.first_name} ${result.item.last_name}`,
          subtitle: result.item.position || result.item.email,
          category: "Çalışan" as const,
          url: `/employees/${result.item.id}`,
        }))
      );
    }

    // Search proposals
    if (searchData.proposals.length > 0) {
      const proposalFuse = new Fuse(searchData.proposals, {
        keys: ["title", "number", "customer.name"],
        threshold: 0.3,
      });
      const proposalResults = proposalFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...proposalResults.map((result) => ({
          id: result.item.id,
          title: result.item.title,
          subtitle: result.item.customer?.name || result.item.number || "Teklif",
          category: "Teklif" as const,
          url: `/proposals/${result.item.id}`,
        }))
      );
    }

    // Search products
    if (searchData.products.length > 0) {
      const productFuse = new Fuse(searchData.products, {
        keys: ["name", "sku", "barcode", "description"],
        threshold: 0.3,
      });
      const productResults = productFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...productResults.map((result) => ({
          id: result.item.id,
          title: result.item.name,
          subtitle: result.item.sku || result.item.barcode || "Ürün",
          category: "Ürün" as const,
          url: `/product-details/${result.item.id}`,
        }))
      );
    }

    // Search activities/tasks
    if (searchData.activities.length > 0) {
      const activityFuse = new Fuse(searchData.activities, {
        keys: ["title", "description", "employee.first_name", "employee.last_name"],
        threshold: 0.3,
      });
      const activityResults = activityFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...activityResults.map((result) => ({
          id: result.item.id,
          title: result.item.title,
          subtitle: result.item.employee ? `${result.item.employee.first_name} ${result.item.employee.last_name}` : (result.item.type || result.item.status),
          category: "Görev" as const,
          url: `/activities?id=${result.item.id}`,
        }))
      );
    }

    // Search orders
    if (searchData.orders.length > 0) {
      const orderFuse = new Fuse(searchData.orders, {
        keys: ["order_number", "title", "customer.name"],
        threshold: 0.3,
      });
      const orderResults = orderFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...orderResults.map((result) => ({
          id: result.item.id,
          title: result.item.title || result.item.order_number,
          subtitle: result.item.customer?.name || `Sipariş #${result.item.order_number || result.item.id.substring(0, 8)}`,
          category: "Sipariş" as const,
          url: `/orders/purchase/edit/${result.item.id}`,
        }))
      );
    }

    // Search opportunities
    if (searchData.opportunities.length > 0) {
      const opportunityFuse = new Fuse(searchData.opportunities, {
        keys: ["title", "customer.name"],
        threshold: 0.3,
      });
      const opportunityResults = opportunityFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...opportunityResults.map((result) => ({
          id: result.item.id,
          title: result.item.title,
          subtitle: result.item.customer?.name || (result.item.status ? `Durum: ${result.item.status}` : "Fırsat"),
          category: "Fırsat" as const,
          url: `/opportunities?opportunityId=${result.item.id}`,
        }))
      );
    }

    // Search suppliers
    if (searchData.suppliers.length > 0) {
      const supplierFuse = new Fuse(searchData.suppliers, {
        keys: ["name", "email", "office_phone", "company"],
        threshold: 0.3,
      });
      const supplierResults = supplierFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...supplierResults.map((result) => ({
          id: result.item.id,
          title: result.item.name || result.item.company,
          subtitle: result.item.company || result.item.email,
          category: "Tedarikçi" as const,
          url: `/suppliers/${result.item.id}`,
        }))
      );
    }

    // Search sales invoices
    if (searchData.salesInvoices.length > 0) {
      const salesInvoiceFuse = new Fuse(searchData.salesInvoices, {
        keys: ["fatura_no", "customer.name"],
        threshold: 0.3,
      });
      const salesInvoiceResults = salesInvoiceFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...salesInvoiceResults.map((result) => ({
          id: result.item.id,
          title: result.item.fatura_no || `Fatura #${result.item.id.substring(0, 8)}`,
          subtitle: result.item.customer?.name || (result.item.toplam_tutar ? `${result.item.toplam_tutar} TRY` : "Satış Faturası"),
          category: "Satış Faturası" as const,
          url: `/sales-invoices/${result.item.id}`,
        }))
      );
    }

    // Search purchase invoices
    if (searchData.purchaseInvoices.length > 0) {
      const purchaseInvoiceFuse = new Fuse(searchData.purchaseInvoices, {
        keys: ["invoice_number", "supplier.name"],
        threshold: 0.3,
      });
      const purchaseInvoiceResults = purchaseInvoiceFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...purchaseInvoiceResults.map((result) => ({
          id: result.item.id,
          title: result.item.invoice_number || `Fatura #${result.item.id.substring(0, 8)}`,
          subtitle: result.item.supplier?.name || (result.item.total_amount ? `${result.item.total_amount} TRY` : "Satın Alma Faturası"),
          category: "Satın Alma Faturası" as const,
          url: `/purchase-invoices`,
        }))
      );
    }

    // Search deliveries
    if (searchData.deliveries.length > 0) {
      const deliveryFuse = new Fuse(searchData.deliveries, {
        keys: ["delivery_number", "customer.name"],
        threshold: 0.3,
      });
      const deliveryResults = deliveryFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...deliveryResults.map((result) => ({
          id: result.item.id,
          title: result.item.delivery_number || `Teslimat #${result.item.id.substring(0, 8)}`,
          subtitle: result.item.customer?.name || result.item.status || "Teslimat",
          category: "Teslimat" as const,
          url: `/deliveries/${result.item.id}`,
        }))
      );
    }

    // Search purchase orders
    if (searchData.purchaseOrders.length > 0) {
      const purchaseOrderFuse = new Fuse(searchData.purchaseOrders, {
        keys: ["order_number", "supplier.name"],
        threshold: 0.3,
      });
      const purchaseOrderResults = purchaseOrderFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...purchaseOrderResults.map((result) => ({
          id: result.item.id,
          title: result.item.order_number || `Sipariş #${result.item.id.substring(0, 8)}`,
          subtitle: result.item.supplier?.name || result.item.status || "Satın Alma Siparişi",
          category: "Satın Alma Siparişi" as const,
          url: `/purchase-orders/${result.item.id}`,
        }))
      );
    }

    // Search vehicles
    if (searchData.vehicles.length > 0) {
      const vehicleFuse = new Fuse(searchData.vehicles, {
        keys: ["plate_number", "brand", "model"],
        threshold: 0.3,
      });
      const vehicleResults = vehicleFuse.search(debouncedQuery).slice(0, 5);
      allResults.push(
        ...vehicleResults.map((result) => ({
          id: result.item.id,
          title: result.item.plate_number || `${result.item.brand} ${result.item.model}`,
          subtitle: result.item.brand && result.item.model ? `${result.item.brand} ${result.item.model}` : "Araç",
          category: "Araç" as const,
          url: `/vehicles/${result.item.id}`,
        }))
      );
    }

    return allResults;
  }, [debouncedQuery, searchData]);

  return {
    results,
    isLoading: isLoading || userLoading, // Include user loading state
    error,
  };
};
