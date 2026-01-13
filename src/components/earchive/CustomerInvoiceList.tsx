import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { useVeribanEArchiveCustomerInvoices, DateRangeHelpers } from '@/hooks/veriban/useVeribanEArchiveCustomerInvoices';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CustomerInvoiceListProps {
  customerTaxNumber: string; // Müşteri VKN/TCKN
  customerName?: string;
}

/**
 * Müşteri E-Arşiv Fatura Listesi Komponenti
 * 
 * Belirli bir müşterinin VKN/TCKN'si ile tarih aralığında kesilen
 * E-Arşiv faturalarının listesini gösterir.
 * 
 * Özellikler:
 * - Tarih aralığı seçimi (Son 30 gün, Bu ay, Geçen ay, Bu yıl)
 * - Fatura UUID (ETTN) listesi
 * - Sistemde eşleşen faturaların detayları
 * - Excel'e aktarma (gelecek özellik)
 */
export function CustomerInvoiceList({ customerTaxNumber, customerName }: CustomerInvoiceListProps) {
  const [dateRange, setDateRange] = useState<'last30days' | 'currentMonth' | 'lastMonth' | 'currentYear'>('last30days');
  const getCustomerInvoices = useVeribanEArchiveCustomerInvoices();

  const handleGetInvoices = () => {
    let range: { startDate: string; endDate: string };

    switch (dateRange) {
      case 'last30days':
        range = DateRangeHelpers.getLastNDays(30);
        break;
      case 'currentMonth':
        range = DateRangeHelpers.getCurrentMonth();
        break;
      case 'lastMonth':
        range = DateRangeHelpers.getLastMonth();
        break;
      case 'currentYear':
        range = DateRangeHelpers.getCurrentYear();
        break;
      default:
        range = DateRangeHelpers.getLastNDays(30);
    }

    getCustomerInvoices.mutate(
      {
        customerRegisterNumber: customerTaxNumber,
        ...range,
      },
      {
        onSuccess: (response) => {
          toast.success(`${response.data?.count || 0} adet E-Arşiv fatura bulundu`);
        },
        onError: (error) => {
          toast.error(`Hata: ${error.message}`);
        },
      }
    );
  };

  const dateRangeLabels = {
    last30days: 'Son 30 Gün',
    currentMonth: 'Bu Ay',
    lastMonth: 'Geçen Ay',
    currentYear: 'Bu Yıl',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          E-Arşiv Fatura Geçmişi
        </CardTitle>
        <CardDescription>
          {customerName && <span className="font-medium">{customerName}</span>}
          {customerName && ' - '}
          VKN/TCKN: {customerTaxNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tarih Aralığı Seçimi ve Sorgulama */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tarih aralığı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Son 30 Gün
                  </span>
                </SelectItem>
                <SelectItem value="currentMonth">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Bu Ay
                  </span>
                </SelectItem>
                <SelectItem value="lastMonth">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Geçen Ay
                  </span>
                </SelectItem>
                <SelectItem value="currentYear">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Bu Yıl
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGetInvoices}
            disabled={getCustomerInvoices.isPending}
            className="gap-2"
          >
            {getCustomerInvoices.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sorgulanıyor...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Faturaları Getir
              </>
            )}
          </Button>
        </div>

        {/* Sonuçlar */}
        {getCustomerInvoices.isSuccess && getCustomerInvoices.data.data && (
          <div className="space-y-4">
            {/* Özet Bilgiler */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Toplam Fatura</span>
                <Badge variant="secondary" className="text-base font-semibold">
                  {getCustomerInvoices.data.data.count} adet
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tarih Aralığı</span>
                <span className="font-medium">
                  {dateRangeLabels[dateRange]}
                </span>
              </div>
              {getCustomerInvoices.data.data.matchedInvoices && (
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Sistemde Bulunan
                  </span>
                  <span className="font-medium text-green-600">
                    {getCustomerInvoices.data.data.matchedInvoices.length} fatura
                  </span>
                </div>
              )}
            </div>

            {/* Sistemde Eşleşen Faturalar */}
            {getCustomerInvoices.data.data.matchedInvoices && 
             getCustomerInvoices.data.data.matchedInvoices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Sistemde Bulunan Faturalar
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Fatura No</th>
                        <th className="text-left p-3 font-medium">Tarih</th>
                        <th className="text-right p-3 font-medium">Tutar</th>
                        <th className="text-left p-3 font-medium">ETTN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getCustomerInvoices.data.data.matchedInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                          <td className="p-3 text-muted-foreground">
                            {invoice.invoiceDate 
                              ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy', { locale: tr })
                              : '-'
                            }
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">
                            {invoice.ettn?.substring(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tüm UUID Listesi */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tüm Fatura UUID (ETTN) Listesi
              </h4>
              <div className="border rounded-lg p-3 bg-muted/20 max-h-60 overflow-y-auto">
                {getCustomerInvoices.data.data.uuids.length > 0 ? (
                  <div className="grid gap-1">
                    {getCustomerInvoices.data.data.uuids.map((uuid, index) => (
                      <div
                        key={uuid}
                        className="font-mono text-xs p-2 rounded bg-background hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span className="flex-1 ml-2">{uuid}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(uuid);
                            toast.success('UUID kopyalandı');
                          }}
                        >
                          Kopyala
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Fatura bulunamadı
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hata Mesajı */}
        {getCustomerInvoices.isError && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Hata: {getCustomerInvoices.error.message}
            </p>
          </div>
        )}

        {/* İlk Kullanım Mesajı */}
        {!getCustomerInvoices.data && !getCustomerInvoices.isError && !getCustomerInvoices.isPending && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Müşteriye ait E-Arşiv faturalarını görüntülemek için<br />
              tarih aralığı seçip "Faturaları Getir" butonuna tıklayın.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
