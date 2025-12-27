import { 
  ArrowRight, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  FileCheck, 
  FileX, 
  Landmark, 
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCashflowPipeline } from "@/hooks/useCashflowPipeline";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number, currency: string = "TRY") => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

interface CashflowStage {
  id: string;
  label: string;
  icon: React.ElementType;
  value: number;
  count: number;
  alert: number;
  alertLabel: string;
  color: string;
  bgColor: string;
  trend: "up" | "down" | "neutral";
  route: string;
}

export function CashflowPipeline() {
  const { data, isLoading } = useCashflowPipeline();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-60" />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-28 flex-1 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const stages: CashflowStage[] = [
    {
      id: 'receivables',
      label: 'Alacaklar',
      icon: TrendingUp,
      value: data?.receivables.value || 0,
      count: data?.receivables.count || 0,
      alert: data?.receivables.overdue || 0,
      alertLabel: 'vadesi geçmiş',
      color: 'bg-emerald-500',
      bgColor: 'from-emerald-50 to-emerald-100/50',
      trend: "up",
      route: '/sales-invoices'
    },
    {
      id: 'checks-receivable',
      label: 'Alınan Çekler',
      icon: FileCheck,
      value: data?.checksReceivable.value || 0,
      count: data?.checksReceivable.count || 0,
      alert: data?.checksReceivable.dueSoon || 0,
      alertLabel: 'yakında vadeli',
      color: 'bg-teal-500',
      bgColor: 'from-teal-50 to-teal-100/50',
      trend: "up",
      route: '/cashflow/checks'
    },
    {
      id: 'bank',
      label: 'Banka',
      icon: Landmark,
      value: data?.bankBalance.totalTRY || 0,
      count: data?.bankBalance.accountCount || 0,
      alert: 0,
      alertLabel: '',
      color: 'bg-blue-500',
      bgColor: 'from-blue-50 to-blue-100/50',
      trend: "neutral",
      route: '/cashflow/bank-accounts'
    },
    {
      id: 'cash',
      label: 'Kasa',
      icon: Banknote,
      value: data?.cashBalance.total || 0,
      count: data?.cashBalance.accountCount || 0,
      alert: 0,
      alertLabel: '',
      color: 'bg-violet-500',
      bgColor: 'from-violet-50 to-violet-100/50',
      trend: "neutral",
      route: '/cashflow/bank-accounts'
    },
    {
      id: 'checks-payable',
      label: 'Verilen Çekler',
      icon: FileX,
      value: data?.checksPayable.value || 0,
      count: data?.checksPayable.count || 0,
      alert: data?.checksPayable.dueSoon || 0,
      alertLabel: 'yakında vadeli',
      color: 'bg-orange-500',
      bgColor: 'from-orange-50 to-orange-100/50',
      trend: "down",
      route: '/cashflow/checks'
    },
    {
      id: 'payables',
      label: 'Borçlar',
      icon: TrendingDown,
      value: data?.payables.value || 0,
      count: data?.payables.count || 0,
      alert: data?.payables.overdue || 0,
      alertLabel: 'vadesi geçmiş',
      color: 'bg-red-500',
      bgColor: 'from-red-50 to-red-100/50',
      trend: "down",
      route: '/purchase-invoices'
    }
  ];

  // Calculate net position
  const totalIn = (data?.receivables.value || 0) + (data?.checksReceivable.value || 0);
  const totalOut = (data?.payables.value || 0) + (data?.checksPayable.value || 0);
  const currentCash = (data?.bankBalance.totalTRY || 0) + (data?.cashBalance.total || 0);
  const netPosition = currentCash + totalIn - totalOut;

  return (
    <div className="w-full">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Nakit Akış Pipeline</h3>
            <p className="text-xs text-muted-foreground">Alacak → Çek Girişi → Banka/Kasa → Çek Çıkışı → Borç</p>
          </div>
        </div>
        
        {/* Net Position Badge */}
        <div className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1",
          netPosition >= 0 
            ? "bg-emerald-100 text-emerald-700" 
            : "bg-red-100 text-red-700"
        )}>
          {netPosition >= 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          Net: {formatCompactCurrency(Math.abs(netPosition))}
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-[130px]">
              {/* Stage Card */}
              <button
                onClick={() => navigate(stage.route)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
                  "bg-gradient-to-br",
                  stage.bgColor,
                  "border-transparent hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", stage.color)}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground truncate">{stage.label}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg font-bold text-foreground">
                    {formatCompactCurrency(stage.value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stage.count} adet
                  </div>
                  {stage.alert > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{stage.alert} {stage.alertLabel}</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Arrow Connector */}
              {index < stages.length - 1 && (
                <div className="px-1 flex-shrink-0">
                  <ArrowRight className={cn(
                    "h-4 w-4",
                    index === 2 ? "text-primary" : "text-muted-foreground/30"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          <div>
            <div className="text-xs text-muted-foreground">Toplam Giriş</div>
            <div className="text-sm font-semibold text-foreground">{formatCompactCurrency(totalIn)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <Landmark className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-xs text-muted-foreground">Mevcut Nakit</div>
            <div className="text-sm font-semibold text-foreground">{formatCompactCurrency(currentCash)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
          <ArrowDownRight className="h-4 w-4 text-red-600" />
          <div>
            <div className="text-xs text-muted-foreground">Toplam Çıkış</div>
            <div className="text-sm font-semibold text-foreground">{formatCompactCurrency(totalOut)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div>
            <div className="text-xs text-muted-foreground">Vadesi Geçen</div>
            <div className="text-sm font-semibold text-foreground">
              {(data?.receivables.overdue || 0) + (data?.payables.overdue || 0)} adet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
