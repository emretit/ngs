import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Opportunity {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  expectedCloseDate: string | null;
  customerName: string;
}

interface ActiveOpportunitiesWidgetProps {
  opportunities: Opportunity[];
  isLoading: boolean;
}

export const ActiveOpportunitiesWidget = ({ opportunities, isLoading }: ActiveOpportunitiesWidgetProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Aktif Fırsatlar</CardTitle>
        <Target className="h-5 w-5 text-blue-500" />
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
              {opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aktif fırsat bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{opp.title}</p>
                        <p className="text-xs text-muted-foreground">{opp.customerName}</p>
                        {opp.expectedCloseDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(opp.expectedCloseDate), "dd.MM.yyyy", { locale: tr })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-blue-600">
                          {opp.currency === 'TRY' ? '₺' : opp.currency} {opp.value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Badge variant={opp.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                          {opp.status === 'open' ? 'Açık' : 'Devam Ediyor'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {opportunities.length > 0 && (
              <Button
                variant="link"
                className="mt-4 p-0 h-auto w-full justify-center"
                onClick={() => navigate("/opportunities")}
              >
                Tümünü Gör ({opportunities.length}) <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

