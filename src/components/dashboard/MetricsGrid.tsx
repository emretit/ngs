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

  return (
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
        quickAction={{
          label: "İşlem Ekle",
          onClick: () => navigate("/income-management")
        }}
      />
      
      <KpiWidget
        title="Alacaklar"
        value={`₺${(financialData?.receivables || 0).toLocaleString("tr-TR")}`}
        icon={TrendingUp}
        trend="neutral"
        description="Bekleyen tahsilatlar"
        onClick={() => navigate("/contacts")}
        quickAction={{
          label: "Müşteri Ekle",
          onClick: () => navigate("/contacts")
        }}
      />
      
      <KpiWidget
        title="Borçlar"
        value={`₺${(financialData?.payables || 0).toLocaleString("tr-TR")}`}
        icon={TrendingDown}
        trend="down"
        change={-8.3}
        changeLabel="son aya göre"
        onClick={() => navigate("/purchase")}
        quickAction={{
          label: "Fatura Ekle",
          onClick: () => navigate("/einvoices")
        }}
      />
      
      <KpiWidget
        title="Net Durum"
        value={`₺${(financialData?.netWorth || 0).toLocaleString("tr-TR")}`}
        icon={Package}
        trend="up"
        change={15.2}
        changeLabel="son aya göre"
        quickAction={{
          label: "Rapor Görüntüle",
          onClick: () => navigate("/reports")
        }}
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
        quickAction={{
          label: "Fırsat Ekle",
          onClick: () => navigate("/opportunities")
        }}
      />
      
      <KpiWidget
        title="Bekleyen Aktiviteler"
        value={crmStats?.activities || 0}
        icon={FileText}
        trend="neutral"
        description="Tamamlanmayı bekleyen"
        onClick={() => navigate("/activities")}
        quickAction={{
          label: "Görev Oluştur",
          onClick: () => navigate("/activities")
        }}
      />
      
      <KpiWidget
        title="Teklifler"
        value={crmStats?.proposals || 0}
        icon={ShoppingCart}
        trend="up"
        change={3}
        changeLabel="bu hafta"
        onClick={() => navigate("/proposals")}
        quickAction={{
          label: "Yeni Teklif",
          onClick: () => navigate("/proposals")
        }}
      />

      {/* HR KPIs */}
      <KpiWidget
        title="Çalışanlar"
        value={hrStats?.totalEmployees || 0}
        icon={Users}
        trend="up"
        description={`${hrStats?.onLeave || 0} izinli`}
        onClick={() => navigate("/employees")}
        quickAction={{
          label: "Çalışan Ekle",
          onClick: () => navigate("/employees")
        }}
      />
    </div>
  );
};

export default MetricsGrid;
