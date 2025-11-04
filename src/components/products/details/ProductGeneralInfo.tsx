
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Product } from "@/types/product";

interface ProductGeneralInfoProps {
  product: Pick<Product, 
    "name" | 
    "description" | 
    "formatted_description" | 
    "sku" | 
    "barcode" | 
    "image_url" | 
    "product_categories"
  >;
  onUpdate: (updates: Partial<Product>) => void;
}

const ProductGeneralInfo = ({ product, onUpdate }: ProductGeneralInfoProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          Genel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Ürün Adı</label>
              <p className="text-sm font-medium">{product.name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori</label>
              <div className="mt-1">
                {product.product_categories ? (
                  <Badge variant="secondary" className="text-xs">
                    {product.product_categories.name}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-500">Kategorisiz</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">SKU</label>
              <p className="text-sm">{product.sku || "SKU girilmemiş"}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Barkod</label>
              <p className="text-sm">{product.barcode || "Barkod girilmemiş"}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Açıklama</label>
              <div 
                className="mt-1 prose prose-sm max-w-none text-xs"
                dangerouslySetInnerHTML={{ 
                  __html: product.formatted_description?.html || product.description || "Açıklama bulunmuyor" 
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Ürün Görseli</label>
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  {product.image_url ? (
                    <>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Maximize2 className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <span className="text-xs text-gray-400">Görsel Yok</span>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-auto"
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductGeneralInfo;
