
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatCurrencyValue, convertCurrency } from "../utils/currencyUtils";

export const useProductSearchDialog = (
  open: boolean,
  initialSelectedProduct: Product | null = null
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [selectedDepo, setSelectedDepo] = useState("Ana Depo");
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
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        // Önce kullanıcının company_id'sini al
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user?.id)
          .single();

        const companyId = profile?.company_id;

        const { data, error } = await supabase
          .from("products")
          .select("*, product_categories(*)")
          .order("name");
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return [];
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    // Ensure currency is not empty to avoid Intl.NumberFormat errors
    if (!currency) currency = "TRY";
    return formatCurrencyValue(amount, currency);
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setCustomPrice(product.price);
    setQuantity(1);
    setDiscountRate(0);
    setDetailsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice(undefined);
    setDiscountRate(0);
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
