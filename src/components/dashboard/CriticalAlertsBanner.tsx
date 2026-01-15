import { useNavigate } from "react-router-dom";
import { useCriticalAlerts, CriticalAlert } from "@/hooks/useCriticalAlerts";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight,
  BanknoteIcon,
  Wallet
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const alertIcons: Record<CriticalAlert["type"], React.ElementType> = {
  overdue_receivable: BanknoteIcon,
  due_check: FileText,
  expired_proposal: Clock,
  due_loan_installment: Wallet,
};

const alertLabels: Record<CriticalAlert["type"], string> = {
  overdue_receivable: "Vadesi Geçmiş",
  due_check: "Çek",
  expired_proposal: "Süresi Geçmiş Teklif",
  due_loan_installment: "Kredi Taksiti",
};

const alertLinks: Record<CriticalAlert["type"], string> = {
  overdue_receivable: "/customers",
  due_check: "/finance/checks",
  expired_proposal: "/proposals",
  due_loan_installment: "/finance/loans",
};

// Tüm alert tiplerini tanımla
const allAlertTypes: CriticalAlert["type"][] = [
  "overdue_receivable",
  "due_check",
  "expired_proposal",
  "due_loan_installment"
];

export const CriticalAlertsBanner = () => {
  const navigate = useNavigate();
  const { data: alerts = [], isLoading } = useCriticalAlerts();

  if (isLoading) {
    return null;
  }

  // Uyarıları tipe göre grupla
  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.type]) {
      acc[alert.type] = [];
    }
    acc[alert.type].push(alert);
    return acc;
  }, {} as Record<CriticalAlert["type"], CriticalAlert[]>);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-destructive/30 bg-gradient-to-r from-destructive/5 via-background to-orange-500/5">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-destructive/10 border-b border-destructive/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-sm font-semibold text-destructive">Dikkat Gerektiren İşlemler</span>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                {criticalCount} Kritik
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white">
                {warningCount} Uyarı
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grouped Alerts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {allAlertTypes.map((type) => {
          const typeAlerts = groupedAlerts[type] || [];
          const Icon = alertIcons[type];
          const mostSevere = typeAlerts.some(a => a.severity === "critical") ? "critical" :
                             typeAlerts.some(a => a.severity === "warning") ? "warning" : "info";

          const severityStyles = {
            critical: "bg-destructive/10 border-destructive/40",
            warning: "bg-orange-500/10 border-orange-500/40",
            info: "bg-primary/10 border-primary/40",
          };
          const iconStyles = {
            critical: "text-destructive",
            warning: "text-orange-500",
            info: "text-primary",
          };

          return (
            <div
              key={type}
              className={cn(
                "rounded-xl border transition-all duration-300 hover:shadow-md",
                typeAlerts.length > 0 ? severityStyles[mostSevere] : "bg-muted/5 border-border/30"
              )}
            >
              {/* Group Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
                <div className={cn(
                  "p-1.5 rounded-lg bg-background/80",
                  typeAlerts.length > 0 ? iconStyles[mostSevere] : "text-muted-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-xs font-semibold truncate",
                    typeAlerts.length > 0
                      ? (mostSevere === "critical" ? "text-destructive" :
                         mostSevere === "warning" ? "text-orange-600 dark:text-orange-400" :
                         "text-primary")
                      : "text-muted-foreground"
                  )}>
                    {alertLabels[type]}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                  {typeAlerts.length}
                </span>
              </div>

              {/* Items List */}
              <div className="p-2 space-y-1">
                {typeAlerts.length > 0 ? (
                  <>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                      {typeAlerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => navigate(alert.link)}
                          className="group relative flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-background/80 cursor-pointer transition-all"
                        >
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate leading-tight">
                              {alert.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {alert.amount && (
                                <span className="text-[10px] font-semibold text-foreground">
                                  {formatCurrency(alert.amount)}
                                </span>
                              )}
                              {alert.dueDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(alert.dueDate), "d MMM", { locale: tr })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>

                    {/* Show More Link */}
                    {typeAlerts.length > 5 && (
                      <div className="pt-1 border-t border-border/30">
                        <button
                          onClick={() => navigate(alertLinks[type])}
                          className="w-full px-2 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded transition-all flex items-center justify-center gap-1"
                        >
                          <span>+{typeAlerts.length - 5} daha</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-4 text-center">
                    <p className="text-xs text-muted-foreground">Henüz yok</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
