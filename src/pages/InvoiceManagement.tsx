import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, FileText, BarChart3, TrendingUp } from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useIncomingInvoices } from "@/hooks/useIncomingInvoices";
import { formatCurrency } from "@/utils/formatters";
import InvoiceAnalysisManager from "@/components/invoices/InvoiceAnalysisManager";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig } from "@/components/module-dashboard";

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
  const pendingSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'odenmedi').length || 0;
  const totalSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.toplam_tutar || 0), 0) || 0;

  // E-Fatura istatistikleri
  const totalIncomingInvoices = incomingInvoices?.length || 0;
  const totalIncomingAmount = incomingInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;

  const scrollToAnalysis = () => {
    analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cards: QuickLinkCardConfig[] = [
    {
      id: "sales-invoices",
      title: "Satış Faturaları",
      subtitle: "Müşteri faturaları",
      icon: Receipt,
      color: "blue",
      href: "/sales-invoices",
      newButton: {
        href: "/sales-invoices/create",
      },
      stats: [
        { label: "Toplam Fatura", value: totalSalesInvoices },
        { label: "Ödenmemiş", value: pendingSalesInvoices, color: "warning" },
      ],
      footerStat: {
        label: "Toplam Tutar",
        value: formatCurrency(totalSalesAmount, 'TRY'),
        color: "success",
      },
    },
    {
      id: "purchase-invoices",
      title: "Alış Faturaları",
      subtitle: "Tedarikçi faturaları",
      icon: Receipt,
      color: "green",
      href: "/purchase-invoices",
      newButton: {
        href: "/purchase-invoices",
      },
      stats: [
        { label: "Bu Ay", value: "-" },
        { label: "Bekleyen", value: "-", color: "warning" },
      ],
      footerStat: {
        label: "Toplam",
        value: "-",
        color: "default",
      },
    },
    {
      id: "e-invoices",
      title: "E-Fatura",
      subtitle: "Gelen e-faturalar",
      icon: FileText,
      color: "purple",
      href: "/e-invoice",
      stats: [
        { label: "Bu Ay", value: totalIncomingInvoices },
        { label: "İşlenmemiş", value: "-", color: "warning" },
      ],
      footerStat: {
        label: "Toplam Tutar",
        value: formatCurrency(totalIncomingAmount, 'TRY'),
        color: "success",
      },
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kayıtlı Aylar</span>
            <span className="text-sm font-bold text-foreground">-</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ortalama</span>
            <span className="text-sm font-bold text-green-600">-</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-muted-foreground">Analiz Hazır</span>
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
