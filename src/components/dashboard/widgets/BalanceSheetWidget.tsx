import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  Building2, 
  Receipt, 
  Package, 
  CreditCard, 
  FileText,
  TrendingUp,
  TrendingDown,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceSheetWidgetProps {
  assets?: {
    bank: number;
    cash: number;
    receivables: number;
    checks: number;
    stock: number;
    total: number;
  };
  liabilities?: {
    payables: number;
    creditCards: number;
    loans: number;
    einvoices: number;
    total: number;
  };
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const BalanceSheetWidget = memo(({ assets, liabilities, isLoading }: BalanceSheetWidgetProps) => {
  if (isLoading || !assets || !liabilities) {
    return (
      <Card className="h-full bg-card border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" />
            Mali Durum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-24" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const netWorth = assets.total - liabilities.total;
  const isPositive = netWorth >= 0;

  const assetItems = [
    { label: "Banka", value: assets.bank, icon: Building2, color: "text-blue-500" },
    { label: "Nakit", value: assets.cash, icon: Wallet, color: "text-green-500" },
    { label: "Alacaklar", value: assets.receivables, icon: Receipt, color: "text-emerald-500" },
    { label: "Çekler", value: assets.checks, icon: FileText, color: "text-amber-500" },
    { label: "Stok", value: assets.stock, icon: Package, color: "text-indigo-500" },
  ];

  const liabilityItems = [
    { label: "Borçlar", value: liabilities.payables, icon: Building2, color: "text-red-500" },
    { label: "Kredi Kartı", value: liabilities.creditCards, icon: CreditCard, color: "text-rose-500" },
    { label: "Krediler", value: liabilities.loans, icon: FileText, color: "text-orange-500" },
    { label: "E-Fatura", value: liabilities.einvoices, icon: Receipt, color: "text-amber-600" },
  ];

  const maxValue = Math.max(assets.total, liabilities.total, 1);
  const assetsPercentage = (assets.total / maxValue) * 100;
  const liabilitiesPercentage = (liabilities.total / maxValue) * 100;

  return (
    <Card className="h-full bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" />
            Mali Durum
          </CardTitle>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
            isPositive 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" 
              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
          )}>
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            Net: {formatCurrency(Math.abs(netWorth))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Visual Balance Bar */}
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
            style={{ width: `${assetsPercentage}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-400 to-red-500 transition-all"
            style={{ width: `${liabilitiesPercentage}%` }}
          />
        </div>

        {/* Two Columns Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Assets Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-800/50">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                VARLIKLAR
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(assets.total)}
              </span>
            </div>
            <div className="space-y-1.5">
              {assetItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-1.5">
                    <item.icon className={cn("h-3 w-3", item.color)} />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Liabilities Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-red-200 dark:border-red-800/50">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                BORÇLAR
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {formatCurrency(liabilities.total)}
              </span>
            </div>
            <div className="space-y-1.5">
              {liabilityItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-1.5">
                    <item.icon className={cn("h-3 w-3", item.color)} />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Net Worth Summary */}
        <div className={cn(
          "mt-3 p-3 rounded-lg border",
          isPositive 
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50" 
            : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Net Değer</span>
            <span className={cn(
              "text-lg font-bold",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {isPositive ? "+" : "-"}{formatCurrency(Math.abs(netWorth))}
            </span>
          </div>
          <Progress 
            value={isPositive ? Math.min((assets.total / (assets.total + liabilities.total)) * 100, 100) : 50} 
            className={cn(
              "h-1.5 mt-2",
              isPositive ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
});

BalanceSheetWidget.displayName = "BalanceSheetWidget";

export default BalanceSheetWidget;
