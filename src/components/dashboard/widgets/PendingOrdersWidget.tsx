import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  orderNumber: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: string;
  expectedDeliveryDate: string | null;
  customerName: string;
}

interface PendingOrdersWidgetProps {
  orders: Order[];
  isLoading: boolean;
}

export const PendingOrdersWidget = ({ orders, isLoading }: PendingOrdersWidgetProps) => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      pending: { label: 'Bekliyor', variant: 'outline' },
      confirmed: { label: 'Onaylandı', variant: 'default' },
      processing: { label: 'İşleniyor', variant: 'secondary' }
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Bekleyen Siparişler</CardTitle>
        <ShoppingCart className="h-5 w-5 text-orange-500" />
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
          <>
            <ScrollArea className="h-[200px]">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bekleyen sipariş bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const statusInfo = getStatusBadge(order.status);
                    return (
                      <div key={order.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{order.title}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                          {order.expectedDeliveryDate && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(order.expectedDeliveryDate), "dd.MM.yyyy", { locale: tr })}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-semibold text-orange-600">
                            {order.currency === 'TRY' ? '₺' : order.currency} {order.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            {orders.length > 0 && (
              <Button
                variant="link"
                className="mt-4 p-0 h-auto w-full justify-center"
                onClick={() => navigate("/orders/list")}
              >
                Tümünü Gör ({orders.length}) <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

