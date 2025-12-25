import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TopSellingProduct {
  id: string;
  name: string;
  totalSales: number;
  quantity: number;
}

interface TopSellingProductsWidgetProps {
  products: TopSellingProduct[];
  isLoading: boolean;
}

const TopSellingProductsWidget = ({ products, isLoading }: TopSellingProductsWidgetProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">En Çok Satan Ürünler</CardTitle>
        <Package className="h-5 w-5 text-indigo-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Satış verisi bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4">
                {products.slice(0, 5).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity.toLocaleString("tr-TR")} adet
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-indigo-600 whitespace-nowrap">
                        ₺{product.totalSales.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
        {!isLoading && products.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/products")}
          >
            Tüm Ürünleri Gör <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSellingProductsWidget;

