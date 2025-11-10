import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Product } from "@/types/product";

interface ProductTechnicalSpecsProps {
  product: Product;
  onUpdate: (updates: Partial<Product>) => void;
}

export const ProductTechnicalSpecs = ({ product, onUpdate }: ProductTechnicalSpecsProps) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Teknik Özellikler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          Teknik özellikler henüz eklenmedi.
        </p>
      </CardContent>
    </Card>
  );
};
