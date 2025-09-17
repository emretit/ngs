import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  Calendar,
  Building,
  DollarSign,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface EInvoiceContentProps {
  invoices: any[];
  isLoading: boolean;
  onProcessInvoice: (invoice: any) => void;
  onRefresh: () => void;
  searchTerm: string;
  dateFilter: string;
}

const EInvoiceContent = ({
  invoices,
  isLoading,
  onProcessInvoice,
  onRefresh,
  searchTerm,
  dateFilter
}: EInvoiceContentProps) => {
  const { toast } = useToast();

  // Calculate summary statistics
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const getInvoiceTypeBadge = (invoiceType: string) => {
    switch (invoiceType) {
      case 'SATIS':
        return <Badge className="bg-green-100 text-green-800 text-xs">Satış</Badge>;
      case 'IADE':
        return <Badge className="bg-red-100 text-red-800 text-xs">İade</Badge>;
      case 'OZELMATRAH':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Özel Matrah</Badge>;
      case 'TEVKIFAT_IADE':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Tevkifat İade</Badge>;
      case 'KONAKLAMA':
        return <Badge className="bg-purple-100 text-purple-800 text-xs">Konaklama</Badge>;
      case 'SGK':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">SGK</Badge>;
      case 'IHRAC_KAYITLI':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">İhraç Kayıtlı</Badge>;
      case 'ISTISNA':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">İstisna</Badge>;
      case 'TEMEL':
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Temel</Badge>;
      case 'TICARI':
        return <Badge className="bg-green-100 text-green-800 text-xs">Ticari</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{invoiceType || 'Bilinmiyor'}</Badge>;
    }
  };

  const getInvoiceProfileBadge = (invoiceProfile: string) => {
    switch (invoiceProfile) {
      case 'TEMELFATURA':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">Temel Fatura</Badge>;
      case 'TICARIFATURA':
        return <Badge variant="outline" className="border-green-500 text-green-700 text-xs">Ticari Fatura</Badge>;
      case 'IHRACAT':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 text-xs">İhracat</Badge>;
      case 'YOLCUBERABERFATURA':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs">Yolcu Beraber</Badge>;
      case 'EARSIVFATURA':
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700 text-xs">E-Arşiv</Badge>;
      case 'KAMU':
        return <Badge variant="outline" className="border-red-500 text-red-700 text-xs">Kamu</Badge>;
      case 'HKS':
        return <Badge variant="outline" className="border-gray-500 text-gray-700 text-xs">HKS</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-700 text-xs">{invoiceProfile || 'Bilinmiyor'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-muted-foreground">E-faturalar yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Toplam</p>
              <p className="text-lg font-bold text-blue-900">{totalInvoices}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Toplam Tutar</p>
              <p className="text-lg font-bold text-green-900">
                {totalAmount.toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">E-Fatura Bulunamadı</h3>
              <p className="text-muted-foreground">
                Seçilen tarih aralığında e-fatura bulunmuyor veya filtre kriterlerinize uygun fatura yok.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">📄 Fatura No</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🏷️ Fatura Tipi</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">📋 Fatura Senaryosu</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Tedarikçi</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🔢 Vergi No</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Fatura Tarihi</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-right">💰 Tutar</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">💱 Para Birimi</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">⚙️ İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-blue-50 h-8">
                    <TableCell className="font-medium py-1 px-2 text-xs">
                      <span className="text-blue-600">{invoice.invoiceNumber}</span>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      {getInvoiceTypeBadge(invoice.invoiceType)}
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      {getInvoiceProfileBadge(invoice.invoiceProfile)}
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <div className="flex items-center">
                        <Building className="h-3 w-3 text-muted-foreground mr-2" />
                        <span className="text-xs">{invoice.supplierName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs py-1 px-2">
                      {invoice.supplierTaxNumber}
                    </TableCell>
                    <TableCell className="text-center py-1 px-1 text-xs">
                      <div className="flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                        {format(new Date(invoice.invoiceDate), 'dd MMM yyyy', { locale: tr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold py-1 px-1 text-xs">
                      {invoice.totalAmount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className="text-center py-1 px-1">
                      <Badge variant="outline" className="text-xs">{invoice.currency}</Badge>
                    </TableCell>
                    <TableCell className="py-1 px-1">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onProcessInvoice(invoice)}
                          className="h-6 w-6 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          <Package className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toast({
                              title: "Önizleme",
                              description: "Fatura önizlemesi yakında eklenecek"
                            });
                          }}
                          className="h-6 w-6 hover:bg-gray-100"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EInvoiceContent;
