import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Fuse from "fuse.js";
import { useMemo } from "react";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: "Müşteri" | "Çalışan" | "Teklif" | "Ürün" | "Görev";
  url: string;
}

interface SearchData {
  customers: any[];
  employees: any[];
  proposals: any[];
  products: any[];
  activities: any[];
}

export const useGlobalSearch = (query: string) => {
  // Fetch all searchable data
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["global-search-data"],
    queryFn: async () => {
      const [customers, employees, proposals, products, activities] = await Promise.all([
        supabase.from("customers").select("id, name, email, office_phone, company").limit(100),
        supabase.from("employees").select("id, full_name, email, phone, position").limit(100),
        supabase.from("proposals").select("id, proposal_number, title, customer_id").limit(100),
        supabase.from("products").select("id, name, product_code, description").limit(100),
        supabase.from("activities").select("id, title, description, type, status").limit(100),
      ]);

      return {
        customers: customers.data || [],
        employees: employees.data || [],
        proposals: proposals.data || [],
        products: products.data || [],
        activities: activities.data || [],
      } as SearchData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
          url: `/contacts?id=${result.item.id}`,
        }))
      );
    }

    // Search employees
    if (searchData.employees.length > 0) {
      const employeeFuse = new Fuse(searchData.employees, {
        keys: ["full_name", "email", "phone", "position"],
        threshold: 0.3,
      });
      const employeeResults = employeeFuse.search(query).slice(0, 5);
      allResults.push(
        ...employeeResults.map((result) => ({
          id: result.item.id,
          title: result.item.full_name,
          subtitle: result.item.position || result.item.email,
          category: "Çalışan" as const,
          url: `/employees?id=${result.item.id}`,
        }))
      );
    }

    // Search proposals
    if (searchData.proposals.length > 0) {
      const proposalFuse = new Fuse(searchData.proposals, {
        keys: ["proposal_number", "title"],
        threshold: 0.3,
      });
      const proposalResults = proposalFuse.search(query).slice(0, 5);
      allResults.push(
        ...proposalResults.map((result) => ({
          id: result.item.id,
          title: result.item.proposal_number || result.item.title,
          subtitle: result.item.title,
          category: "Teklif" as const,
          url: `/proposals?id=${result.item.id}`,
        }))
      );
    }

    // Search products
    if (searchData.products.length > 0) {
      const productFuse = new Fuse(searchData.products, {
        keys: ["name", "product_code", "description"],
        threshold: 0.3,
      });
      const productResults = productFuse.search(query).slice(0, 5);
      allResults.push(
        ...productResults.map((result) => ({
          id: result.item.id,
          title: result.item.name,
          subtitle: result.item.product_code,
          category: "Ürün" as const,
          url: `/products?id=${result.item.id}`,
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

    return allResults;
  }, [query, searchData]);

  return {
    results,
    isLoading,
  };
};
