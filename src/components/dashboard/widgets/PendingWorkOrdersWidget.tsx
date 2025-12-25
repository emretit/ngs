import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface WorkOrder {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  scheduledStart: string | null;
  customerName: string;
}

interface PendingWorkOrdersWidgetProps {
  workOrders: WorkOrder[];
  isLoading: boolean;
}

export const PendingWorkOrdersWidget = ({ workOrders, isLoading }: PendingWorkOrdersWidgetProps) => {
  const navigate = useNavigate();
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      low: { label: 'Düşük', variant: 'outline' },
      normal: { label: 'Normal', variant: 'secondary' },
      high: { label: 'Yüksek', variant: 'default' },
      urgent: { label: 'Acil', variant: 'destructive' }
    };
    return priorityMap[priority] || { label: priority, variant: 'outline' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Bekleyen İş Emirleri</CardTitle>
        <ClipboardList className="h-5 w-5 text-amber-500" />
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
            {workOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bekleyen iş emri bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4">
                {workOrders.map((wo) => {
                  const priorityInfo = getPriorityBadge(wo.priority);
                  return (
                    <div key={wo.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{wo.title}</p>
                        <p className="text-xs text-muted-foreground">{wo.customerName}</p>
                        {wo.scheduledStart && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(wo.scheduledStart), "dd.MM.yyyy HH:mm", { locale: tr })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={priorityInfo.variant} className="text-xs">
                          {priorityInfo.label}
                        </Badge>
                        <Badge variant={wo.status === 'assigned' ? 'secondary' : 'default'} className="text-xs">
                          {wo.status === 'assigned' ? 'Atandı' : 'Devam Ediyor'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
        {workOrders.length > 0 && !isLoading && (
          <Button
            variant="link"
            className="mt-4 p-0 h-auto w-full justify-center"
            onClick={() => navigate("/production/work-orders")}
          >
            Tümünü Gör ({workOrders.length}) <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

