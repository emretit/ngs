
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
    <div className="container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol - Geri, ikon, başlık */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/products")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
            <Package2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground/70">SKU: {product.sku || 'N/A'}</p>
          </div>
        </div>

        {/* Orta - rozetler */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
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

        {/* Sağ - butonlar */}
        <div className="flex items-center gap-2">
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
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
  );
};

export default ProductDetailsHeader;
