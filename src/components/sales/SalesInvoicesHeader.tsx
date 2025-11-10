import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText, TrendingUp, Clock, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface SalesInvoicesHeaderProps {
  invoices?: any[];
}

const SalesInvoicesHeader = ({ invoices = [] }: SalesInvoicesHeaderProps) => {
  const navigate = useNavigate();

  // Toplam fatura sayısını hesapla
  const totalCount = invoices.length;

  // Toplam tutar hesapla
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.toplam_tutar || 0), 0);

  // Ödenmemiş faturalar hesapla
  const unpaidInvoices = invoices.filter(inv => inv.odeme_durumu === 'odenmedi').length;

  // Ödenmemiş tutar hesapla
  const unpaidAmount = invoices
    .filter(inv => inv.odeme_durumu === 'odenmedi')
    .reduce((sum, invoice) => sum + (invoice.toplam_tutar || 0), 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Satış Faturaları
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Satış faturalarınızı yönetin ve takip edin.
            </p>
          </div>
        </div>

        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam fatura sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <FileText className="h-3 w-3" />
            <span className="font-bold">Toplam Fatura</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>

          {/* Toplam tutar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">Toplam Tutar</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Ödenmemiş faturalar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Ödenmemiş</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {unpaidInvoices}
            </span>
          </div>

          {/* Ödenmemiş tutar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium">Ödenmemiş Tutar</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(unpaidAmount)}
            </span>
          </div>
        </div>

        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300"
            onClick={() => navigate('/sales-invoices/create')}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Fatura</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default SalesInvoicesHeader;
