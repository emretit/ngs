
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatCurrencyValue, convertCurrency } from "../utils/currencyUtils";

export interface EditingRowValues {
  productId?: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
}

export const useProductSearchDialog = (
  open: boolean,
  initialSelectedProduct: Product | null = null,
  editingRowValues: EditingRowValues | null = null
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [selectedDepo, setSelectedDepo] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  
  // Update selectedProduct when initialSelectedProduct changes or when dialog opens
  useEffect(() => {
    if (open && initialSelectedProduct) {
      setSelectedProduct(initialSelectedProduct);
      setCustomPrice(initialSelectedProduct.price);
      // If we have an initial product, open the details dialog automatically
      setDetailsDialogOpen(true);
    }
  }, [open, initialSelectedProduct]);

  // Fetch products from Supabase
  const { data: userProfile } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return profile;
    },
  });

  const companyId = userProfile?.company_id;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", companyId],
    queryFn: async () => {
      try {
        if (!companyId) {
          return [];
        }

        let query = supabase
          .from("products")
          .select("*, product_categories(*)")
          .order("name");

        // Apply company filter
        if (companyId) {
          query = query.eq("company_id", companyId);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return [];
        }

        // Ürün ID'lerini al
        const productIds = data.map(p => p.id);

        // Warehouse_stock tablosundan toplam stok miktarlarını batch'ler halinde çek
        // URL çok uzun olmasın diye her batch'te maksimum 100 ürün ID'si kullan
        const batchSize = 100;
        const stockMap = new Map<string, number>();
        const totalBatches = Math.ceil(productIds.length / batchSize);

        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, productIds.length);
          const batchIds = productIds.slice(start, end);

          try {
            let stockQuery = supabase
              .from("warehouse_stock")
              .select("product_id, quantity")
              .in("product_id", batchIds);

            if (companyId) {
              stockQuery = stockQuery.eq("company_id", companyId);
            }

            const { data: batchStockData, error: batchStockError } = await stockQuery;

            if (batchStockError) {
              console.error(`Error fetching warehouse stock batch ${i + 1}/${totalBatches}:`, batchStockError);
              // Batch hatası olsa bile devam et
              continue;
            }

            // Stok verilerini product_id'ye göre grupla ve topla
            if (batchStockData) {
              batchStockData.forEach((stock: { product_id: string; quantity: number }) => {
                const current = stockMap.get(stock.product_id) || 0;
                stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
              });
            }
          } catch (error) {
            console.error(`Error in warehouse stock batch ${i + 1}/${totalBatches}:`, error);
            // Hata olsa bile devam et
          }
        }

        // Add a suppliers property to each product (null for now) and update stock_quantity
        return (data || []).map(product => ({
          ...product,
          suppliers: null,
          stock_quantity: stockMap.get(product.id) || 0
        }));
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    // Ensure currency is not empty to avoid Intl.NumberFormat errors
    if (!currency) currency = "TRY";
    return formatCurrencyValue(amount, currency);
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    
    // Eğer seçilen ürün, düzenlenen satırdaki ürünle aynıysa mevcut değerleri kullan
    if (editingRowValues && editingRowValues.productId && product.id === editingRowValues.productId) {
      setQuantity(editingRowValues.quantity);
      setCustomPrice(editingRowValues.unitPrice);
      setDiscountRate(editingRowValues.discountRate);
    } else {
      // Farklı ürün seçildi, varsayılan değerler
      setCustomPrice(product.price);
      setQuantity(1);
      setDiscountRate(0);
    }
    
    setDetailsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice(undefined);
    setDiscountRate(0);
    setSelectedDepo("");
    setDetailsDialogOpen(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedProduct,
    setSelectedProduct,
    openProductDetails,
    quantity,
    setQuantity,
    customPrice,
    setCustomPrice,
    selectedDepo,
    setSelectedDepo,
    discountRate,
    setDiscountRate,
    products,
    isLoading,
    formatCurrency,
    resetForm,
    convertCurrency
  };
};
