import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Edit, Trash } from "lucide-react";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import { formatCurrency } from "@/utils/formatters";

interface LineItem {
  id: string;
  row_number: number;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
}

interface ProductServiceCardProps {
  items: LineItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onMoveItemUp?: (index: number) => void;
  onMoveItemDown?: (index: number) => void;
  onItemChange: (index: number, field: keyof LineItem, value: any) => void;
  onProductModalSelect: (product: any, itemIndex?: number) => void;
  showMoveButtons?: boolean;
  inputHeight?: "h-7" | "h-8";
}

const ProductServiceCard: React.FC<ProductServiceCardProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onItemChange,
  onProductModalSelect,
  showMoveButtons = false,
  inputHeight = "h-7"
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <Plus className="h-4 w-4 text-purple-600" />
            </div>
            Ürün/Hizmet Listesi
          </CardTitle>
          <Button onClick={onAddItem} size="sm" className="gap-2 px-3 py-1.5 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm transition-all duration-200">
            <Plus className="h-4 w-4" />
            <span className="font-medium text-sm">Satır Ekle</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Kolon Başlıkları */}
        <div className="grid grid-cols-12 gap-2 mb-3 px-1">
          <div className="col-span-5">
            <Label className="text-xs font-medium text-gray-600">Ürün/Hizmet</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">Miktar</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">Birim</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">Birim Fiyat</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">KDV %</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">İndirim</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">Toplam</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-xs font-medium text-gray-600">İşlemler</Label>
          </div>
        </div>

        {/* Veri Satırları */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-1.5 bg-gray-50/50">
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Ürün/Hizmet */}
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-gray-600 min-w-[20px]">{item.row_number}.</span>
                    <ProductSelector
                      value={item.name || item.description || ''}
                      onChange={(productName) => {
                        onItemChange(index, 'name', productName);
                        onItemChange(index, 'description', productName);
                      }}
                      onProductSelect={(product) => onProductModalSelect(product, index)}
                      placeholder="Ürün seçin..."
                      className="flex-1 max-w-full"
                    />
                  </div>
                </div>
                
                {/* Miktar */}
                <div className="col-span-1">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onItemChange(index, 'quantity', Number(e.target.value))}
                    min="1"
                    className={`${inputHeight} text-xs`}
                  />
                </div>
                
                {/* Birim */}
                <div className="col-span-1">
                  <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-xs">
                    {item.unit || 'adet'}
                  </div>
                </div>
                
                {/* Birim Fiyat */}
                <div className="col-span-1">
                  <div className="p-1.5 bg-gray-100 rounded text-right font-medium text-xs">
                    {formatCurrency(item.unit_price, item.currency || 'TRY')}
                  </div>
                </div>
                
                {/* KDV % */}
                <div className="col-span-1">
                  <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-xs">
                    {item.tax_rate ? `%${item.tax_rate}` : '-'}
                  </div>
                </div>
                
                {/* İndirim */}
                <div className="col-span-1">
                  <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-xs">
                    {item.discount_rate && item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                  </div>
                </div>
                
                {/* Toplam */}
                <div className="col-span-1">
                  <div className="p-1.5 bg-gray-100 rounded text-right font-medium text-xs">
                    {formatCurrency(item.total_price, item.currency || 'TRY')}
                  </div>
                </div>
                
                {/* İşlem Butonları */}
                <div className="col-span-1 flex gap-1 justify-center">
                  {/* Yukarı/Aşağı Butonları - Sadece showMoveButtons true ise göster */}
                  {showMoveButtons && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onMoveItemUp?.(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onMoveItemDown?.(index)}
                        disabled={index === items.length - 1}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  {/* Düzenle Butonu */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const existingData = {
                        name: item.name,
                        description: item.description || '',
                        quantity: item.quantity,
                        unit: item.unit,
                        unit_price: item.unit_price,
                        vat_rate: item.tax_rate || 20,
                        discount_rate: item.discount_rate || 0,
                        currency: item.currency
                      };
                      
                      onProductModalSelect(existingData, index);
                    }}
                    className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  {/* Sil Butonu */}
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductServiceCard;
