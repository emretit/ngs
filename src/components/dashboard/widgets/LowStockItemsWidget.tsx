import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface LowStockItem {
  id: string;
  name: string;
  sku: string | null;
  stockQuantity: number;
  minStockLevel: number;
  purchasePrice: number;
}

interface LowStockItemsWidgetProps {
  items: LowStockItem[];
  isLoading: boolean;
}

export const LowStockItemsWidget = ({ items, isLoading }: LowStockItemsWidgetProps) => {
  const navigate = useNavigate();
  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { label: 'Stokta Yok', variant: 'destructive' as const };
    if (quantity < minLevel * 0.5) return { label: 'Kritik', variant: 'destructive' as const };
    return { label: 'Düşük', variant: 'secondary' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Düşük Stok Uyarıları</CardTitle>
        <AlertTriangle className="h-5 w-5 text-red-500" />
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
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Düşük stok uyarısı bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const status = getStockStatus(item.stockQuantity, item.minStockLevel);
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Stok: {item.stockQuantity} / Min: {item.minStockLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          ₺{item.purchasePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
        {items.length > 0 && !isLoading && (
          <Button
            variant="link"
            className="mt-4 p-0 h-auto w-full justify-center"
            onClick={() => navigate("/products")}
          >
            Tümünü Gör ({items.length}) <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

