import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { VeribanService } from '../../services/veribanService';
import { useToast } from '../../hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  ettn: string;
  supplier_name: string;
  invoice_date: string;
  total_amount: number;
  currency: string;
  is_answered?: boolean;
  answer_type?: string;
  supplier_vkn?: string;
  description?: string;
}

interface VeribanInvoiceDetailModalProps {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}

interface InvoiceDetails {
  fileName?: string;
  xmlContent?: string;
  binaryData?: string;
  parsedData?: any;
}

export const VeribanInvoiceDetailModal: React.FC<VeribanInvoiceDetailModalProps> = ({
  invoice,
  open,
  onClose,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<InvoiceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoice) {
      fetchInvoiceDetails();
    }
  }, [open, invoice]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await VeribanService.getInvoiceDetails({
        invoiceUUID: invoice.ettn,
        invoiceType: 'purchase'
      });

      if (result.success && result.data) {
        setDetails(result.data);
      } else {
        setError(result.error || 'Fatura detayları alınamadı');
      }
    } catch (err) {
      setError('Fatura detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadXML = () => {
    if (!details?.xmlContent) return;

    const blob = new Blob([details.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Başarılı',
      description: 'XML dosyası indirildi',
    });
  };

  const handleDownloadZIP = () => {
    if (!details?.binaryData) return;

    try {
      // Convert base64 to blob
      const byteCharacters = atob(details.binaryData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = details.fileName || `${invoice.invoice_number}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Başarılı',
        description: 'ZIP dosyası indirildi',
      });
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Dosya indirilemedi',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fatura Detayları</DialogTitle>
          <DialogDescription>
            {invoice.invoice_number} - {invoice.supplier_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="xml">XML İçeriği</TabsTrigger>
              <TabsTrigger value="actions">İşlemler</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Fatura No</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.invoice_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ETTN</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{invoice.ettn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tedarikçi</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.supplier_name}</p>
                </div>
                {invoice.supplier_vkn && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tedarikçi VKN</label>
                    <p className="mt-1 text-sm text-gray-900">{invoice.supplier_vkn}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Fatura Tarihi</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Toplam Tutar</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: invoice.currency || 'TRY'
                    }).format(invoice.total_amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Durum</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {invoice.is_answered 
                      ? invoice.answer_type === 'KABUL' 
                        ? 'Kabul Edildi' 
                        : 'Reddedildi'
                      : 'Cevap Bekliyor'}
                  </p>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.description}</p>
                </div>
              )}

              {details?.fileName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Dosya Adı</label>
                  <p className="mt-1 text-sm text-gray-900">{details.fileName}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="xml">
              {details?.xmlContent ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={handleDownloadXML}>
                      <Download className="w-4 h-4 mr-2" />
                      XML İndir
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-xs text-gray-800">
                      {details.xmlContent}
                    </pre>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>XML içeriği bulunamadı</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">İndirme İşlemleri</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleDownloadXML}
                      disabled={!details?.xmlContent}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      XML Dosyası İndir
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleDownloadZIP}
                      disabled={!details?.binaryData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      ZIP Dosyası İndir
                    </Button>
                  </div>
                </div>

                {details?.xmlContent && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Fatura Bilgileri</h3>
                    <p className="text-sm text-gray-600">
                      XML içeriği başarıyla yüklendi. Yukarıdaki sekmelerden detayları
                      görüntüleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

