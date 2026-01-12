import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, FileText, BarChart3, TrendingUp } from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useIncomingInvoices } from "@/hooks/useIncomingInvoices";
import { formatCurrency } from "@/utils/formatters";
import InvoiceAnalysisManager from "@/components/invoices/InvoiceAnalysisManager";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig, CardSummaryProps } from "@/components/module-dashboard";

interface InvoiceManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const InvoiceManagement = ({ isCollapsed, setIsCollapsed }: InvoiceManagementProps) => {
  const navigate = useNavigate();
  const analysisRef = useRef<HTMLDivElement>(null);

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
  const paidSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'odendi').length || 0;
  const pendingSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'odenmedi').length || 0;
  const partialSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'kismi_odendi').length || 0;
  const totalSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.toplam_tutar || 0), 0) || 0;

  // E-Fatura istatistikleri
  const totalIncomingInvoices = incomingInvoices?.length || 0;
  const totalIncomingAmount = incomingInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;

  const scrollToAnalysis = () => {
    analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // CardSummary configurations
  const salesSummary: CardSummaryProps = {
    mainMetric: { value: totalSalesInvoices, label: "Toplam Fatura", color: "blue" },
    statusGrid: [
      { label: "Ödenmemiş", value: pendingSalesInvoices, color: "red" },
      { label: "Kısmi", value: partialSalesInvoices, color: "yellow" },
      { label: "Ödendi", value: paidSalesInvoices, color: "green" },
    ],
    footer: {
      type: "value",
      valueLabel: "Toplam Tutar",
      value: formatCurrency(totalSalesAmount, 'TRY'),
      valueColor: "success",
    },
    compact: true,
    gridCols: 3,
  };

  const purchaseSummary: CardSummaryProps = {
    mainMetric: { value: "-", label: "Toplam Fatura", color: "green" },
    statusGrid: [
      { label: "Bekleyen", value: "-", color: "yellow" },
      { label: "Ödenen", value: "-", color: "green" },
    ],
    compact: true,
    gridCols: 2,
  };

  const eInvoiceSummary: CardSummaryProps = {
    mainMetric: { value: totalIncomingInvoices, label: "Bu Ay Gelen", color: "purple" },
    statusGrid: [
      { label: "İşlendi", value: "-", color: "green" },
      { label: "Bekliyor", value: "-", color: "yellow" },
    ],
    footer: {
      type: "value",
      valueLabel: "Toplam Tutar",
      value: formatCurrency(totalIncomingAmount, 'TRY'),
      valueColor: "success",
    },
    compact: true,
    gridCols: 2,
  };

  const cards: QuickLinkCardConfig[] = [
    {
      id: "sales-invoices",
      title: "Satış Faturaları",
      subtitle: "Müşteri faturaları",
      icon: Receipt,
      color: "blue",
      href: "/sales-invoices",
      newButton: { href: "/sales-invoices/create" },
      summaryConfig: salesSummary,
    },
    {
      id: "purchase-invoices",
      title: "Alış Faturaları",
      subtitle: "Tedarikçi faturaları",
      icon: Receipt,
      color: "green",
      href: "/purchase-invoices",
      newButton: { href: "/purchase-invoices" },
      summaryConfig: purchaseSummary,
    },
    {
      id: "e-invoices",
      title: "E-Fatura",
      subtitle: "Gelen e-faturalar",
      icon: FileText,
      color: "purple",
      href: "/e-invoice",
      summaryConfig: eInvoiceSummary,
    },
    {
      id: "invoice-analysis",
      title: "Fatura Analizi",
      subtitle: "Aylık raporlar",
      icon: BarChart3,
      color: "orange",
      href: "#analysis",
      customContent: (
        <div className="space-y-3" onClick={(e) => { e.stopPropagation(); scrollToAnalysis(); }}>
          <div className="text-center bg-orange-50 rounded-lg p-2.5">
            <div className="text-xl font-bold text-foreground">Hazır</div>
            <div className="text-[10px] font-medium text-muted-foreground">Analiz Durumu</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span className="font-medium text-[10px] text-blue-700">Kayıtlı Ay</span>
              </div>
              <div className="text-sm font-bold text-blue-600">-</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="font-medium text-[10px] text-green-700">Ortalama</span>
              </div>
              <div className="text-sm font-bold text-green-600">-</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-[10px] text-muted-foreground">Detaylı analiz için tıklayın</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const config: ModuleDashboardConfig = {
    header: {
      title: "Fatura Yönetimi",
      subtitle: "Tüm fatura işlemlerinizi takip edin ve yönetin",
      icon: Receipt,
    },
    cards,
    additionalContent: (
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
        <div className="bg-card rounded-2xl shadow-xl border border-border/60 overflow-hidden">
          <div className="p-6">
            <InvoiceAnalysisManager />
          </div>
        </div>
      </div>
    ),
  };

  const isLoading = salesLoading || incomingLoading;

  return <ModuleDashboard config={config} isLoading={isLoading} gridCols={4} />;
};

export default InvoiceManagement;
