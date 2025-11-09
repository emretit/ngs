import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface ProductTechnicalSpecsProps {
  product: Product;
  onUpdate: (updates: Partial<Product>) => void;
}

export const ProductTechnicalSpecs = ({ product, onUpdate }: ProductTechnicalSpecsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    weight: product.weight || null,
    dimensions: product.dimensions || '',
    warranty_period: product.warranty_period || null,
  });

  useEffect(() => {
    if (!isEditing) {
      setEditValues({
        weight: product.weight || null,
        dimensions: product.dimensions || '',
        warranty_period: product.warranty_period || null,
      });
    }
  }, [product.weight, product.dimensions, product.warranty_period, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onUpdate({
        weight: editValues.weight,
        dimensions: editValues.dimensions || null,
        warranty_period: editValues.warranty_period,
      });
      setIsEditing(false);
      toast.success("Teknik özellikler güncellendi");
    } catch (error) {
      toast.error("Güncelleme sırasında bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <Settings className="h-4 w-4 text-purple-600" />
            </div>
            Teknik Özellikler
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Ağırlık (kg)</label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={editValues.weight || ''}
                onChange={(e) => setEditValues(prev => ({
                  ...prev,
                  weight: e.target.value ? parseFloat(e.target.value) : null
                }))}
                className="w-full"
                placeholder="Ağırlık girin"
              />
            ) : (
              <p className="text-sm">{product.weight ? `${product.weight} kg` : '-'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Boyutlar</label>
            {isEditing ? (
              <Input
                type="text"
                value={editValues.dimensions}
                onChange={(e) => setEditValues(prev => ({
                  ...prev,
                  dimensions: e.target.value
                }))}
                className="w-full"
                placeholder="Örn: 10x20x30 cm"
              />
            ) : (
              <p className="text-sm">{product.dimensions || '-'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Garanti Süresi (ay)</label>
            {isEditing ? (
              <Input
                type="number"
                value={editValues.warranty_period || ''}
                onChange={(e) => setEditValues(prev => ({
                  ...prev,
                  warranty_period: e.target.value ? parseInt(e.target.value) : null
                }))}
                className="w-full"
                placeholder="Garanti süresi girin"
              />
            ) : (
              <p className="text-sm">{product.warranty_period ? `${product.warranty_period} ay` : '-'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Birim</label>
            <p className="text-sm">{product.unit || 'adet'}</p>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setEditValues({
                  weight: product.weight || null,
                  dimensions: product.dimensions || '',
                  warranty_period: product.warranty_period || null,
                });
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" /> İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" /> Kaydet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

