
import React, { useEffect } from "react";
import { logger } from '@/utils/logger';
import { 
  Dialog, 
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useExchangeRates } from "@/hooks/useExchangeRates";

// Import refactored components
import ProductInfoSection from "./components/ProductInfoSection";
import PriceAndDiscountSection from "./components/PriceAndDiscountSection";
import QuantityDepoSection from "./components/QuantityDepoSection";
import NotesSection from "./components/NotesSection";
import OriginalCurrencyInfo from "./components/OriginalCurrencyInfo";
import TotalPriceSection from "./components/TotalPriceSection";

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct: Product | null;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  customPrice: number | undefined;
  setCustomPrice: (value: number | undefined) => void;
  selectedDepo: string;
  setSelectedDepo: (value: string) => void;
  discountRate: number;
  setDiscountRate: (value: number) => void;
  formatCurrency?: (amount: number, currency?: string) => string;
  onConfirm: () => void;
  selectedCurrency: string;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  open,
  onOpenChange,
  selectedProduct,
  quantity,
  setQuantity,
  customPrice,
  setCustomPrice,
  selectedDepo,
  setSelectedDepo,
  discountRate,
  setDiscountRate,
  formatCurrency: formatCurrencyProp,
  onConfirm,
  selectedCurrency,
}) => {
  // Default formatCurrency function
  const formatCurrency = formatCurrencyProp || ((amount: number, currency?: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  });
  const [notes, setNotes] = React.useState("");
  const [availableStock, setAvailableStock] = React.useState(0);
  const [stockStatus, setStockStatus] = React.useState("");
  const [originalPrice, setOriginalPrice] = React.useState(0);
  const [originalCurrency, setOriginalCurrency] = React.useState("");
  const [currentCurrency, setCurrentCurrency] = React.useState(selectedCurrency);
  const [calculatedTotal, setCalculatedTotal] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(20); // Default tax rate
  
  // Use the central exchange rates from the dashboard
  const { exchangeRates, loading: ratesLoading } = useExchangeRates();

  useEffect(() => {
    if (selectedProduct) {
      setTaxRate(selectedProduct.tax_rate || 20);
    }
  }, [selectedProduct]);

  // Initialize state when dialog opens with existing item data
  useEffect(() => {
    if (open && selectedProduct) {
      logger.debug('ProductEditDialog opened - quantity:', quantity, 'customPrice:', customPrice, 'discountRate:', discountRate);
      
      // Edit mode'da mevcut değerleri kullan - prop'lar zaten doğru değerlerle geliyor
      // Sadece emin olmak için set ediyoruz
      if (quantity !== undefined && quantity > 0) {
        setQuantity(quantity);
      }
      if (discountRate !== undefined) {
        setDiscountRate(discountRate);
      }
      if (customPrice !== undefined) {
        setCustomPrice(customPrice);
      }
      
      setAvailableStock(selectedProduct.stock_quantity || 0);
      setStockStatus(
        selectedProduct.stock_quantity 
          ? selectedProduct.stock_quantity > (selectedProduct.stock_threshold || 5) 
            ? 'in_stock' 
            : 'low_stock'
          : 'out_of_stock'
      );
      
      // Set original price and currency
      const productCurrency = selectedProduct.currency || 'TRY';
      setOriginalCurrency(productCurrency);
      setOriginalPrice(selectedProduct.price || 0);
      
      // Initialize current currency from selected currency
      setCurrentCurrency(selectedCurrency);
    }
  }, [open, selectedProduct, selectedCurrency, quantity, customPrice, discountRate, setQuantity, setDiscountRate, setCustomPrice]);

  if (!selectedProduct) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teklif Kalemini Düzenle</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <ProductInfoSection 
            product={selectedProduct} 
            stockStatus={stockStatus}
            availableStock={availableStock}
            originalCurrency={originalCurrency}
            originalPrice={originalPrice}
            formatCurrency={formatCurrency}
          />
          
          {originalCurrency !== selectedCurrency && (
            <OriginalCurrencyInfo 
              originalCurrency={originalCurrency}
              originalPrice={originalPrice}
              formatCurrency={formatCurrency}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <QuantityDepoSection 
                quantity={quantity}
                setQuantity={setQuantity}
                selectedDepo={selectedDepo}
                setSelectedDepo={setSelectedDepo}
                availableStock={availableStock}
                stockStatus={stockStatus}
                productId={selectedProduct.id}
              />
              
              <PriceAndDiscountSection 
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                discountRate={discountRate}
                setDiscountRate={setDiscountRate}
                selectedCurrency={currentCurrency}
                handleCurrencyChange={(value) => setCurrentCurrency(value)}
                convertedPrice={originalPrice}
                originalCurrency={originalCurrency}
                formatCurrency={formatCurrency}
              />
            </div>
            
            <div className="space-y-6">
              <TotalPriceSection 
                unitPrice={customPrice || originalPrice}
                quantity={quantity}
                discountRate={discountRate}
                taxRate={taxRate}
                calculatedTotal={calculatedTotal}
                setCalculatedTotal={setCalculatedTotal}
                originalCurrency={originalCurrency}
                currentCurrency={currentCurrency}
                formatCurrency={formatCurrency}
              />
              
              <NotesSection 
                notes={notes} 
                setNotes={setNotes} 
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          
          <Button 
            onClick={onConfirm}
            disabled={quantity < 1 || calculatedTotal <= 0}
          >
            Güncelle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;

