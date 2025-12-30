import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Package } from "lucide-react";
import { formatUnit } from "@/utils/unitConstants";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProductSearchDialog from "@/components/proposals/form/items/product-dialog/ProductSearchDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

interface StockChange {
  product_id: string;
  product_name: string;
  delta: number; // Positive = added, Negative = removed
  unit: string;
}

interface PurchaseInvoiceLineItemsProps {
  items: InvoiceItem[];
  originalItems: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
  currency: string;
}

const PurchaseInvoiceLineItems: React.FC<PurchaseInvoiceLineItemsProps> = ({
  items,
  originalItems,
  onItemsChange,
  currency
}) => {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);

  // Calculate stock changes for each item
  const getStockChange = (item: InvoiceItem): number => {
    const original = originalItems.find(orig => orig.id === item.id);
    if (!original) {
      // New item
      return item.quantity;
    }
    // Quantity changed
    return item.quantity - original.quantity;
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setEditingItemIndex(undefined);
    setProductSearchOpen(true);
  };

  const handleProductSelect = async (product: any) => {
    setSelectedProduct(product);
    setProductSearchOpen(false);
    setProductModalOpen(true);
  };

  const handleAddToInvoice = async (productData: any) => {
    try {
      // Create new item
      const newItem: InvoiceItem = {
        id: `temp-${Date.now()}`, // Temporary ID for new items
        product_id: productData.id,
        product_name: productData.name,
        sku: selectedProduct?.sku || null,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate || 18,
        discount_rate: productData.discount_rate || 0,
        line_total: productData.total_price,
        product: selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          sku: selectedProduct.sku
        } : undefined
      };

      onItemsChange([...items, newItem]);
      setProductModalOpen(false);
      toast.success("Ürün eklendi");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Ürün eklenirken hata oluştu");
    }
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    if (window.confirm(`"${item.product_name}" ürünü silinsin mi? Stoktan ${item.quantity} ${formatUnit(item.unit)} düşecek.`)) {
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
      toast.success("Ürün silindi");
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseFloat(value) || 0;
    const newItems = [...items];
    const item = newItems[index];
    item.quantity = quantity;

    // Recalculate line_total
    const itemSubtotal = item.unit_price * item.quantity;
    const discountAmount = itemSubtotal * (item.discount_rate / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    item.line_total = afterDiscount + taxAmount;

    onItemsChange(newItems);
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    const unitPrice = parseFloat(value) || 0;
    const newItems = [...items];
    const item = newItems[index];
    item.unit_price = unitPrice;

    // Recalculate line_total
    const itemSubtotal = item.unit_price * item.quantity;
    const discountAmount = itemSubtotal * (item.discount_rate / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    item.line_total = afterDiscount + taxAmount;

    onItemsChange(newItems);
  };

  const handleTaxRateChange = (index: number, value: string) => {
    const taxRate = parseFloat(value) || 0;
    const newItems = [...items];
    const item = newItems[index];
    item.tax_rate = taxRate;

    // Recalculate line_total
    const itemSubtotal = item.unit_price * item.quantity;
    const discountAmount = itemSubtotal * (item.discount_rate / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    item.line_total = afterDiscount + taxAmount;

    onItemsChange(newItems);
  };

  const handleDiscountRateChange = (index: number, value: string) => {
    const discountRate = parseFloat(value) || 0;
    const newItems = [...items];
    const item = newItems[index];
    item.discount_rate = discountRate;

    // Recalculate line_total
    const itemSubtotal = item.unit_price * item.quantity;
    const discountAmount = itemSubtotal * (item.discount_rate / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    item.line_total = afterDiscount + taxAmount;

    onItemsChange(newItems);
  };

  const formatCurrency = (amount: number, curr: string = 'TRY') => {
    const currencyCode = curr === 'TL' ? 'TRY' : curr;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Add Product Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAddProduct}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ürün Ekle
        </Button>
      </div>

      {/* Line Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Henüz ürün eklenmedi</p>
          <p className="text-sm">Yukarıdaki "Ürün Ekle" butonunu kullanarak ürün ekleyebilirsiniz</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-10 px-2">#</TableHead>
                <TableHead className="min-w-80 px-3">Ürün</TableHead>
                <TableHead className="text-right w-24 px-2">Miktar</TableHead>
                <TableHead className="text-center w-20 px-2">Birim</TableHead>
                <TableHead className="text-right w-28 px-2">Birim Fiyat</TableHead>
                <TableHead className="text-right w-20 px-2">İndirim %</TableHead>
                <TableHead className="text-right w-20 px-2">KDV %</TableHead>
                <TableHead className="text-right w-28 px-2">Toplam</TableHead>
                <TableHead className="text-center w-28 px-2">Stok</TableHead>
                <TableHead className="text-center w-16 px-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const stockChange = getStockChange(item);
                return (
                  <TableRow key={item.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-xs px-2 py-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="min-w-80 max-w-none">
                        <p className="font-medium text-gray-900 text-sm break-words">
                          {item.product_name}
                        </p>
                        {item.sku && (
                          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded inline-block mt-1">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-2 py-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-20 text-right"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-center px-2 py-2">
                      <span className="text-xs font-medium text-gray-600">
                        {formatUnit(item.unit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-2 py-2">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                        className="w-24 text-right"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right px-2 py-2">
                      <Input
                        type="number"
                        value={item.discount_rate}
                        onChange={(e) => handleDiscountRateChange(index, e.target.value)}
                        className="w-16 text-right"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right px-2 py-2">
                      <Input
                        type="number"
                        value={item.tax_rate}
                        onChange={(e) => handleTaxRateChange(index, e.target.value)}
                        className="w-16 text-right"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900 px-2 py-2">
                      {formatCurrency(item.line_total, currency)}
                    </TableCell>
                    <TableCell className="text-center px-2 py-2">
                      {stockChange !== 0 && (
                        <span className={`text-xs font-semibold ${stockChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stockChange > 0 ? '+' : ''}{stockChange.toFixed(2)} {formatUnit(item.unit)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center px-2 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={7} className="text-right text-sm px-2 py-2">
                  Genel Toplam
                </TableCell>
                <TableCell className="text-right text-base px-2 py-2">
                  {formatCurrency(items.reduce((sum, item) => sum + (item.line_total || 0), 0), currency)}
                </TableCell>
                <TableCell colSpan={2} className="px-2 py-2"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Product Search Dialog */}
      <ProductSearchDialog
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        onSelectProduct={handleProductSelect}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={selectedProduct}
        onAddToProposal={handleAddToInvoice}
        currency={currency}
        existingData={null}
      />
    </div>
  );
};

export default PurchaseInvoiceLineItems;
