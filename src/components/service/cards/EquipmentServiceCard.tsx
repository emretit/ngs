import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Edit, Trash } from "lucide-react";
import EquipmentSelector from "@/components/service/EquipmentSelector";
import { formatCurrency } from "@/utils/formatters";

interface EquipmentLineItem {
  id: string;
  row_number: number;
  equipment_id: string | null;
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

interface EquipmentServiceCardProps {
  items: EquipmentLineItem[];
  equipmentList: any[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onMoveItemUp?: (index: number) => void;
  onMoveItemDown?: (index: number) => void;
  onItemChange: (index: number, field: keyof EquipmentLineItem, value: any) => void;
  onEquipmentSelect: (equipment: any, itemIndex?: number) => void;
  showMoveButtons?: boolean;
  inputHeight?: "h-10" | "h-8";
}

const EquipmentServiceCard: React.FC<EquipmentServiceCardProps> = ({
  items,
  equipmentList,
  onAddItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onItemChange,
  onEquipmentSelect,
  showMoveButtons = false,
  inputHeight = "h-10"
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
              <Plus className="h-4 w-4 text-indigo-600" />
            </div>
            Ekipman Listesi
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
            <Label className="text-sm font-medium text-gray-600">Ekipman</Label>
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
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-1.5 bg-gray-50/50">
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Ekipman */}
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-gray-600 min-w-[20px]">{item.row_number}.</span>
                    <EquipmentSelector
                      value={item.name || item.description || ''}
                      onChange={(equipmentName, equipment) => {
                        onItemChange(index, 'name', equipmentName);
                        onItemChange(index, 'description', equipmentName);
                        if (equipment) {
                          onItemChange(index, 'equipment_id', equipment.id);
                        }
                      }}
                      onEquipmentSelect={(equipment) => onEquipmentSelect(equipment, index)}
                      equipmentList={equipmentList}
                      placeholder="Ekipman seçin..."
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
                    className={inputHeight}
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

export default EquipmentServiceCard;








