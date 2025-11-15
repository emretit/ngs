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
    // Önce kullanıcının company_id'sini al
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    const companyId = profile?.company_id;

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

    // Apply company filter
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    // Stok filtrelemesi veya sıralaması varsa, önce tüm ürünleri çekip sonra filtreleyip sıralayacağız
    const needsStockFiltering = filters.stock && filters.stock !== "all";
    const needsStockSorting = filters.sortField === "stock_quantity";

    // Eğer stok filtrelemesi veya sıralaması yoksa, normal pagination yapabiliriz
    if (!needsStockFiltering && !needsStockSorting) {
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
        // PGRST103: Range Not Satisfiable - offset istenenden fazla satır var
        // Bu durumda boş sonuç döndür, hata fırlatma
        if (error.code === 'PGRST103' || error.message?.includes('Range Not Satisfiable')) {
          return {
            data: [] as Product[],
            totalCount: count || 0,
            hasNextPage: false
          };
        }
        console.error("Error fetching products:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          data: [] as Product[],
          totalCount: count || 0,
          hasNextPage: false
        };
      }

      // Ürün ID'lerini al
      const productIds = data.map(p => p.id);

      // Warehouse_stock tablosundan toplam stok miktarlarını çek
      let stockQuery = supabase
        .from("warehouse_stock")
        .select("product_id, quantity")
        .in("product_id", productIds);

      if (companyId) {
        stockQuery = stockQuery.eq("company_id", companyId);
      }

      const { data: stockData, error: stockError } = await stockQuery;

      if (stockError) {
        console.error("Error fetching warehouse stock:", stockError);
      }

      // Stok verilerini product_id'ye göre grupla ve topla
      const stockMap = new Map<string, number>();
      if (stockData) {
        stockData.forEach((stock: { product_id: string; quantity: number }) => {
          const current = stockMap.get(stock.product_id) || 0;
          stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
        });
      }

      // Ürünleri stok bilgisiyle güncelle
      const productsWithStock = data.map(product => ({
        ...product,
        stock_quantity: stockMap.get(product.id) || 0
      }));

      return {
        data: productsWithStock as Product[],
        totalCount: count || 0,
        hasNextPage: data.length === pageSize
      };
    }

    // Stok filtrelemesi veya sıralaması varsa, tüm ürünleri çek
    const sortField = filters.sortField || "name";
    const sortDirection = filters.sortDirection || "asc";
    const orderField = sortField === "category" ? "product_categories(name)" : sortField;
    
    // Stok sıralaması değilse, normal sıralama yap
    if (sortField !== "stock_quantity") {
      query = query.order(orderField, { ascending: sortDirection === "asc" });
    }

    const { data: allData, error, count } = await query;

    if (error) {
      // PGRST103: Range Not Satisfiable - offset istenenden fazla satır var
      // Bu durumda boş sonuç döndür, hata fırlatma
      if (error.code === 'PGRST103' || error.message?.includes('Range Not Satisfiable')) {
        return {
          data: [] as Product[],
          totalCount: 0,
          hasNextPage: false
        };
      }
      console.error("Error fetching products:", error);
      throw error;
    }

    if (!allData || allData.length === 0) {
      return {
        data: [] as Product[],
        totalCount: 0,
        hasNextPage: false
      };
    }

    // Tüm ürün ID'lerini al
    const allProductIds = allData.map(p => p.id);

    // Warehouse_stock tablosundan toplam stok miktarlarını çek
    let stockQuery = supabase
      .from("warehouse_stock")
      .select("product_id, quantity")
      .in("product_id", allProductIds);

    if (companyId) {
      stockQuery = stockQuery.eq("company_id", companyId);
    }

    const { data: stockData, error: stockError } = await stockQuery;

    if (stockError) {
      console.error("Error fetching warehouse stock:", stockError);
    }

    // Stok verilerini product_id'ye göre grupla ve topla
    const stockMap = new Map<string, number>();
    if (stockData) {
      stockData.forEach((stock: { product_id: string; quantity: number }) => {
        const current = stockMap.get(stock.product_id) || 0;
        stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
      });
    }

    // Ürünleri stok bilgisiyle güncelle
    let productsWithStock = allData.map(product => ({
      ...product,
      stock_quantity: stockMap.get(product.id) || 0
    }));

    // Stok filtrelemesini uygula
    if (needsStockFiltering) {
      switch (filters.stock) {
        case "out_of_stock":
          productsWithStock = productsWithStock.filter(p => p.stock_quantity === 0);
          break;
        case "low_stock":
          productsWithStock = productsWithStock.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);
          break;
        case "in_stock":
          productsWithStock = productsWithStock.filter(p => p.stock_quantity > 5);
          break;
      }
    }

    // Stok sıralamasını uygula
    if (needsStockSorting) {
      productsWithStock.sort((a, b) => {
        const diff = a.stock_quantity - b.stock_quantity;
        return filters.sortDirection === "asc" ? diff : -diff;
      });
    } else if (sortField !== "stock_quantity") {
      // Diğer sıralamalar zaten SQL'de yapıldı
    }

    // Pagination uygula
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedProducts = productsWithStock.slice(from, to);

    return {
      data: paginatedProducts as Product[],
      totalCount: productsWithStock.length,
      hasNextPage: to < productsWithStock.length
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

