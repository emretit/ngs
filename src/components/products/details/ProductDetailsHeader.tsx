
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download, Edit, Package2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";

interface ProductDetailsHeaderProps {
  product: Product;
  isLoading: boolean;
}

const ProductDetailsHeader = ({ product, isLoading }: ProductDetailsHeaderProps) => {
  const navigate = useNavigate();

  const duplicateProductMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      
      const newProduct = {
        ...product,
        name: `${product.name} (Kopya)`,
        sku: `${product.sku}-copy`,
        barcode: null,
      };
      
      delete newProduct.id;
      delete newProduct.created_at;
      delete newProduct.updated_at;

      const { data, error } = await supabase
        .from("products")
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newProduct) => {
      toast.success("Ürün başarıyla kopyalandı");
      navigate(`/product-details/${newProduct.id}`);
    },
    onError: () => {
      toast.error("Ürün kopyalanırken bir hata oluştu");
    },
  });

  if (isLoading || !product) return null;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm -mx-6 px-6">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button
            onClick={() => navigate("/products")}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Ürünler
          </Button>
          
          {/* Title Section */}
          <div className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {product.name}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                SKU: {product.sku || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side - Badges and Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <Badge variant={product.is_active ? "default" : "secondary"} className="h-6 px-2 text-[11px]">
              {product.is_active ? "Aktif" : "Pasif"}
            </Badge>
            <Badge
              variant={
                product.stock_quantity <= 0 ? "destructive" :
                product.stock_quantity <= product.min_stock_level ? "warning" :
                "default"
              }
              className="h-6 px-2 text-[11px]"
            >
              {product.stock_quantity <= 0 ? "Stokta Yok" :
               product.stock_quantity <= product.min_stock_level ? "Düşük Stok" :
               "Stokta"}
            </Badge>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold" 
              onClick={() => navigate(`/product-form/${product.id}`)}
            >
              <Edit className="h-4 w-4" />
              <span>Düzenle</span>
            </Button>
            <Button variant="outline" onClick={() => duplicateProductMutation.mutate()}>
              <Copy className="h-4 w-4 mr-2" />
              Kopyala
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsHeader;
