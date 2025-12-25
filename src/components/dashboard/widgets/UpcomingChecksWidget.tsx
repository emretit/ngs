import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UpcomingCheck {
  id: string;
  checkNumber: string;
  amount: number;
  dueDate: string;
  issuerName: string;
  status: string;
}

interface UpcomingChecksWidgetProps {
  checks: UpcomingCheck[];
  isLoading?: boolean;
}

const UpcomingChecksWidget = ({ checks, isLoading }: UpcomingChecksWidgetProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Yaklaşan Çek/Senetler
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

  if (checks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Yaklaşan Çek/Senetler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Yaklaşan çek/senet bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Yaklaşan Çek/Senetler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.slice(0, 5).map((check) => (
          <div
            key={check.id}
            className="flex items-center justify-between p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            onClick={() => navigate(`/checks/${check.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {check.issuerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(check.dueDate), "d MMMM yyyy", { locale: tr })} • {check.checkNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                ₺{check.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {checks.length > 5 && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate("/checks")}
          >
            Tümünü Gör ({checks.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingChecksWidget;

