import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ServiceRequest {
  id: string;
  serviceNumber: string | null;
  serviceTitle: string;
  status: string;
  priority: string;
  dueDate: string | null;
  customerName: string;
}

interface ActiveServiceRequestsWidgetProps {
  requests: ServiceRequest[];
  isLoading: boolean;
}

export const ActiveServiceRequestsWidget = ({ requests, isLoading }: ActiveServiceRequestsWidgetProps) => {
  const navigate = useNavigate();
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      low: { label: 'Düşük', variant: 'outline' },
      medium: { label: 'Orta', variant: 'secondary' },
      high: { label: 'Yüksek', variant: 'default' },
      urgent: { label: 'Acil', variant: 'destructive' }
    };
    return priorityMap[priority] || { label: priority, variant: 'outline' as const };
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      new: { label: 'Yeni', variant: 'outline' },
      assigned: { label: 'Atandı', variant: 'secondary' },
      in_progress: { label: 'Devam Ediyor', variant: 'default' }
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Aktif Servis Talepleri</CardTitle>
        <Wrench className="h-5 w-5 text-teal-500" />
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
              <p className="text-sm text-muted-foreground">Aktif servis talebi bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((sr) => {
                  const priorityInfo = getPriorityBadge(sr.priority);
                  const statusInfo = getStatusBadge(sr.status);
                  return (
                    <div key={sr.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sr.serviceTitle}</p>
                        <p className="text-xs text-muted-foreground">{sr.customerName}</p>
                        {sr.dueDate && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(sr.dueDate), "dd.MM.yyyy HH:mm", { locale: tr })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={priorityInfo.variant} className="text-xs">
                          {priorityInfo.label}
                        </Badge>
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
            onClick={() => navigate("/service/management")}
          >
            Tümünü Gör ({requests.length}) <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

