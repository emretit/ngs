import { useSearchParams } from "react-router-dom";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportsFilters from "@/components/reports/ReportsFilters";
import AIReportChat from "@/components/reports/AIReportChat";

export default function ReportsOverview() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <ReportsHeader />

      <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

      {/* AI Report Chat - Ana Özellik */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">AI Rapor Asistanı</h2>
          <p className="text-muted-foreground">
            Raporlarınız hakkında sorular sorun, otomatik analizler ve içgörüler alın
          </p>
        </div>
        <AIReportChat searchParams={searchParams} />
      </div>

      {/* Kategori Bilgilendirme */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Rapor Kategorileri</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Detaylı raporlar ve grafikler için sidebar'dan kategorileri seçebilirsiniz:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Satış Raporları - Fırsatlar, teklifler ve satış performansı</li>
              <li>Finansal Raporlar - Banka hesapları ve nakit akışı</li>
              <li>Servis Raporları - Servis kayıtları ve teknik performans</li>
              <li>Envanter Raporları - Stok durumu ve ürün analizleri</li>
              <li>Satın Alma Raporları - Alış faturaları ve tedarikçi analizleri</li>
              <li>İK Raporları - Çalışan listesi ve departman analizleri</li>
              <li>Araç Filosu Raporları - Araç listesi ve bakım durumu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
