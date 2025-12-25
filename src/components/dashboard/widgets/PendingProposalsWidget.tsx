import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Proposal {
  id: string;
  number: string;
  title: string;
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  customerName: string;
}

interface PendingProposalsWidgetProps {
  proposals: Proposal[];
  isLoading: boolean;
}

export const PendingProposalsWidget = ({ proposals, isLoading }: PendingProposalsWidgetProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Bekleyen Teklifler</CardTitle>
        <FileText className="h-5 w-5 text-purple-500" />
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
              {proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bekleyen teklif bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {proposals.map((prop) => (
                    <div key={prop.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prop.title}</p>
                        <p className="text-xs text-muted-foreground">{prop.customerName}</p>
                        {prop.validUntil && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(prop.validUntil), "dd.MM.yyyy", { locale: tr })}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-purple-600">
                        {prop.currency === 'TRY' ? '₺' : prop.currency} {prop.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {proposals.length > 0 && (
              <Button
                variant="link"
                className="mt-4 p-0 h-auto w-full justify-center"
                onClick={() => navigate("/proposals")}
              >
                Tümünü Gör ({proposals.length}) <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

