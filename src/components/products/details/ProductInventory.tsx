
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ProductInventoryProps {
  stockQuantity: number;
  minStockLevel: number;
  stockThreshold?: number;
  unit: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  lastPurchaseDate: string | null;
  onUpdate: (updates: {
    stock_quantity?: number;
    min_stock_level?: number;
    stock_threshold?: number;
  }) => void;
}

const ProductInventory = ({ 
  stockQuantity, 
  minStockLevel,
  stockThreshold,
  unit,
  supplier,
  lastPurchaseDate,
  onUpdate
}: ProductInventoryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    stockQuantity,
    minStockLevel,
    stockThreshold: stockThreshold || minStockLevel
  });

  const handleSave = () => {
    onUpdate({
      stock_quantity: Number(editValues.stockQuantity),
      min_stock_level: Number(editValues.minStockLevel),
      stock_threshold: Number(editValues.stockThreshold)
    });
    setIsEditing(false);
  };

  // Display threshold only if it's different from minStockLevel
  const showThreshold = stockThreshold && stockThreshold !== minStockLevel;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
              <Archive className="h-4 w-4 text-green-600" />
            </div>
            Stok Bilgileri
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-700">Stok Miktarı</label>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Input
                  type="number"
                  value={editValues.stockQuantity}
                  onChange={(e) => setEditValues(prev => ({
                    ...prev,
                    stockQuantity: e.target.valueAsNumber
                  }))}
                  className="w-28 h-7 text-xs text-right"
                />
              ) : (
                <span className="text-sm font-medium">
                  {stockQuantity} {unit}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-700">Minimum Stok Seviyesi</label>
            {isEditing ? (
              <Input
                type="number"
                value={editValues.minStockLevel}
                onChange={(e) => setEditValues(prev => ({
                  ...prev,
                  minStockLevel: e.target.valueAsNumber
                }))}
                className="w-28 h-7 text-xs text-right"
              />
            ) : (
              <span>{minStockLevel} {unit}</span>
            )}
          </div>

          {(isEditing || showThreshold) && (
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-700">Stok Alarm Eşiği</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editValues.stockThreshold}
                  onChange={(e) => setEditValues(prev => ({
                    ...prev,
                    stockThreshold: e.target.valueAsNumber
                  }))}
                  className="w-28 h-7 text-xs text-right"
                />
              ) : (
                <span>{stockThreshold} {unit}</span>
              )}
            </div>
          )}

          {supplier && (
            <>
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-700">Tedarikçi</label>
                <span className="text-sm font-medium">{supplier.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-700">Tedarikçi İletişim</label>
                <div className="text-right text-xs">
                  <div>{supplier.email}</div>
                  <div>{supplier.phone}</div>
                </div>
              </div>
            </>
          )}

          {lastPurchaseDate && (
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-700">Son Alım Tarihi</label>
              <span>{format(new Date(lastPurchaseDate), 'dd.MM.yyyy')}</span>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditValues({
                    stockQuantity,
                    minStockLevel,
                    stockThreshold: stockThreshold || minStockLevel
                  });
                  setIsEditing(false);
                }}
              >
                İptal
              </Button>
              <Button onClick={handleSave}>
                Kaydet
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default ProductInventory;
