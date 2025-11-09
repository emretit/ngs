import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Package, DollarSign, Archive, Building, Tag, FileText, Calendar, Maximize2 } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProductInfoProps {
  product: Product;
  onUpdate?: (updatedProduct: Product) => void;
}

export const ProductInfo = ({ product, onUpdate }: ProductInfoProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Genel Bilgiler Card */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-background to-muted/20 border shadow-sm">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
          <div className="p-1 bg-primary/10 rounded">
            <Package className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Genel Bilgiler</h2>
        </div>
        
        <div className="px-3 pb-3 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Temel Bilgiler */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Package className="w-2.5 h-2.5 text-primary" />
                <span>Ürün Adı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.name}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Tag className="w-2.5 h-2.5 text-purple-500" />
                <span>SKU</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.sku || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Tag className="w-2.5 h-2.5 text-purple-600" />
                <span>Barkod</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.barcode || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building className="w-2.5 h-2.5 text-indigo-500" />
                <span>Kategori</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.product_categories?.name || <span className="text-gray-400 italic">Kategorisiz</span>}
              </div>
            </div>

            {/* Fiyat Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <DollarSign className="w-2.5 h-2.5 text-green-500" />
                <span>Satış Fiyatı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {formatCurrency(product.price, product.currency || 'TRY')}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <DollarSign className="w-2.5 h-2.5 text-orange-500" />
                <span>Alış Fiyatı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.purchase_price ? formatCurrency(product.purchase_price, product.currency || 'TRY') : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <DollarSign className="w-2.5 h-2.5 text-blue-500" />
                <span>Para Birimi</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.currency || 'TRY'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <DollarSign className="w-2.5 h-2.5 text-amber-500" />
                <span>KDV Oranı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                %{product.tax_rate || 0}
              </div>
            </div>

            {/* Stok Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Archive className="w-2.5 h-2.5 text-green-500" />
                <span>Stok Miktarı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.stock_quantity || 0} {product.unit || 'adet'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Archive className="w-2.5 h-2.5 text-amber-500" />
                <span>Min. Stok</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.min_stock_level || 0} {product.unit || 'adet'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Archive className="w-2.5 h-2.5 text-red-500" />
                <span>Stok Eşiği</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.stock_threshold || product.min_stock_level || 0} {product.unit || 'adet'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Archive className="w-2.5 h-2.5 text-blue-500" />
                <span>Birim</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.unit || 'adet'}
              </div>
            </div>

            {/* Ek Bilgiler */}
            {product.weight && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Package className="w-2.5 h-2.5 text-gray-500" />
                  <span>Ağırlık</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {product.weight} kg
                </div>
              </div>
            )}

            {product.dimensions && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Package className="w-2.5 h-2.5 text-gray-600" />
                  <span>Boyutlar</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {product.dimensions}
                </div>
              </div>
            )}

            {product.warranty_period && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <FileText className="w-2.5 h-2.5 text-purple-500" />
                  <span>Garanti Süresi</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {product.warranty_period} ay
                </div>
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-2.5 h-2.5 text-blue-500" />
                <span>Oluşturulma</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.created_at ? new Date(product.created_at).toLocaleDateString('tr-TR') : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-2.5 h-2.5 text-green-500" />
                <span>Son Güncelleme</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.updated_at ? new Date(product.updated_at).toLocaleDateString('tr-TR') : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ürün Görseli Card */}
      <Card className="bg-gradient-to-br from-background to-muted/20 border shadow-sm">
        <div className="p-3">
          <h2 className="text-sm font-semibold text-foreground mb-3">Ürün Görseli</h2>
          <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                {product.image_url ? (
                  <>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Maximize2 className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
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
      </Card>
    </div>
  );
};

