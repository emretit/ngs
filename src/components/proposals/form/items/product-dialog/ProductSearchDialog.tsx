
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Product } from "@/types/product";
import ProductList from "./ProductList";
import ProductDetailsDialog from "./ProductDetailsDialog";
import { useProductSearchDialog, EditingRowValues } from "./useProductSearchDialog";

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (
    product: Product, 
    quantity?: number, 
    customPrice?: number,
    discountRate?: number
  ) => void;
  selectedCurrency: string;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  initialSelectedProduct?: Product | null;
  editingRowValues?: EditingRowValues | null;
}

const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSelectProduct,
  selectedCurrency,
  triggerRef,
  initialSelectedProduct = null,
  editingRowValues = null
}) => {
  const {
    searchQuery,
    setSearchQuery,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedProduct,
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
    resetForm
  } = useProductSearchDialog(open, initialSelectedProduct, editingRowValues);

  const handleSelectProduct = () => {
    if (selectedProduct) {
      // When selecting a product, preserve its original currency and price
      const productWithOriginalValues = {
        ...selectedProduct,
        original_currency: selectedProduct.currency,
        original_price: selectedProduct.price
      };
      
      onSelectProduct(
        productWithOriginalValues, 
        quantity, 
        customPrice, 
        discountRate
      );
      
      onOpenChange(false);
      setDetailsDialogOpen(false);
      resetForm();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ürün Seçimi</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün adı, SKU veya barkoda göre ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          
          <ProductList
            products={products}
            isLoading={isLoading}
            searchQuery={searchQuery}
            formatCurrency={formatCurrency}
            onSelectProduct={openProductDetails}
            selectedCurrency={selectedCurrency}
          />
        </DialogContent>
      </Dialog>

      <ProductDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        selectedProduct={selectedProduct}
        quantity={quantity}
        setQuantity={setQuantity}
        customPrice={customPrice}
        setCustomPrice={setCustomPrice}
        selectedDepo={selectedDepo}
        setSelectedDepo={setSelectedDepo}
        discountRate={discountRate}
        setDiscountRate={setDiscountRate}
        formatCurrency={formatCurrency}
        onSelectProduct={handleSelectProduct}
        selectedCurrency={selectedCurrency}
      />
    </>
  );
};

export default ProductSearchDialog;
