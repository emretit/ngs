import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Calendar, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Maintenance {
  id: string;
  maintenanceType: string;
  description: string | null;
  maintenanceDate: string;
  cost: number;
  status: string;
  vehicle: string;
}

interface UpcomingMaintenancesWidgetProps {
  maintenances: Maintenance[];
  isLoading: boolean;
}

export const UpcomingMaintenancesWidget = ({ maintenances, isLoading }: UpcomingMaintenancesWidgetProps) => {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Yaklaşan Bakımlar</CardTitle>
        <Wrench className="h-5 w-5 text-violet-500" />
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
            {maintenances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Yaklaşan bakım bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4">
                {maintenances.map((maint) => (
                  <div key={maint.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{maint.maintenanceType}</p>
                      <p className="text-xs text-muted-foreground">{maint.vehicle}</p>
                      {maint.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{maint.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(maint.maintenanceDate), "dd.MM.yyyy", { locale: tr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {maint.cost > 0 && (
                        <p className="text-sm font-semibold text-violet-600">
                          ₺{maint.cost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                      <Badge variant={maint.status === 'planlandı' ? 'secondary' : 'default'} className="text-xs">
                        {maint.status === 'planlandı' ? 'Planlandı' : 'Devam Ediyor'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
        {maintenances.length > 0 && !isLoading && (
          <Button
            variant="link"
            className="mt-4 p-0 h-auto w-full justify-center"
            onClick={() => navigate("/vehicles")}
          >
            Tümünü Gör ({maintenances.length}) <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

