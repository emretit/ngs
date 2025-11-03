import { Card, CardContent } from "@/components/ui/card";
import { Receipt, FileText, BarChart3, Plus, TrendingUp, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useIncomingInvoices } from "@/hooks/useIncomingInvoices";
import { formatCurrency } from "@/utils/formatters";
import InvoiceAnalysisManager from "@/components/invoices/InvoiceAnalysisManager";
import { useRef, useState } from "react";

const MONTHS = [
  { value: "all", label: "Tüm Aylar" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" }
];

interface InvoiceManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const InvoiceManagement = ({ isCollapsed, setIsCollapsed }: InvoiceManagementProps) => {
  const navigate = useNavigate();
  const analysisRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum.toString());

  // Generate years (5 years back, current year, 2 years forward)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const selectedMonthName = selectedMonth === "all"
    ? "Tüm Aylar"
    : MONTHS.find(m => m.value === selectedMonth)?.label || "";

  const dateLabel = `${selectedYear} - ${selectedMonthName}`;

  const scrollToAnalysis = () => {
    analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { invoices: salesInvoices, isLoading: salesLoading } = useSalesInvoices();

  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };

  const currentMonth = getCurrentMonthRange();
  const { incomingInvoices, isLoading: incomingLoading } = useIncomingInvoices({ 
    startDate: currentMonth.start, 
    endDate: currentMonth.end 
  });

  // Satış faturaları istatistikleri
  const totalSalesInvoices = salesInvoices?.length || 0;
  const pendingSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'odenmedi').length || 0;
  const totalSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.toplam_tutar || 0), 0) || 0;
  const paidSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'odendi').length || 0;

  // E-Fatura istatistikleri
  const totalIncomingInvoices = incomingInvoices?.length || 0;
  const totalIncomingAmount = incomingInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;

  return (
    <>
      {/* Clean Header Section - CRM gibi */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Fatura Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Tüm fatura işlemlerinizi takip edin ve yönetin
              </p>
            </div>
          </div>

          {/* Year and Month Selectors */}
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ay Seçin" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Ana Fatura Kartları - CRM Dashboard gibi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Satış Faturaları Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate("/sales-invoices")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Satış Faturaları</h2>
                    <p className="text-xs text-gray-500">Müşteri faturaları</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/sales-invoices/create");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Toplam Fatura</span>
                  <span className="text-sm font-bold text-gray-900">{totalSalesInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Ödenmemiş</span>
                  <span className="text-sm font-bold text-orange-600">{pendingSalesInvoices}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Tutar</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(totalSalesAmount, 'TRY')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alış Faturaları Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200 cursor-pointer"
            onClick={() => navigate("/purchase-invoices")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Alış Faturaları</h2>
                    <p className="text-xs text-gray-500">Tedarikçi faturaları</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/purchase-invoices");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Bu Ay</span>
                  <span className="text-sm font-bold text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Bekleyen</span>
                  <span className="text-sm font-bold text-orange-600">-</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam</span>
                    <span className="text-sm font-bold text-gray-600">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* E-Fatura Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200 cursor-pointer"
            onClick={() => navigate("/purchase/e-invoice")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">E-Fatura</h2>
                    <p className="text-xs text-gray-500">Gelen e-faturalar</p>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Bu Ay</span>
                  <span className="text-sm font-bold text-gray-900">{totalIncomingInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">İşlenmemiş</span>
                  <span className="text-sm font-bold text-orange-600">-</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Tutar</span>
                    <span className="text-sm font-bold text-purple-600">{formatCurrency(totalIncomingAmount, 'TRY')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fatura Analizi Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200 cursor-pointer"
            onClick={scrollToAnalysis}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Fatura Analizi</h2>
                    <p className="text-xs text-gray-500">Aylık raporlar</p>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Kayıtlı Aylar</span>
                  <span className="text-sm font-bold text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Ortalama</span>
                  <span className="text-sm font-bold text-green-600">-</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-gray-600">Analiz Hazır</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Fatura Analizi ve Raporlar Bölümü */}
        <div ref={analysisRef} className="mt-8 scroll-mt-6">
          {/* Başlık */}
          <div className="mb-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white shadow-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Fatura Analizi ve Raporlar
                </h2>
                <p className="text-xs text-muted-foreground/70">
                  Detaylı fatura analizlerinizi ve raporlarınızı görüntüleyin
                </p>
              </div>
            </div>
          </div>
          
          {/* İçerik Alanı */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
            <div className="p-6">
              <InvoiceAnalysisManager />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceManagement;