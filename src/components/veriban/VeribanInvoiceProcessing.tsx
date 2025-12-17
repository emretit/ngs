import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, CheckCircle, XCircle, Eye, Download, Check, X, FileText, Package } from 'lucide-react';
import { VeribanService } from '../../services/veribanService';
import { VeribanInvoiceDetailModal } from './VeribanInvoiceDetailModal';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  status?: string;
}

interface VeribanInvoiceProcessingProps {
  invoices: Invoice[];
  loading: boolean;
  onRefresh: () => void;
}

export const VeribanInvoiceProcessing: React.FC<VeribanInvoiceProcessingProps> = ({
  invoices,
  loading,
  onRefresh
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const handleViewDetails = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleAccept = async (invoice: Invoice) => {
    setProcessingInvoice(invoice.id);
    try {
      const result = await VeribanService.answerInvoice({
        invoiceUUID: invoice.ettn,
        answerType: 'KABUL',
        description: 'Fatura kabul edildi'
      });

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Fatura kabul edildi',
        });
        onRefresh();
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Fatura kabul edilemedi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'İşlem sırasında bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setProcessingInvoice(null);
    }
  };

  const handleReject = async (invoice: Invoice) => {
    setProcessingInvoice(invoice.id);
    try {
      const result = await VeribanService.answerInvoice({
        invoiceUUID: invoice.ettn,
        answerType: 'RED',
        description: 'Fatura reddedildi'
      });

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Fatura reddedildi',
        });
        onRefresh();
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Fatura reddedilemedi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'İşlem sırasında bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setProcessingInvoice(null);
    }
  };

  const handleDownloadXML = async (invoice: Invoice) => {
    setDownloadingInvoice(invoice.id);
    try {
      const result = await VeribanService.getInvoiceDetails({
        invoiceUUID: invoice.ettn,
        invoiceType: 'purchase'
      });

      if (result.success && result.data?.xmlContent) {
        // XML'i dosya olarak indir
        const blob = new Blob([result.data.xmlContent], { type: 'application/xml' });
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
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'XML indirilemedi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'İndirme sırasında bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleMarkAsTransferred = async (invoice: Invoice) => {
    try {
      const result = await VeribanService.markAsTransferred(invoice.ettn);

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Fatura transfer edildi olarak işaretlendi',
        });
        onRefresh();
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'İşlem başarısız',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'İşlem sırasında bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.is_answered) {
      if (invoice.answer_type === 'KABUL') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Kabul Edildi
          </span>
        );
      } else if (invoice.answer_type === 'RED') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Reddedildi
          </span>
        );
      }
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Cevap Bekliyor
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Henüz gelen fatura bulunmuyor.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gelen Fatura İşleme</CardTitle>
          <CardDescription>
            Veriban üzerinden gelen faturaları kabul/red edebilir, detaylarını görüntüleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 border rounded-lg hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                      {getStatusBadge(invoice)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Tedarikçi:</span> {invoice.supplier_name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Tarih:</span>{' '}
                      {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tutar:</span>{' '}
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: invoice.currency || 'TRY'
                      }).format(invoice.total_amount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate(`/veriban-invoice/process/${invoice.ettn}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Package className="w-4 h-4 mr-1" />
                      İşle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(invoice)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadXML(invoice)}
                      disabled={downloadingInvoice === invoice.id}
                    >
                      {downloadingInvoice === invoice.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      XML
                    </Button>
                    {!invoice.is_answered && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAccept(invoice)}
                          disabled={processingInvoice === invoice.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingInvoice === invoice.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Kabul
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(invoice)}
                          disabled={processingInvoice === invoice.id}
                        >
                          {processingInvoice === invoice.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-1" />
                          )}
                          Red
                        </Button>
                      </>
                    )}
                    {invoice.is_answered && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsTransferred(invoice)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Transfer Edildi
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedInvoice && (
        <VeribanInvoiceDetailModal
          invoice={selectedInvoice}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </>
  );
};

