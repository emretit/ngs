import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  TrendingUp,
  DollarSign 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BudgetAlert {
  id: string;
  category: string;
  type: "overbudget" | "approaching" | "warning" | "info";
  severity: "high" | "medium" | "low";
  message: string;
  currentAmount: number;
  budgetAmount: number;
  variance: number;
  variancePercent: number;
  date: string;
  dismissed: boolean;
}

interface BudgetAlertsProps {
  filters: BudgetFiltersState;
}

const BudgetAlerts = ({ filters }: BudgetAlertsProps) => {
  // Mock data - gerçek uygulamada API'den gelecek
  const [alerts, setAlerts] = useState<BudgetAlert[]>([
    {
      id: "1",
      category: "Maaş ve Ücretler",
      type: "overbudget",
      severity: "high",
      message: "Bütçe %5 aşıldı",
      currentAmount: 2100000,
      budgetAmount: 2000000,
      variance: -100000,
      variancePercent: -5,
      date: new Date().toISOString(),
      dismissed: false,
    },
    {
      id: "2",
      category: "Vergi ve Sigorta",
      type: "overbudget",
      severity: "high",
      message: "Bütçe %16.7 aşıldı",
      currentAmount: 700000,
      budgetAmount: 600000,
      variance: -100000,
      variancePercent: -16.7,
      date: new Date().toISOString(),
      dismissed: false,
    },
    {
      id: "3",
      category: "Operasyonel Giderler",
      type: "approaching",
      severity: "medium",
      message: "Bütçenin %81'i kullanıldı",
      currentAmount: 650000,
      budgetAmount: 800000,
      variance: 150000,
      variancePercent: 18.75,
      date: new Date().toISOString(),
      dismissed: false,
    },
    {
      id: "4",
      category: "Genel",
      type: "warning",
      severity: "medium",
      message: "Q3 için tahmini bütçe aşımı bekleniyor",
      currentAmount: 0,
      budgetAmount: 0,
      variance: 0,
      variancePercent: 0,
      date: new Date().toISOString(),
      dismissed: false,
    },
    {
      id: "5",
      category: "Araç Giderleri",
      type: "info",
      severity: "low",
      message: "Beklenenin altında harcama yapılıyor",
      currentAmount: 250000,
      budgetAmount: 300000,
      variance: 50000,
      variancePercent: 16.67,
      date: new Date().toISOString(),
      dismissed: false,
    },
  ]);

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      default:
        return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${(Math.abs(amount) / 1000).toFixed(0)}K`;
  };

  const getAlertIcon = (type: BudgetAlert["type"]) => {
    switch (type) {
      case "overbudget":
        return <AlertTriangle className="h-5 w-5" />;
      case "approaching":
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertColor = (severity: BudgetAlert["severity"]) => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-red-50 border-red-200",
          icon: "text-red-600",
          badge: "bg-red-100 text-red-700 border-red-200",
        };
      case "medium":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: "text-yellow-600",
          badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        };
      case "low":
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: "text-blue-600",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
    }
  };

  const getSeverityLabel = (severity: BudgetAlert["severity"]) => {
    switch (severity) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ));
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  const highPriorityCount = activeAlerts.filter(a => a.severity === "high").length;
  const mediumPriorityCount = activeAlerts.filter(a => a.severity === "medium").length;

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Uyarı</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Kritik</p>
                <p className="text-2xl font-bold text-red-700">{highPriorityCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Uyarı</p>
                <p className="text-2xl font-bold text-yellow-700">{mediumPriorityCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Hedefte</p>
                <p className="text-2xl font-bold text-green-700">3</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktif Uyarılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Herhangi bir uyarı bulunmuyor</p>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const colors = getAlertColor(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                      colors.bg
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("mt-0.5", colors.icon)}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{alert.category}</h4>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", colors.badge)}
                            >
                              {getSeverityLabel(alert.severity)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.date).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{alert.message}</p>
                          {(alert.type === "overbudget" || alert.type === "approaching") && (
                            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Bütçe:</span>
                                <span className="font-semibold">{formatAmount(alert.budgetAmount)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Gerçekleşen:</span>
                                <span className="font-semibold">{formatAmount(alert.currentAmount)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Varyans:</span>
                                <span className={cn(
                                  "font-semibold",
                                  alert.variance >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {formatAmount(alert.variance)} ({alert.variancePercent.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings Info */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Uyarı Eşikleri</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <span className="font-medium text-red-600">Kritik:</span> Bütçe %5'ten fazla aşıldığında</li>
                <li>• <span className="font-medium text-yellow-600">Uyarı:</span> Bütçenin %80-95'i kullanıldığında</li>
                <li>• <span className="font-medium text-blue-600">Bilgi:</span> Önemli değişiklikler ve öneriler için</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetAlerts;

