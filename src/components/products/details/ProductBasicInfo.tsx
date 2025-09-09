
import { Card, CardContent } from "@/components/ui/card";
import { Package2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductBasicInfoProps {
  name: string;
  description: string | null;
  category: string | null;
  productType: string;
  barcode: string | null;
  sku: string | null;
}

const ProductBasicInfo = ({ 
  name,
  description, 
  category, 
  productType, 
  barcode, 
  sku 
}: ProductBasicInfoProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Ürün Bilgileri
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Ürün Adı</label>
            <p className="mt-1 font-medium">{name}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Açıklama</label>
            <p className="mt-1">{description || "Açıklama bulunmuyor"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Kategori</label>
            <p className="mt-1">
              {category ? (
                <Badge variant="secondary">{category}</Badge>
              ) : (
                "Kategorisiz"
              )}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Ürün Tipi</label>
            <p className="mt-1 capitalize">{productType}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">SKU</label>
            <p className="mt-1">{sku || "SKU girilmemiş"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Barkod</label>
            <p className="mt-1">{barcode || "Barkod girilmemiş"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductBasicInfo;
