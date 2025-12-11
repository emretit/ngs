import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Trash } from "lucide-react";
import { Package } from "lucide-react";

interface BOMItem {
  id: string;
  row_number: number;
  item_name: string;
  quantity: number;
  unit: string;
}

interface BOMItemsCardProps {
  items: BOMItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onMoveItemUp?: (index: number) => void;
  onMoveItemDown?: (index: number) => void;
  onItemChange: (index: number, field: keyof BOMItem, value: any) => void;
  showMoveButtons?: boolean;
  inputHeight?: "h-10" | "h-8";
}

const BOMItemsCard: React.FC<BOMItemsCardProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  showMoveButtons = false,
  inputHeight = "h-8"
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl relative z-10">
      <CardHeader className="pb-2 pt-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            Bileşenler / Malzemeler
          </CardTitle>
          <Button 
            onClick={onAddItem} 
            size="sm" 
            className="gap-2 px-3 py-1.5 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium text-sm">Satır Ekle</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Kolon Başlıkları */}
        <div className="grid grid-cols-12 gap-2 mb-3 px-1">
          <div className="col-span-6">
            <Label className="text-sm font-medium text-gray-600">Malzeme / Hammadde</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium text-gray-600">Miktar</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium text-gray-600">Birim</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium text-gray-600">İşlemler</Label>
          </div>
        </div>

        {/* Veri Satırları */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Henüz malzeme eklenmemiş. "Satır Ekle" butonuna tıklayarak ekleyebilirsiniz.
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-1.5 bg-gray-50/50">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Malzeme Adı */}
                  <div className="col-span-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-gray-600 min-w-[20px]">{item.row_number}.</span>
                      <Input
                        value={item.item_name}
                        onChange={(e) => onItemChange(index, 'item_name', e.target.value)}
                        placeholder="Malzeme adı..."
                        className={`flex-1 ${inputHeight} text-sm`}
                      />
                    </div>
                  </div>
                  
                  {/* Miktar */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0.0001"
                      step="0.0001"
                      className={inputHeight}
                    />
                  </div>
                  
                  {/* Birim */}
                  <div className="col-span-2">
                    <Input
                      value={item.unit}
                      onChange={(e) => onItemChange(index, 'unit', e.target.value)}
                      placeholder="kg, adet, m..."
                      className={inputHeight}
                    />
                  </div>
                  
                  {/* İşlemler */}
                  <div className="col-span-2 flex items-center gap-1">
                    {showMoveButtons && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onMoveItemUp?.(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onMoveItemDown?.(index)}
                          disabled={index === items.length - 1}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    
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

export default BOMItemsCard;
