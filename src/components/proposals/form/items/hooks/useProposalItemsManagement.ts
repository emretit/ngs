
import { useState, useCallback, useMemo } from "react";
import { ProposalItem } from "@/types/proposal";
import { v4 as uuidv4 } from "uuid";
import { Product } from "@/types/product";
import { convertCurrency } from "../utils/currencyUtils";

export const useProposalItemsManagement = (
  selectedCurrency: string,
  exchangeRates: Record<string, number>
) => {
  const [items, setItems] = useState<ProposalItem[]>([]);

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
    setItems((prev) => [...prev, newItem]);
  }, [selectedCurrency]);

  const handleSelectProduct = useCallback(
    (product: Product) => {
      // Skip if product is already in the list
      if (items.some((item) => item.product_id === product.id)) {
        return;
      }

      const productCurrency = product.currency || "TRY";
      let unitPrice = product.price || 0;

      // Convert product price to selected currency if different
      if (productCurrency !== selectedCurrency) {
        unitPrice = convertCurrency(
          unitPrice,
          productCurrency,
          selectedCurrency,
          exchangeRates
        );
      }

      const newItem: ProposalItem = {
        id: uuidv4(),
        product_id: product.id,
        name: product.name,
        description: product.description,
        quantity: 1,
        unit: product.unit || "adet",
        unit_price: unitPrice,
        tax_rate: product.tax_rate || 18,
        // Use 0 as default discount rate since the product doesn't have this field
        discount_rate: 0,
        total_price: unitPrice, // Quantity is 1, so total = unit price
        currency: selectedCurrency,
        original_currency: productCurrency,
        original_price: product.price || 0,
        stock_status: product.stock_quantity && product.stock_quantity > 0
          ? (product.stock_quantity > product.stock_threshold ? 'in_stock' : 'low_stock')
          : 'out_of_stock',
      };
      
      setItems((prev) => [...prev, newItem]);
    },
    [items, selectedCurrency, exchangeRates]
  );

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleItemChange = useCallback(
    (id: string, field: keyof ProposalItem, value: any) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          const updatedItem = { ...item, [field]: value };

          // Recalculate total price when quantity or unit_price changes
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total_price = 
              updatedItem.quantity * updatedItem.unit_price;
          }

          return updatedItem;
        })
      );
    },
    []
  );

  const updateAllItemsCurrency = useCallback(
    (newCurrency: string) => {
      if (newCurrency === selectedCurrency) return items;

      const updatedItems = items.map((item) => {
        // If original currency is available, convert from it to maintain accuracy
        const sourceCurrency = item.original_currency || item.currency || selectedCurrency;
        const sourcePrice = 
          sourceCurrency === item.original_currency && item.original_price !== undefined
            ? item.original_price
            : item.unit_price;

        const convertedPrice = convertCurrency(
          sourcePrice,
          sourceCurrency,
          newCurrency,
          exchangeRates
        );

        return {
          ...item,
          unit_price: convertedPrice,
          total_price: convertedPrice * item.quantity,
          currency: newCurrency,
        };
      });

      setItems(updatedItems);
      return updatedItems;
    },
    [items, selectedCurrency, exchangeRates]
  );

  // Memoize calculated totals for better performance
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const totalTax = items.reduce((sum, item) => {
      const itemTax = (item.total_price || 0) * ((item.tax_rate || 0) / 100);
      return sum + itemTax;
    }, 0);
    const totalDiscount = items.reduce((sum, item) => {
      const itemDiscount = (item.unit_price || 0) * (item.quantity || 0) * ((item.discount_rate || 0) / 100);
      return sum + itemDiscount;
    }, 0);
    
    return {
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal: subtotal + totalTax - totalDiscount
    };
  }, [items]);

  return {
    items,
    setItems,
    handleAddItem,
    handleSelectProduct,
    handleRemoveItem,
    handleItemChange,
    updateAllItemsCurrency,
    totals,
  };
};
