
import { Card, CardContent } from "@/components/ui/card";
import { Package2, Maximize2 } from "lucide-react";
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
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Genel Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Ürün Adı</label>
              <p className="mt-1 text-sm font-medium">{product.name}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Kategori</label>
              <p className="mt-1">
                {product.product_categories ? (
                  <Badge variant="secondary">
                    {product.product_categories.name}
                  </Badge>
                ) : (
                  "Kategorisiz"
                )}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500">SKU</label>
              <p className="mt-1 text-sm">{product.sku || "SKU girilmemiş"}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Barkod</label>
              <p className="mt-1 text-sm">{product.barcode || "Barkod girilmemiş"}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Açıklama</label>
              <div 
                className="mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: product.formatted_description?.html || product.description || "Açıklama bulunmuyor" 
                }}
              />
            </div>
          </div>

          <div>
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  {product.image_url ? (
                    <>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-56 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Maximize2 className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">Görsel Yok</span>
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
