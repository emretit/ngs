import React from "react";
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Calculator } from "lucide-react";
import { CashflowMainItem } from "@/hooks/useCashflowMain";

interface CashflowHeaderProps {
  data?: CashflowMainItem[];
  selectedYear: number;
  activeView?: "overview" | "analytics" | "forecast";
  setActiveView?: (view: "overview" | "analytics" | "forecast") => void;
}

const CASHFLOW_STRUCTURE = {
  inflows: ['operating_inflows', 'investing_activities', 'financing_activities'],
  outflows: ['operating_outflows'],
  balance: ['opening_balance', 'closing_balance']
};

const CashflowHeader = ({
  data = [],
  selectedYear,
  activeView = "overview",
  setActiveView
}: CashflowHeaderProps) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total inflows
  const totalInflows = data
    .filter(item => CASHFLOW_STRUCTURE.inflows.includes(item.main_category))
    .reduce((sum, item) => sum + item.value, 0);

  // Calculate total outflows
  const totalOutflows = data
    .filter(item => CASHFLOW_STRUCTURE.outflows.includes(item.main_category))
    .reduce((sum, item) => sum + item.value, 0);

  // Calculate net cash flow
  const netCashFlow = totalInflows - totalOutflows;

  // Calculate monthly average
  const monthlyAverage = netCashFlow / 12;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Nakit Akış Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Gelir ve masraflarınızı profesyonel bir şekilde yönetin ve analiz edin.
            </p>
          </div>
        </div>

        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam Nakit Girişi */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">Nakit Girişi</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(totalInflows)}
            </span>
          </div>

          {/* Toplam Nakit Çıkışı */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
            <TrendingDown className="h-3 w-3" />
            <span className="font-medium">Nakit Çıkışı</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(totalOutflows)}
            </span>
          </div>

          {/* Net Nakit Akışı */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border shadow-sm ${
            netCashFlow >= 0
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600'
          }`}>
            <BarChart3 className="h-3 w-3" />
            <span className="font-bold">Net Akış</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(netCashFlow)}
            </span>
          </div>

          {/* Aylık Ortalama */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
            <Calculator className="h-3 w-3" />
            <span className="font-medium">Aylık Ort.</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(monthlyAverage)}
            </span>
          </div>
        </div>

        {/* Sağ taraf - View Toggle */}
        {setActiveView && (
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeView === "overview"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Özet
            </button>
            <button
              onClick={() => setActiveView("analytics")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeView === "analytics"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Analiz
            </button>
            <button
              onClick={() => setActiveView("forecast")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeView === "forecast"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tahmin
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CashflowHeader;
