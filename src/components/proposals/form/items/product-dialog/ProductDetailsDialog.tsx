
import React, { useEffect } from "react";
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

interface ProductDetailsDialogProps {
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
  formatCurrency: (amount: number, currency?: string) => string;
  onSelectProduct: () => void;
  selectedCurrency: string;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
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
  formatCurrency,
  onSelectProduct,
  selectedCurrency
}) => {
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

  // Reset state when dialog opens with a product
  useEffect(() => {
    if (open && selectedProduct) {
      setQuantity(1);
      setDiscountRate(0);
      setAvailableStock(selectedProduct.stock_quantity || 0);
      setStockStatus(
        selectedProduct.stock_quantity 
          ? selectedProduct.stock_quantity > (selectedProduct.stock_threshold || 5) 
            ? 'in_stock' 
            : 'low_stock'
          : 'out_of_stock'
      );
      
      // Set original price and currency
      const productCurrency = selectedProduct.currency || 'TL';
      setOriginalCurrency(productCurrency);
      setOriginalPrice(selectedProduct.price || 0);
      
      // Initialize current currency from selected currency
      setCurrentCurrency(selectedCurrency);
    }
  }, [open, selectedProduct, selectedCurrency, setQuantity, setDiscountRate]);

  // Handle clicking the Add to Proposal button
  const handleAddToProposal = () => {
    onSelectProduct();
  };

  if (!selectedProduct) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ürün Detayları</DialogTitle>
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
            onClick={handleAddToProposal}
            disabled={quantity < 1 || calculatedTotal <= 0}
          >
            Teklife Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
