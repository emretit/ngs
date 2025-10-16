import { memo } from "react";
import { useNavigate } from "react-router-dom";
import KpiWidget from "./KpiWidget";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Target,
  DollarSign,
} from "lucide-react";

interface MetricsGridProps {
  crmStats?: {
    opportunities: number;
    activities: number;
    proposals: number;
  };
  financialData?: {
    cashFlow: number;
    receivables: number;
    payables: number;
    netWorth: number;
  };
}

const MetricsGrid = ({ crmStats, financialData }: MetricsGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-fade-in">
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
          onClick: () => navigate("/cashflow")
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
          onClick: () => navigate("/contacts/new")
        }}
      />

      <KpiWidget
        title="Borçlar"
        value={`₺${(financialData?.payables || 0).toLocaleString("tr-TR")}`}
        icon={TrendingDown}
        trend="down"
        change={-8.3}
        changeLabel="son aya göre"
        onClick={() => navigate("/purchasing")}
        quickAction={{
          label: "Fatura Ekle",
          onClick: () => navigate("/einvoices")
        }}
      />

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
        title="Teklifler"
        value={crmStats?.proposals || 0}
        icon={ShoppingCart}
        trend="up"
        change={3}
        changeLabel="bu hafta"
        onClick={() => navigate("/proposals")}
        quickAction={{
          label: "Yeni Teklif",
          onClick: () => navigate("/proposal/create")
        }}
      />
    </div>
  );
};

export default memo(MetricsGrid);