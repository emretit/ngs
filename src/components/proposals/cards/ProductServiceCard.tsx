import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  image_url?: string;
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
  inputHeight?: "h-10" | "h-8";
}

const UNIT_OPTIONS = [
  "Adet",
  "Kilogram",
  "Metre",
  "Metrekare",
  "Metreküp",
  "Litre",
  "Paket",
  "Kutu",
  "Saat"
];

const ProductServiceCard: React.FC<ProductServiceCardProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onItemChange,
  onProductModalSelect,
  showMoveButtons = false,
  inputHeight = "h-8"
}) => {
  // Inline düzenleme için state: { itemIndex: { field: value } }
  const [editingField, setEditingField] = useState<{ itemIndex: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleFieldClick = (itemIndex: number, field: string, currentValue: any) => {
    setEditingField({ itemIndex, field });
    setEditValue(String(currentValue || ""));
  };

  const handleFieldSave = (itemIndex: number, field: keyof LineItem) => {
    if (editingField?.itemIndex === itemIndex && editingField?.field === field) {
      let value: any = editValue;
      
      // Sayısal alanlar için dönüşüm
      if (field === 'unit_price' || field === 'tax_rate' || field === 'discount_rate') {
        value = parseFloat(editValue) || 0;
      }
      
      onItemChange(itemIndex, field, value);
      setEditingField(null);
      setEditValue("");
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemIndex: number, field: keyof LineItem) => {
    if (e.key === "Enter") {
      handleFieldSave(itemIndex, field);
    } else if (e.key === "Escape") {
      handleFieldCancel();
    }
  };

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl relative z-10">
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
            <Label className="text-sm font-medium text-gray-600">Ürün/Hizmet</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">Miktar</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">Birim</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">Birim Fiyat</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">KDV %</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">İndirim</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">Toplam</Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-gray-600">İşlemler</Label>
          </div>
        </div>

        {/* Veri Satırları */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Henüz ürün/hizmet eklenmemiş. "Satır Ekle" butonuna tıklayarak ekleyebilirsiniz.
            </div>
          ) : (
            items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-1.5 bg-gray-50/50 group hover:bg-gray-50/50 transition-colors">
              <div className="grid grid-cols-12 gap-2 items-center min-w-0">
                {/* Ürün/Hizmet */}
                <div className="col-span-5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-xs text-gray-600 shrink-0 group-hover:font-bold">{item.row_number}.</span>
                    <ProductSelector
                      value={item.name || item.description || ''}
                      onChange={(productName) => {
                        onItemChange(index, 'name', productName);
                        onItemChange(index, 'description', productName);
                      }}
                      onProductSelect={(product) => {
                        // ProductSelector'dan ürün seçildiğinde yeni ekleme modunda açılmalı
                        // existingData göndermiyoruz, böylece ProductDetailsModal yeni ekleme modunda açılır
                        onProductModalSelect({ ...product, image_url: product?.image_url || item.image_url }, index);
                      }}
                      placeholder="Ürün seçin..."
                      className="flex-1 min-w-0 max-w-full group-hover:font-bold"
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
                    className={inputHeight}
                  />
                </div>
                
                {/* Birim */}
                <div className="col-span-1">
                  <Select
                    value={item.unit || 'Adet'}
                    onValueChange={(value) => onItemChange(index, 'unit', value)}
                  >
                    <SelectTrigger className={`${inputHeight} text-xs font-medium bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300 group-hover:font-bold`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Birim Fiyat */}
                <div className="col-span-1">
                  {editingField?.itemIndex === index && editingField?.field === 'unit_price' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleFieldSave(index, 'unit_price')}
                      onKeyDown={(e) => handleKeyDown(e, index, 'unit_price')}
                      autoFocus
                      className={inputHeight}
                    />
                  ) : (
                    <div 
                      className={`${inputHeight} flex items-center justify-end bg-gray-100 rounded text-right font-medium text-xs cursor-pointer hover:bg-gray-200 transition-colors group-hover:font-bold px-2`}
                      onClick={() => handleFieldClick(index, 'unit_price', item.unit_price)}
                    >
                      {formatCurrency(item.unit_price, item.currency || 'TRY')}
                    </div>
                  )}
                </div>
                
                {/* KDV % */}
                <div className="col-span-1">
                  {editingField?.itemIndex === index && editingField?.field === 'tax_rate' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleFieldSave(index, 'tax_rate')}
                      onKeyDown={(e) => handleKeyDown(e, index, 'tax_rate')}
                      autoFocus
                      className={inputHeight}
                    />
                  ) : (
                    <div 
                      className={`${inputHeight} flex items-center justify-center bg-gray-100 rounded text-center font-medium text-xs cursor-pointer hover:bg-gray-200 transition-colors group-hover:font-bold px-2`}
                      onClick={() => handleFieldClick(index, 'tax_rate', item.tax_rate || 0)}
                    >
                      {item.tax_rate ? `%${item.tax_rate}` : '-'}
                    </div>
                  )}
                </div>
                
                {/* İndirim */}
                <div className="col-span-1">
                  {editingField?.itemIndex === index && editingField?.field === 'discount_rate' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleFieldSave(index, 'discount_rate')}
                      onKeyDown={(e) => handleKeyDown(e, index, 'discount_rate')}
                      autoFocus
                      className={inputHeight}
                    />
                  ) : (
                    <div 
                      className={`${inputHeight} flex items-center justify-center bg-gray-100 rounded text-center font-medium text-xs cursor-pointer hover:bg-gray-200 transition-colors group-hover:font-bold px-2`}
                      onClick={() => handleFieldClick(index, 'discount_rate', item.discount_rate || 0)}
                    >
                      {item.discount_rate && item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                    </div>
                  )}
                </div>
                
                {/* Toplam */}
                <div className="col-span-1">
                  <div className={`${inputHeight} flex items-center justify-end bg-gray-100 rounded text-right font-medium text-xs group-hover:font-bold px-2`}>
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
                        vat_rate: item.tax_rate || 20, // ProposalItem'da tax_rate, ProductDetailsModal'da vat_rate bekleniyor
                        discount_rate: item.discount_rate || 0,
                        currency: item.currency || 'TRY'
                      };
                      
                      // Edit butonundan geldiğini belirtmek için existingData'yı product içine sarıyoruz
                      // Product bilgisi yoksa, existingData'dan oluşturuyoruz
                      const productData = {
                        id: item.id || '',
                        name: item.name || '',
                        price: item.unit_price || 0,
                        currency: item.currency || 'TRY',
                        sku: '',
                        stock_quantity: 0,
                        description: item.description || '',
                        existingData: existingData
                      };
                      
                      onProductModalSelect(productData, index);
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductServiceCard;
