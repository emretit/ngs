import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Calendar, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  title: string;
  totalBudget: number;
  status: string;
  neededByDate: string | null;
}

interface PendingPurchaseRequestsWidgetProps {
  requests: PurchaseRequest[];
  isLoading: boolean;
}

export const PendingPurchaseRequestsWidget = ({ requests, isLoading }: PendingPurchaseRequestsWidgetProps) => {
  const navigate = useNavigate();
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      draft: { label: 'Taslak', variant: 'outline' },
      pending: { label: 'Onay Bekliyor', variant: 'secondary' },
      approved: { label: 'Onaylandı', variant: 'default' }
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Bekleyen Satın Alma Talepleri</CardTitle>
        <ShoppingBag className="h-5 w-5 text-indigo-500" />
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
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bekleyen satın alma talebi bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const statusInfo = getStatusBadge(req.status);
                  return (
                    <div key={req.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground">{req.requestNumber}</p>
                        {req.neededByDate && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(req.neededByDate), "dd.MM.yyyy", { locale: tr })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-indigo-600">
                          ₺{req.totalBudget.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        )}
        {requests.length > 0 && !isLoading && (
          <Button
            variant="link"
            className="mt-4 p-0 h-auto w-full justify-center"
            onClick={() => navigate("/purchase-requests")}
          >
            Tümünü Gör ({requests.length}) <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

