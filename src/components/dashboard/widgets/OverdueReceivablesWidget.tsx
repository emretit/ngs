import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useOverdueBalances } from "@/hooks/useOverdueBalances";
import { formatCurrency } from "@/utils/formatters";
import { differenceInDays } from "date-fns";

interface OverdueReceivablesWidgetProps {
  receivables?: never; // Artık kullanılmıyor
  isLoading?: never; // Artık kullanılmıyor
}

const OverdueReceivablesWidget = ({}: OverdueReceivablesWidgetProps) => {
  const navigate = useNavigate();
  const { data: overdueBalances = [], isLoading } = useOverdueBalances();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Vadesi Geçen Alacaklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (overdueBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-600" />
            Vadesi Geçen Alacaklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Vadesi geçen alacak bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          Vadesi Geçen Alacaklar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdueBalances.slice(0, 5).map((balance) => {
          const daysOverdue = balance.oldestOverdueDate
            ? differenceInDays(new Date(), new Date(balance.oldestOverdueDate))
            : 0;

          return (
          <div
              key={balance.customerId}
            className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/customers/${balance.customerId}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                  {balance.customerName}
              </p>
              <p className="text-xs text-muted-foreground">
                  {daysOverdue > 0 ? `${daysOverdue} gün geçti` : "Vadesi geçmiş"}
                  {balance.upcomingBalance > 0 && (
                    <span className="ml-2">
                      • Vadesi gelmemiş: {formatCurrency(balance.upcomingBalance)} {balance.currency}
                    </span>
                  )}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                  {formatCurrency(balance.overdueBalance)} {balance.currency}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          );
        })}
        {overdueBalances.length > 5 && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate("/customers?filter=overdue")}
          >
            Tümünü Gör ({overdueBalances.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default OverdueReceivablesWidget;

