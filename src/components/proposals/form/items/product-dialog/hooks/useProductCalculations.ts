
import { useEffect } from "react";
import { Product } from "@/types/product";

interface UseProductCalculationsProps {
  selectedProduct: Product | null;
  quantity: number;
  customPrice: number | undefined;
  discountRate: number;
  setTotalPrice: (value: number) => void;
  setAvailableStock: (value: number) => void;
  setStockStatus: (value: string) => void;
  setCalculatedTotal: (value: number) => void;
  open: boolean;
  setOriginalPrice: (value: number) => void;
  setOriginalCurrency: (value: string) => void;
  setCurrentCurrency: (value: string) => void;
  setCustomPrice: (value: number | undefined) => void;
  setConvertedPrice: (value: number) => void;
}

export const useProductCalculations = ({
  selectedProduct,
  quantity,
  customPrice,
  discountRate,
  setTotalPrice,
  setAvailableStock,
  setStockStatus,
  setCalculatedTotal,
  open,
  setOriginalPrice,
  setOriginalCurrency,
  setCurrentCurrency,
  setCustomPrice,
  setConvertedPrice
}: UseProductCalculationsProps) => {
  
  // Update product information and calculations when product, quantity, or price changes
  useEffect(() => {
    if (selectedProduct) {
      setOriginalPrice(selectedProduct.price);
      setOriginalCurrency(selectedProduct.currency || "TRY");
      
      const currentPrice = customPrice !== undefined ? customPrice : selectedProduct.price;
      const discountedPrice = currentPrice * (1 - discountRate / 100);
      const total = quantity * discountedPrice * (1 + (selectedProduct.tax_rate || 0) / 100);
      setTotalPrice(total);
      setCalculatedTotal(total);
      
      setAvailableStock(selectedProduct.stock_quantity || 0);
      
      if (selectedProduct.stock_quantity <= 0) {
        setStockStatus("out_of_stock");
      } else if (selectedProduct.stock_quantity <= (selectedProduct.stock_threshold || 0)) {
        setStockStatus("low_stock");
      } else {
        setStockStatus("in_stock");
      }
    }
  }, [selectedProduct, quantity, customPrice, discountRate]);

  // Set initial price when product changes
  useEffect(() => {
    if (selectedProduct) {
      const productPrice = selectedProduct.price;
      
      setConvertedPrice(productPrice);
      
      if (customPrice === undefined || open) {
        setCustomPrice(productPrice);
      }
    }
  }, [selectedProduct, customPrice, open]);

  // Reset values when dialog opens
  useEffect(() => {
    if (open && selectedProduct) {
      setOriginalPrice(selectedProduct.price);
      setOriginalCurrency(selectedProduct.currency || "TRY");
      setCurrentCurrency(selectedProduct.currency || "TRY");
      setCustomPrice(selectedProduct.price);
    }
  }, [open, selectedProduct]);
};
