
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit, Package2, TrendingUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";

interface ProductDetailsHeaderProps {
  product: Product;
  id: string;
  onEdit: () => void;
  onUpdate?: (updatedProduct: Product) => void;
}

const ProductDetailsHeader = ({ product, id, onEdit, onUpdate }: ProductDetailsHeaderProps) => {
  const queryClient = useQueryClient();

  const duplicateProductMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      
      const newProduct = {
        ...product,
        name: `${product.name} (Kopya)`,
        sku: product.sku ? `${product.sku}-copy` : null,
        barcode: null,
      };
      
      delete (newProduct as any).id;
      delete (newProduct as any).created_at;
      delete (newProduct as any).updated_at;

      const { data, error } = await supabase
        .from("products")
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (newProduct) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ürün başarıyla kopyalandı");
      if (newProduct) {
        window.location.href = `/product-details/${newProduct.id}`;
      }
    },
    onError: () => {
      toast.error("Ürün kopyalanırken bir hata oluştu");
    },
  });

  const getStockStatus = () => {
    if (product.stock_quantity <= 0) return { label: "Stokta Yok", color: "bg-red-100 text-red-800 border-red-300" };
    if (product.stock_quantity <= (product.stock_threshold || product.min_stock_level || 0)) {
      return { label: "Düşük Stok", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    }
    return { label: "Stokta", color: "bg-green-100 text-green-800 border-green-300" };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <Link 
          to="/products" 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <Package2 className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {product.name}
          </h1>
          <p className="text-xs text-muted-foreground/70">
            SKU: {product.sku || 'N/A'} • {product.product_categories?.name || 'Kategorisiz'}
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Durum */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border ${product.is_active ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 shadow-sm' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          <span className="font-bold">Durum</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${product.is_active ? 'bg-white/20' : 'bg-white/50'}`}>
            {product.is_active ? "Aktif" : "Pasif"}
          </span>
        </div>

        {/* Stok Durumu */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${stockStatus.color}`}>
          <span className="font-medium">Stok</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {stockStatus.label}
          </span>
        </div>

        {/* Fiyat */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Fiyat</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(product.price, product.currency || 'TRY')}
          </span>
        </div>
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
          <span>Düzenle</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => duplicateProductMutation.mutate()}
          disabled={duplicateProductMutation.isPending}
        >
          <Copy className="h-4 w-4 mr-2" />
          Kopyala
        </Button>
      </div>
    </div>
  );
};

export default ProductDetailsHeader;
