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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      <KpiWidget
        title="Aylık Ciro"
        value={`₺${(financialData?.cashFlow || 0).toLocaleString("tr-TR")}`}
        icon={DollarSign}
        trend="up"
        change={12.5}
        changeLabel="bu ayki satış"
        onClick={() => navigate("/invoices")}
        quickAction={{
          label: "Fatura Ekle",
          onClick: () => navigate("/invoices/new")
        }}
      />

      <KpiWidget
        title="Müşteriler"
        value={`₺${(financialData?.receivables || 0).toLocaleString("tr-TR")}`}
        icon={TrendingUp}
        trend="neutral"
        description="Bekleyen tahsilatlar"
        onClick={() => navigate("/customers")}
        quickAction={{
          label: "Müşteri Ekle",
          onClick: () => navigate("/customers/new")
        }}
      />

      <KpiWidget
        title="Tedarikçiler"
        value={`₺${(financialData?.payables || 0).toLocaleString("tr-TR")}`}
        icon={TrendingDown}
        trend="down"
        change={-8.3}
        changeLabel="son aya göre"
        onClick={() => navigate("/suppliers")}
        quickAction={{
          label: "Tedarikçi Ekle",
          onClick: () => navigate("/suppliers/new")
        }}
      />

    </div>
  );
};

export default memo(MetricsGrid);