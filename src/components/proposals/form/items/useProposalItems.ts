
import { useState, useCallback, useEffect } from "react";
import { useCurrencyManagement } from "./hooks/useCurrencyManagement";
import { ProposalItem } from "@/types/proposal";
import { Product } from "@/types/product";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toastUtils";
import { v4 as uuidv4 } from "uuid";
import { useExchangeRates } from "@/hooks/useExchangeRates";

export const useProposalItems = () => {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [items, setItems] = useState<ProposalItem[]>([]);
  
  // Use dashboard exchange rates
  const dashboardRates = useExchangeRates();
  
  const {
    selectedCurrency,
    setSelectedCurrency,
    exchangeRates,
    currencyOptions,
    formatCurrency,
    getCurrencySymbol,
    handleCurrencyChange
  } = useCurrencyManagement();

  // Listen for currency change events from ProductDetailsDialog
  useEffect(() => {
    const handleCurrencyChangeEvent = (event: CustomEvent) => {
      setSelectedCurrency(event.detail);
    };

    window.addEventListener('currency-change', handleCurrencyChangeEvent as EventListener);
    
    return () => {
      window.removeEventListener('currency-change', handleCurrencyChangeEvent as EventListener);
    };
  }, [setSelectedCurrency]);

  // Fetch products for realtime data with optimized query
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_categories(*)")
          .eq("is_active", true)  // Only select active products
          .order("name");
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        showError("Ürünler yüklenirken bir hata oluştu");
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Handle adding a new item
  const handleAddItem = useCallback(() => {
    const newItem: ProposalItem = {
      id: uuidv4(),
      name: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      total_price: 0,
      currency: selectedCurrency,
    };
    
    setItems(prev => [...prev, newItem]);
    return [...items, newItem];
  }, [selectedCurrency, items]);

  // Handle selecting a product
  const handleSelectProduct = useCallback((product: Product) => {
    // Skip if product is already in the list
    if (items.some((item) => item.product_id === product.id)) {
      return items;
    }

    // Ürünün orijinal para birimi ve fiyatını kullan
    const productCurrency = product.currency || "TRY";
    const originalPrice = product.price || 0;
    
    // Orijinal para birimi ve fiyat bilgisini sakla
    const originalCurrency = product.original_currency || productCurrency;
    const originalPriceValue = product.original_price !== undefined ? product.original_price : originalPrice;

    // Ürün kendi para birimi ile eklenecek, dönüşüm yapılmadan
    const newItem: ProposalItem = {
      id: uuidv4(),
      product_id: product.id,
      name: product.name,
      description: product.description,
      quantity: 1,
      unit: product.unit || "adet",
      unit_price: originalPrice, // Ürünün kendi fiyatı
      tax_rate: product.tax_rate || 18,
      discount_rate: 0, // Default discount rate
      total_price: originalPrice * (1 + (product.tax_rate || 0) / 100), // Quantity is 1, so total = unit price with tax
      currency: productCurrency, // Ürünün kendi para birimi ile ekle
      original_currency: originalCurrency, // Ürünün orijinal para birimini sakla
      original_price: originalPriceValue, // Ürünün orijinal fiyatını sakla
      stock_status: product.stock_quantity && product.stock_quantity > 0 
        ? (product.stock_quantity > product.stock_threshold ? 'in_stock' : 'low_stock')
        : 'out_of_stock',
    };
    
    console.log("Eklenen ürün para birimi:", productCurrency);
    console.log("Eklenen ürün fiyatı:", originalPrice);
    console.log("Eklenen ürün orijinal para birimi:", originalCurrency);
    console.log("Eklenen ürün orijinal fiyatı:", originalPriceValue);
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    return updatedItems;
  }, [items]);

  // Handle removing an item
  const handleRemoveItem = useCallback((id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    return updatedItems;
  }, [items]);

  // Handle item changes
  const handleItemChange = useCallback((id: string, field: keyof ProposalItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      // Recalculate total price when quantity or unit_price changes
      if (field === "quantity" || field === "unit_price" || field === "discount_rate" || field === "tax_rate") {
        const quantity = Number(updatedItem.quantity);
        const unitPrice = Number(updatedItem.unit_price);
        const discountRate = Number(updatedItem.discount_rate || 0);
        const taxRate = Number(updatedItem.tax_rate || 0);
        
        // Apply discount
        const discountedPrice = unitPrice * (1 - discountRate / 100);
        // Calculate total with tax
        updatedItem.total_price = quantity * discountedPrice * (1 + taxRate / 100);
      }

      return updatedItem;
    });
    
    setItems(updatedItems);
    return updatedItems;
  }, [items]);

  // Update all items' currency using dashboard exchange rates
  const updateAllItemsCurrency = useCallback((newCurrency: string) => {
    if (newCurrency === selectedCurrency) return items;

    const updatedItems = items.map((item) => {
      // If original currency is available, convert from it to maintain accuracy
      const sourceCurrency = item.original_currency || item.currency || selectedCurrency;
      const sourcePrice = 
        sourceCurrency === item.original_currency && item.original_price !== undefined
          ? item.original_price
          : item.unit_price;

      // Use dashboard exchange rates for conversion
      const convertedPrice = dashboardRates.convertCurrency(
        sourcePrice,
        sourceCurrency,
        newCurrency
      );

      // Recalculate total price with tax and discount
      const quantity = Number(item.quantity);
      const discountRate = Number(item.discount_rate || 0);
      const taxRate = Number(item.tax_rate || 0);
      
      // Apply discount
      const discountedPrice = convertedPrice * (1 - discountRate / 100);
      // Calculate total with tax
      const totalPrice = quantity * discountedPrice * (1 + taxRate / 100);

      return {
        ...item,
        unit_price: convertedPrice,
        total_price: totalPrice,
        currency: newCurrency,
      };
    });

    setItems(updatedItems);
    return updatedItems;
  }, [items, selectedCurrency, dashboardRates]);

  // Convert using dashboard exchange rates with proper fallback
  const convertCurrency = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    // Use dashboard rates if available
    if (dashboardRates?.convertCurrency) {
      const result = dashboardRates.convertCurrency(amount, fromCurrency, toCurrency);
      console.log(`Dashboard conversion result: ${result}`);
      return result;
    }
    
    console.log('Dashboard rates not available, using fallback');
    // Fallback calculation using exchangeRates
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  }, [dashboardRates, exchangeRates]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    productDialogOpen,
    setProductDialogOpen,
    exchangeRates,
    currencyOptions,
    formatCurrency,
    getCurrencySymbol,
    handleCurrencyChange,
    handleAddItem,
    handleSelectProduct,
    handleRemoveItem,
    handleItemChange,
    updateAllItemsCurrency,
    convertCurrency,
    products,
    isLoading,
    items,
    setItems
  };
};
