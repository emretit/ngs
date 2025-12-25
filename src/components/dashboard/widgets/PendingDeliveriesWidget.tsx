import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Calendar, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Delivery {
  id: string;
  deliveryNumber: string;
  status: string;
  plannedDeliveryDate: string | null;
  customerName: string;
}

interface PendingDeliveriesWidgetProps {
  deliveries: Delivery[];
  isLoading: boolean;
}

export const PendingDeliveriesWidget = ({ deliveries, isLoading }: PendingDeliveriesWidgetProps) => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      pending: { label: 'Bekliyor', variant: 'outline' },
      prepared: { label: 'Hazırlanıyor', variant: 'secondary' },
      shipped: { label: 'Kargoda', variant: 'default' }
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Bekleyen Teslimatlar</CardTitle>
        <Truck className="h-5 w-5 text-green-500" />
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
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bekleyen teslimat bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {deliveries.map((del) => {
                    const statusInfo = getStatusBadge(del.status);
                    return (
                      <div key={del.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{del.deliveryNumber}</p>
                          <p className="text-xs text-muted-foreground">{del.customerName}</p>
                          {del.plannedDeliveryDate && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(del.plannedDeliveryDate), "dd.MM.yyyy", { locale: tr })}
                              </p>
                            </div>
                          )}
                        </div>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            {deliveries.length > 0 && (
              <Button
                variant="link"
                className="mt-4 p-0 h-auto w-full justify-center"
                onClick={() => navigate("/deliveries")}
              >
                Tümünü Gör ({deliveries.length}) <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

