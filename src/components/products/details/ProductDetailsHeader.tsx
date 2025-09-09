
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
    <>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <Package2 className="h-5 w-5" />
            <h1 className="text-lg font-semibold">{product.name}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => duplicateProductMutation.mutate()}>
              <Copy className="h-4 w-4 mr-2" />
              Kopyala
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => navigate(`/product-form/${product.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={product.is_active ? "default" : "secondary"}>
            {product.is_active ? "Aktif" : "Pasif"}
          </Badge>
          <Badge variant={
            product.stock_quantity <= 0 ? "destructive" : 
            product.stock_quantity <= product.min_stock_level ? "warning" : 
            "default"
          }>
            {product.stock_quantity <= 0 ? "Stokta Yok" : 
             product.stock_quantity <= product.min_stock_level ? "Düşük Stok" : 
             "Stokta"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            SKU: {product.sku || "N/A"}
          </span>
        </div>
      </div>
    </>
  );
};

export default ProductDetailsHeader;
