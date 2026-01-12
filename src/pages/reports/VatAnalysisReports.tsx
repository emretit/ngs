import { useSearchParams } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportsFilters from "@/components/reports/ReportsFilters";
import InvoiceAnalysisManager from "@/components/invoices/InvoiceAnalysisManager";

export default function VatAnalysisReports() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <ReportsHeader />

      <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

      {/* Fatura Analizi ve Raporlar Bölümü - Fatura Yönetimi sayfasından kopya */}
      <div className="mt-4 scroll-mt-6">
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
  );
}

