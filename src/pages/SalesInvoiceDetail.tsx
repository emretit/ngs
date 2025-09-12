import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Download, FileText, Calendar, User, Building2 } from "lucide-react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useInvoiceTags } from "@/hooks/useInvoiceTags";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Tag } from "lucide-react";

interface SalesInvoiceDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SalesInvoiceDetail = ({ isCollapsed, setIsCollapsed }: SalesInvoiceDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchInvoiceById } = useSalesInvoices();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Sadece Nilvera'ya gönderilmiş faturalar için etiketleri yükle
  const { tags, isLoading: tagsLoading, refreshTags, isRefreshing } = useInvoiceTags(
    id, 
    invoice?.nilvera_invoice_id && invoice?.einvoice_status && invoice?.einvoice_status !== 'draft'
  );

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await fetchInvoiceById(id!);
      setInvoice(invoiceData);
    } catch (error) {
      console.error("Error loading invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getDocumentTypeBadge = (type: any) => {
    switch (type) {
      case 'e_fatura':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">e-Fatura</Badge>;
      case 'e_arsiv':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">e-Arşiv</Badge>;
      case 'fatura':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Fatura</Badge>;
      case 'irsaliye':
        return <Badge variant="outline" className="border-amber-500 text-amber-700">İrsaliye</Badge>;
      case 'makbuz':
        return <Badge variant="outline" className="border-green-500 text-green-700">Makbuz</Badge>;
      case 'serbest_meslek_makbuzu':
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700">SMM</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <DefaultLayout 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        title="Fatura Detayı"
        subtitle="Fatura bilgileri yükleniyor..."
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DefaultLayout>
    );
  }

  if (!invoice) {
    return (
      <DefaultLayout 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        title="Fatura Bulunamadı"
        subtitle="Aradığınız fatura bulunamadı"
      >
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Fatura bulunamadı</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/sales-invoices')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Faturalara Dön
          </Button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="Fatura Detayı"
      subtitle={`Fatura No: ${invoice.fatura_no || 'Henüz atanmadı'}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/sales-invoices')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
          </div>
        </div>

        {/* Invoice Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fatura Bilgileri
              </CardTitle>
              <div className="flex items-center gap-2">
                {getDocumentTypeBadge(invoice.document_type)}
                <Badge variant="outline" className="bg-gray-100">
                  {invoice.durum}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Kolon - Fatura Bilgileri */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fatura No</label>
                  <p className="text-lg font-semibold">
                    {invoice.fatura_no || 'Henüz atanmadı'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Fatura Tarihi</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(invoice.fatura_tarihi), "dd MMMM yyyy", { locale: tr })}
                  </p>
                </div>

                {invoice.vade_tarihi && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vade Tarihi</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(invoice.vade_tarihi), "dd MMMM yyyy", { locale: tr })}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Para Birimi</label>
                  <p>{invoice.para_birimi}</p>
                </div>
              </div>

              {/* Sağ Kolon - Müşteri Bilgileri */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Müşteri</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">{invoice.customer?.name}</p>
                      {invoice.customer?.company && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.customer.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {invoice.customer?.tax_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vergi No</label>
                    <p>{invoice.customer.tax_number}</p>
                  </div>
                )}

                {invoice.aciklama && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Açıklama</label>
                    <p>{invoice.aciklama}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Tutar Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Ara Toplam</label>
                <p className="text-lg font-semibold">{formatCurrency(invoice.ara_toplam)}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">KDV Tutarı</label>
                <p className="text-lg font-semibold">{formatCurrency(invoice.kdv_tutari)}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Toplam Tutar</label>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(invoice.toplam_tutar)}</p>
              </div>
            </div>

            {invoice.notlar && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Notlar</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{invoice.notlar}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* E-Fatura Bilgileri */}
        {(invoice.einvoice_status || invoice.nilvera_invoice_id) && (
          <Card>
            <CardHeader>
              <CardTitle>E-Fatura Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <p>{invoice.einvoice_status || 'Bilinmiyor'}</p>
                </div>
                {invoice.nilvera_invoice_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nilvera ID</label>
                    <p className="font-mono text-sm">{invoice.nilvera_invoice_id}</p>
                  </div>
                )}
                {invoice.einvoice_sent_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gönderilme Tarihi</label>
                    <p>{format(new Date(invoice.einvoice_sent_at), "dd MMMM yyyy HH:mm", { locale: tr })}</p>
                  </div>
                )}
                {invoice.einvoice_error_message && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Hata Mesajı</label>
                    <p className="text-red-600 text-sm mt-1 p-2 bg-red-50 rounded">{invoice.einvoice_error_message}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fatura Etiketleri - Sadece Nilvera'ya gönderilmiş faturalar için */}
        {invoice.nilvera_invoice_id && invoice.einvoice_status && invoice.einvoice_status !== 'draft' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Fatura Etiketleri
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshTags()}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              ) : tags.length > 0 ? (
                <div className="space-y-3">
                  {tags.map((tag, index) => (
                    <div key={tag.UUID || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {tag.Color && (
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: tag.Color }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{tag.Name || 'İsimsiz Etiket'}</p>
                        {tag.Description && (
                          <p className="text-sm text-gray-500">{tag.Description}</p>
                        )}
                      </div>
                      {tag.UUID && (
                        <Badge variant="outline" className="text-xs">
                          {tag.UUID.substring(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Bu fatura için etiket bulunamadı</p>
                  <p className="text-sm mt-1">Etiketler Nilvera sisteminde oluşturulduktan sonra burada görünecektir</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fatura henüz Nilvera'ya gönderilmemişse bilgilendirme */}
        {(!invoice.nilvera_invoice_id || invoice.einvoice_status === 'draft') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Fatura Etiketleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Etiketler henüz mevcut değil</p>
                <p className="text-sm mt-1">
                  Fatura etiketleri, fatura Nilvera'ya e-fatura olarak gönderildikten sonra görünecektir.
                </p>
                {invoice.einvoice_status === 'draft' && (
                  <p className="text-xs mt-2 text-blue-600">
                    Faturayı e-fatura olarak göndermek için "E-Fatura Gönder" butonunu kullanın.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DefaultLayout>
  );
};

export default SalesInvoiceDetail;
