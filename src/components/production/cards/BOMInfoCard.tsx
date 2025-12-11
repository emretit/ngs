import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import ProductSelector from "@/components/proposals/form/ProductSelector";

interface BOMInfoCardProps {
  formData: {
    name: string;
    description?: string;
    product_id?: string;
    product_name?: string;
  };
  onFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const BOMInfoCard: React.FC<BOMInfoCardProps> = ({
  formData,
  onFieldChange,
  errors = {}
}) => {
  const handleProductSelect = (name: string, product: any) => {
    onFieldChange('product_name', name);
    if (product) {
      onFieldChange('product_id', product.id);
      // Ürün seçildiğinde reçete adını otomatik doldur (eğer boşsa)
      if (!formData.name) {
        onFieldChange('name', `${product.name} Reçetesi`);
      }
    }
  };

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Settings className="h-4 w-4 text-blue-600" />
          </div>
          Reçete Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Reçete Adı <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Örn: Masa Standart Üretim"
            className="mt-1 h-8 text-sm"
            required
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">
            İlgili Ürün (Opsiyonel)
          </Label>
          <ProductSelector
            value={formData.product_name || ""}
            onChange={handleProductSelect}
            onProductSelect={(p) => handleProductSelect(p.name, p)}
            placeholder="Ürün seçin..."
            className="mt-1 h-8"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Açıklama
          </Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Reçete hakkında notlar..."
            rows={3}
            className="mt-1 text-sm resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BOMInfoCard;
