
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Product } from "@/types/product";

interface ProductRelatedProps {
  categoryId: string;
  currentProductId: string;
  relatedProducts: string[];
  onUpdate: (updates: Partial<Product>) => void;
}

const ProductRelated = ({ 
  categoryId, 
  currentProductId,
  relatedProducts,
  onUpdate 
}: ProductRelatedProps) => {
  const { data: suggestedProducts, isLoading } = useQuery({
    queryKey: ["suggested-products", categoryId, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, price, currency")
        .eq("category_id", categoryId)
        .neq("id", currentProductId)
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });

  if (isLoading || !suggestedProducts?.length) {
    return null;
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-50 to-pink-50/50 border border-pink-200/50">
            <Link2 className="h-4 w-4 text-pink-600" />
          </div>
          Benzer Ürünler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {suggestedProducts.map((product) => (
          <Link
            key={product.id}
            to={`/product-details/${product.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <p className="text-sm text-gray-500">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: product.currency
                }).format(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProductRelated;
