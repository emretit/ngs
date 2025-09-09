
import React from "react";
import ProductInfoSection from "./ProductInfoSection";
import OriginalCurrencyInfo from "./OriginalCurrencyInfo";
import QuantityDepoSection from "./QuantityDepoSection";
import PriceAndDiscountSection from "./PriceAndDiscountSection";
import NotesSection from "./NotesSection";
import PriceSummary from "./price-section/PriceSummary";
import { Product } from "@/types/product";

interface DialogContentProps {
  selectedProduct: Product;
  stockStatus: string;
  availableStock: number;
  originalCurrency: string;
  originalPrice: number;
  quantity: number;
  setQuantity: (value: number) => void;
  selectedDepo: string;
  setSelectedDepo: (value: string) => void;
  customPrice: number | undefined;
  setCustomPrice: (value: number | undefined) => void;
  discountRate: number;
  setDiscountRate: (value: number) => void;
  currentCurrency: string;
  handleCurrencyChange: (value: string) => void;
  convertedPrice: number;
  calculatedTotal: number;
  notes: string;
  setNotes: (value: string) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

const DialogContent: React.FC<DialogContentProps> = ({
  selectedProduct,
  stockStatus,
  availableStock,
  originalCurrency,
  originalPrice,
  quantity,
  setQuantity,
  selectedDepo,
  setSelectedDepo,
  customPrice,
  setCustomPrice,
  discountRate,
  setDiscountRate,
  currentCurrency,
  handleCurrencyChange,
  convertedPrice,
  calculatedTotal,
  notes,
  setNotes,
  formatCurrency
}) => {
  return (
    <div className="grid gap-4 py-4">
      <ProductInfoSection 
        product={selectedProduct}
        stockStatus={stockStatus}
        availableStock={availableStock}
      />
      
      <OriginalCurrencyInfo 
        originalCurrency={originalCurrency}
        originalPrice={originalPrice}
        formatCurrency={formatCurrency}
      />
      
      <QuantityDepoSection 
        quantity={quantity}
        setQuantity={setQuantity}
        selectedDepo={selectedDepo}
        setSelectedDepo={setSelectedDepo}
        availableStock={availableStock}
        stockStatus={stockStatus}
      />
      
      <PriceAndDiscountSection 
        customPrice={customPrice}
        setCustomPrice={setCustomPrice}
        discountRate={discountRate}
        setDiscountRate={setDiscountRate}
        selectedCurrency={currentCurrency}
        handleCurrencyChange={handleCurrencyChange}
        convertedPrice={originalPrice}
        originalCurrency={originalCurrency}
        formatCurrency={formatCurrency}
      />
      
      <NotesSection 
        notes={notes}
        setNotes={setNotes}
      />
      
      <PriceSummary
        unitPrice={convertedPrice}
        quantity={quantity}
        discountRate={discountRate}
        taxRate={selectedProduct.tax_rate || 0}
        calculatedTotal={calculatedTotal}
        originalCurrency={originalCurrency}
        currentCurrency={currentCurrency}
        formatCurrency={formatCurrency}
        convertedPrice={convertedPrice}
      />
    </div>
  );
};

export default DialogContent;
