import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Fuse from "fuse.js";
import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: "Müşteri" | "Çalışan" | "Teklif" | "Ürün" | "Görev" | "Sipariş" | "Fırsat" | "Tedarikçi";
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
}

export const useGlobalSearch = (query: string) => {
  // Get current user and company_id
  const { userData, loading: userLoading } = useCurrentUser();
  const companyId = userData?.company_id;

  // Fetch all searchable data with company filter
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ["global-search-data", companyId],
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
          };
        }

        // Core business entities - En çok kullanılan 8 kategori
        const [
          customersResult, 
          employeesResult, 
          proposalsResult, 
          productsResult, 
          activitiesResult,
          ordersResult,
          opportunitiesResult,
          suppliersResult,
        ] = await Promise.all([
          supabase.from("customers").select("id, name, email, office_phone, company").eq("company_id", companyId).limit(100),
          supabase.from("employees").select("id, first_name, last_name, email, phone, position").eq("company_id", companyId).limit(100),
          supabase.from("proposals").select("id, title, customer_id").eq("company_id", companyId).limit(100),
          supabase.from("products").select("id, name, sku, description").eq("company_id", companyId).limit(100),
          supabase.from("activities").select("id, title, description, type, status").eq("company_id", companyId).limit(100),
          supabase.from("orders").select("id, order_number, title, status").eq("company_id", companyId).limit(100),
          supabase.from("opportunities").select("id, title, status, value").eq("company_id", companyId).limit(100),
          supabase.from("suppliers").select("id, name, email, company, office_phone").eq("company_id", companyId).limit(100),
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
        };
      }
    },
    enabled: !!companyId && !userLoading, // Only fetch when companyId is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
  });

  // Perform fuzzy search
  const results = useMemo(() => {
    if (!query || !searchData || query.length < 2) return [];

    const allResults: SearchResult[] = [];

    // Search customers
    if (searchData.customers.length > 0) {
      const customerFuse = new Fuse(searchData.customers, {
        keys: ["name", "email", "office_phone", "company"],
        threshold: 0.3,
      });
      const customerResults = customerFuse.search(query).slice(0, 5);
      allResults.push(
        ...customerResults.map((result) => ({
          id: result.item.id,
          title: result.item.name,
          subtitle: result.item.company || result.item.email,
          category: "Müşteri" as const,
          url: `/contacts/${result.item.id}`,
        }))
      );
    }

    // Search employees
    if (searchData.employees.length > 0) {
      const employeeFuse = new Fuse(searchData.employees, {
        keys: ["first_name", "last_name", "email", "phone", "position"],
        threshold: 0.3,
      });
      const employeeResults = employeeFuse.search(query).slice(0, 5);
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
        keys: ["title"],
        threshold: 0.3,
      });
      const proposalResults = proposalFuse.search(query).slice(0, 5);
      allResults.push(
        ...proposalResults.map((result) => ({
          id: result.item.id,
          title: result.item.title,
          subtitle: "Teklif",
          category: "Teklif" as const,
          url: `/proposals/${result.item.id}`,
        }))
      );
    }

    // Search products
    if (searchData.products.length > 0) {
      const productFuse = new Fuse(searchData.products, {
        keys: ["name", "sku", "description"],
        threshold: 0.3,
      });
      const productResults = productFuse.search(query).slice(0, 5);
      allResults.push(
        ...productResults.map((result) => ({
          id: result.item.id,
          title: result.item.name,
          subtitle: result.item.sku,
          category: "Ürün" as const,
          url: `/product-details/${result.item.id}`,
        }))
      );
    }

    // Search activities/tasks
    if (searchData.activities.length > 0) {
      const activityFuse = new Fuse(searchData.activities, {
        keys: ["title", "description"],
        threshold: 0.3,
      });
      const activityResults = activityFuse.search(query).slice(0, 5);
      allResults.push(
        ...activityResults.map((result) => ({
          id: result.item.id,
          title: result.item.title,
          subtitle: result.item.type || result.item.status,
          category: "Görev" as const,
          url: `/activities?id=${result.item.id}`,
        }))
      );
    }

    // Search orders
    if (searchData.orders.length > 0) {
      const orderFuse = new Fuse(searchData.orders, {
        keys: ["order_number", "title"],
        threshold: 0.3,
      });
      const orderResults = orderFuse.search(query).slice(0, 5);
      allResults.push(
        ...orderResults.map((result) => ({
          id: result.item.id,
          title: result.item.title || result.item.order_number,
          subtitle: `Sipariş #${result.item.order_number || result.item.id.substring(0, 8)}`,
          category: "Sipariş" as const,
          url: `/orders/purchase/edit/${result.item.id}`,
        }))
      );
    }

    // Search opportunities
    if (searchData.opportunities.length > 0) {
      const opportunityFuse = new Fuse(searchData.opportunities, {
        keys: ["title"],
        threshold: 0.3,
      });
      const opportunityResults = opportunityFuse.search(query).slice(0, 5);
      allResults.push(
        ...opportunityResults.map((result) => ({
          id: result.item.id,
          title: result.item.title,
          subtitle: result.item.status ? `Durum: ${result.item.status}` : "Fırsat",
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
      const supplierResults = supplierFuse.search(query).slice(0, 5);
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

    return allResults;
  }, [query, searchData]);

  return {
    results,
    isLoading: isLoading || userLoading, // Include user loading state
    error,
  };
};
