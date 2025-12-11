import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { BOM } from "@/types/production";

interface WorkOrderBOMCardProps {
  formData: {
    bom_id?: string;
    quantity: number;
  };
  boms: BOM[];
  onFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const WorkOrderBOMCard: React.FC<WorkOrderBOMCardProps> = ({
  formData,
  boms,
  onFieldChange,
  errors = {}
}) => {
  const selectedBOM = boms.find(bom => bom.id === formData.bom_id);

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          Ürün Reçetesi ve Miktar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Ürün Reçetesi
          </Label>
          <Select 
            value={formData.bom_id || undefined} 
            onValueChange={(value) => onFieldChange('bom_id', value === "none" ? undefined : value)}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder="Ürün reçetesi seçin..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Reçetesiz Üretim</SelectItem>
              {boms.map((bom) => (
                <SelectItem key={bom.id} value={bom.id}>
                  {bom.name} {bom.product_name ? `(${bom.product_name})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBOM && selectedBOM.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedBOM.description}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Miktar <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity || ""}
            onChange={(e) => onFieldChange('quantity', Number(e.target.value))}
            min="0.01"
            step="0.01"
            placeholder="Üretim adedi"
            className="mt-1 h-8 text-sm"
            required
          />
          {errors.quantity && (
            <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderBOMCard;
