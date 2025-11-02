import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

interface UseProductsFilters {
  search?: string;
  category?: string;
  stock?: string;
  sortField?: "name" | "price" | "stock_quantity" | "category";
  sortDirection?: "asc" | "desc";
}

export const useProductsInfiniteScroll = (filters: UseProductsFilters = {}) => {
  const fetchProducts = async (page: number, pageSize: number) => {
    let query = supabase
      .from("products")
      .select(`
        *,
        product_categories (
          id,
          name
        )
      `, { count: 'exact' });

    // Apply search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    // Apply category filter
    if (filters.category && filters.category !== "all") {
      query = query.eq("category_id", filters.category);
    }

    // Apply stock filter
    if (filters.stock && filters.stock !== "all") {
      switch (filters.stock) {
        case "out_of_stock":
          query = query.eq("stock_quantity", 0);
          break;
        case "low_stock":
          query = query.gt("stock_quantity", 0).lte("stock_quantity", 5);
          break;
        case "in_stock":
          query = query.gt("stock_quantity", 5);
          break;
      }
    }

    // Apply sorting
    const sortField = filters.sortField || "name";
    const sortDirection = filters.sortDirection || "asc";
    const orderField = sortField === "category" ? "product_categories(name)" : sortField;
    query = query.order(orderField, { ascending: sortDirection === "asc" });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }

    return {
      data: data as Product[],
      totalCount: count || 0,
      hasNextPage: data.length === pageSize
    };
  };

  return useInfiniteScroll(
    ["products", JSON.stringify(filters)],
    fetchProducts,
    {
      pageSize: 20,
      enabled: true,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }
  );
};

