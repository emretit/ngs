import { useNavigate } from "react-router-dom";
import KpiWidget from "./KpiWidget";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  Target,
  FileText,
  DollarSign,
  Plus,
  Calendar,
} from "lucide-react";

interface MetricsGridProps {
  crmStats?: {
    opportunities: number;
    activities: number;
    proposals: number;
  };
  hrStats?: {
    totalEmployees: number;
    onLeave: number;
  };
  financialData?: {
    cashFlow: number;
    receivables: number;
    payables: number;
    netWorth: number;
  };
}

const MetricsGrid = ({ crmStats, hrStats, financialData }: MetricsGridProps) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      label: "Yeni Teklif",
      icon: FileText,
      onClick: () => navigate("/proposals"),
    },
    {
      label: "Müşteri Ekle",
      icon: Users,
      onClick: () => navigate("/contacts"),
    },
    {
      label: "Ürün Ekle",
      icon: Package,
      onClick: () => navigate("/products"),
    },
    {
      label: "Görev Oluştur",
      icon: Calendar,
      onClick: () => navigate("/activities"),
    },
    {
      label: "Fırsat Ekle",
      icon: Target,
      onClick: () => navigate("/opportunities"),
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {/* Financial KPIs */}
        <KpiWidget
          title="Nakit Akışı"
          value={`₺${(financialData?.cashFlow || 0).toLocaleString("tr-TR")}`}
          icon={DollarSign}
          trend="up"
          change={12.5}
          changeLabel="son aya göre"
          onClick={() => navigate("/cashflow")}
        />
        
        <KpiWidget
          title="Alacaklar"
          value={`₺${(financialData?.receivables || 0).toLocaleString("tr-TR")}`}
          icon={TrendingUp}
          trend="neutral"
          description="Bekleyen tahsilatlar"
          onClick={() => navigate("/contacts")}
        />
        
        <KpiWidget
          title="Borçlar"
          value={`₺${(financialData?.payables || 0).toLocaleString("tr-TR")}`}
          icon={TrendingDown}
          trend="down"
          change={-8.3}
          changeLabel="son aya göre"
          onClick={() => navigate("/purchase")}
        />
        
        <KpiWidget
          title="Net Durum"
          value={`₺${(financialData?.netWorth || 0).toLocaleString("tr-TR")}`}
          icon={Package}
          trend="up"
          change={15.2}
          changeLabel="son aya göre"
        />

        {/* CRM KPIs */}
        <KpiWidget
          title="Aktif Fırsatlar"
          value={crmStats?.opportunities || 0}
          icon={Target}
          trend="up"
          change={5}
          changeLabel="yeni fırsat"
          onClick={() => navigate("/opportunities")}
        />
        
        <KpiWidget
          title="Bekleyen Aktiviteler"
          value={crmStats?.activities || 0}
          icon={FileText}
          trend="neutral"
          description="Tamamlanmayı bekleyen"
          onClick={() => navigate("/activities")}
        />
        
        <KpiWidget
          title="Teklifler"
          value={crmStats?.proposals || 0}
          icon={ShoppingCart}
          trend="up"
          change={3}
          changeLabel="bu hafta"
          onClick={() => navigate("/proposals")}
        />

        {/* HR KPIs */}
        <KpiWidget
          title="Çalışanlar"
          value={hrStats?.totalEmployees || 0}
          icon={Users}
          trend="up"
          description={`${hrStats?.onLeave || 0} izinli`}
          onClick={() => navigate("/employees")}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 px-1">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Hızlı İşlemler:</span>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={action.onClick}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MetricsGrid;
