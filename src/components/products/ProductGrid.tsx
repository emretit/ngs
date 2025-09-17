
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "@/components/ui/infinite-scroll";

import { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  onProductClick?: (product: Product) => void;
  onProductSelect?: (product: Product) => void;
  selectedProducts?: Product[];
}

const ProductGrid = ({
  products,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  onProductClick,
  onProductSelect,
  selectedProducts = []
}: ProductGridProps) => {
  const navigate = useNavigate();

  const getStockStatusBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Stok Yok</Badge>;
    }
    if (quantity <= 5) {
      return <Badge variant="warning">Az Stok</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-[200px] w-full rounded-md mb-4" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Ürün bulunamadı
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {products.map((product) => (
        <Card 
          key={product.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/product-details/${product.id}`)}
        >
          <CardContent className="p-4">
            <div className="aspect-square relative mb-4 bg-gray-100 rounded-md overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Resim Yok
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStockStatusBadge(product.stock_quantity)}
              </div>
            </div>
            <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
            <div className="text-lg font-semibold">
              {product.price.toLocaleString('tr-TR', { style: 'currency', currency: product.currency })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Infinite Scroll Trigger */}
      <InfiniteScroll
        hasNextPage={hasNextPage}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        className="col-span-full mt-4"
      >
        <div />
      </InfiniteScroll>
    </div>
  );
};

export default ProductGrid;
