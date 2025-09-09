
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
        const { data, error } = await supabase
          .from("products")
          .select("*, product_categories(*)")
          .order("name");
        
        if (error) throw error;
        
        // Add a suppliers property to each product (null for now)
        return (data || []).map(product => ({
          ...product,
          suppliers: null
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
