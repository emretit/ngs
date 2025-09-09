
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Benzer Ürünler
        </h2>
        <div className="space-y-4">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductRelated;
