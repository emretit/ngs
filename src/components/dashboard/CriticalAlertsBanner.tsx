import { useNavigate } from "react-router-dom";
import { useCriticalAlerts, CriticalAlert } from "@/hooks/useCriticalAlerts";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  CheckSquare,
  ChevronRight,
  X,
  BanknoteIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const alertIcons: Record<CriticalAlert["type"], React.ElementType> = {
  overdue_receivable: BanknoteIcon,
  due_check: FileText,
  urgent_approval: CheckSquare,
  overdue_task: Clock,
};

const alertLabels: Record<CriticalAlert["type"], string> = {
  overdue_receivable: "Vadesi Geçmiş",
  due_check: "Çek",
  urgent_approval: "Onay",
  overdue_task: "Görev",
};

export const CriticalAlertsBanner = () => {
  const navigate = useNavigate();
  const { data: alerts = [], isLoading } = useCriticalAlerts();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id)).slice(0, 5);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  if (isLoading || visibleAlerts.length === 0) {
    return null;
  }

  const criticalCount = visibleAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = visibleAlerts.filter((a) => a.severity === "warning").length;

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

      {/* Alerts List */}
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-thin">
        {visibleAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          const severityStyles = {
            critical: "bg-destructive/10 border-destructive/40 hover:bg-destructive/15",
            warning: "bg-orange-500/10 border-orange-500/40 hover:bg-orange-500/15",
            info: "bg-primary/10 border-primary/40 hover:bg-primary/15",
          };
          const iconStyles = {
            critical: "text-destructive",
            warning: "text-orange-500",
            info: "text-primary",
          };

          return (
            <div
              key={alert.id}
              onClick={() => navigate(alert.link)}
              className={cn(
                "group relative flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all min-w-[280px] max-w-[320px]",
                severityStyles[alert.severity]
              )}
            >
              {/* Dismiss Button */}
              <button
                onClick={(e) => handleDismiss(alert.id, e)}
                className="absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>

              {/* Icon */}
              <div className={cn("p-2 rounded-lg bg-background/80", iconStyles[alert.severity])}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", 
                    alert.severity === "critical" ? "bg-destructive/20 text-destructive" : 
                    alert.severity === "warning" ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" : 
                    "bg-primary/20 text-primary"
                  )}>
                    {alertLabels[alert.type]}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate mt-0.5">
                  {alert.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {alert.amount && (
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(alert.amount)}
                    </span>
                  )}
                  {alert.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(alert.dueDate), "d MMM", { locale: tr })}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
