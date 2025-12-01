import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Download, FileText, Calendar, User, Building2, Receipt, DollarSign, Tag, RefreshCw } from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useInvoiceTags } from "@/hooks/useInvoiceTags";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnit } from "@/utils/unitConstants";

interface SalesInvoiceDetailProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

interface InvoiceItem {
  id: string;
  sales_invoice_id: string;
  product_id: string | null;
  urun_adi: string;
  aciklama: string | null;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani: number | null;
  satir_toplami: number;
  kdv_tutari: number;
  para_birimi: string | null;
  sira_no: number | null;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

const SalesInvoiceDetail = ({ isCollapsed, setIsCollapsed }: SalesInvoiceDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchInvoiceById } = useSalesInvoices();
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Sadece Nilvera'ya gönderilmiş faturalar için etiketleri yükle
  const { tags, isLoading: tagsLoading, refreshTags, isRefreshing } = useInvoiceTags(
    id, 
    invoice?.nilvera_invoice_id && invoice?.einvoice_status && invoice?.einvoice_status !== 'draft'
  );

  useEffect(() => {
    if (id) {
      loadInvoice();
      loadInvoiceItems();
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

  const loadInvoiceItems = async () => {
    if (!id) return;
    try {
      setItemsLoading(true);
      const { data: items, error } = await supabase
        .from("sales_invoice_items")
        .select(`
          *,
          product:products (
            id,
            name,
            sku
          )
        `)
        .eq("sales_invoice_id", id)
        .order("sira_no", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading invoice items:", error);
      } else {
        setInvoiceItems(items || []);
      }
    } catch (error) {
      console.error("Error loading invoice items:", error);
    } finally {
      setItemsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    // Intl.NumberFormat için geçerli currency code kullan (TRY -> TRY)
    const currencyCode = currency === 'TL' ? 'TRY' : currency;
    const formatted = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
    return formatted;
  };


  const getDocumentTypeBadge = (type: any) => {
    switch (type) {
      case 'e_fatura':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 text-xs">e-Fatura</Badge>;
      case 'e_arsiv':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50 text-xs">e-Arşiv</Badge>;
      case 'fatura':
        return <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50 text-xs">Fatura</Badge>;
      case 'irsaliye':
        return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 text-xs">İrsaliye</Badge>;
      case 'makbuz':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 text-xs">Makbuz</Badge>;
      case 'serbest_meslek_makbuzu':
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700 bg-indigo-50 text-xs">SMM</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="p-4 rounded-full bg-gray-100 mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fatura bulunamadı</h3>
        <p className="text-sm text-gray-500 mb-6">Aradığınız fatura mevcut değil veya silinmiş olabilir.</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales-invoices')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Faturalara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/sales-invoices')}
          className="shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/sales-invoices/edit/${id}`)}
            className="shadow-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (invoice.nilvera_invoice_id) {
                console.log('PDF indiriliyor...');
              } else {
                window.print();
              }
            }}
            className="shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Invoice Info */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Fatura & Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Fatura Bilgileri */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fatura No:</span>
                  <span className="font-semibold text-xs">{invoice.fatura_no || 'Henüz atanmadı'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tarih:</span>
                  <span className="text-xs">{format(new Date(invoice.fatura_tarihi), 'dd.MM.yyyy', { locale: tr })}</span>
                </div>
                {invoice.vade_tarihi && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Vade:</span>
                    <span className="text-xs">{format(new Date(invoice.vade_tarihi), 'dd.MM.yyyy', { locale: tr })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Kalem:</span>
                  <span className="font-medium text-xs">{invoiceItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Para Birimi:</span>
                  <span className="text-xs font-medium">{invoice.para_birimi === 'TL' ? 'TRY' : (invoice.para_birimi || 'TRY')}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Ara Toplam:</span>
                  <span className="font-medium text-xs">{formatCurrency(invoice.ara_toplam || 0, invoice.para_birimi)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">KDV:</span>
                  <span className="font-medium text-xs">{formatCurrency(invoice.kdv_tutari || 0, invoice.para_birimi)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-gray-700 font-medium text-xs">Toplam:</span>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(invoice.toplam_tutar || 0, invoice.para_birimi)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Belge Tipi:</span>
                  {getDocumentTypeBadge(invoice.document_type)}
                </div>
                {invoice.durum && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Durum:</span>
                    <Badge variant="outline" className="bg-gray-100 text-xs">{invoice.durum}</Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Müşteri Bilgileri */}
              <div className="p-2.5 rounded-lg text-xs bg-gray-50 border border-gray-200">
                <div className="mb-2">
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">
                    {invoice.customer?.name || 'Bilinmiyor'}
                  </div>
                  {invoice.customer?.company && (
                    <div className="text-gray-600 text-xs">
                      {invoice.customer.company}
                    </div>
                  )}
                  {invoice.customer?.tax_number && (
                    <div className="text-gray-500 text-xs mt-0.5">
                      VKN: {invoice.customer.tax_number}
                    </div>
                  )}
                </div>
              </div>

              {invoice.aciklama && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Açıklama</div>
                    <div className="text-xs text-gray-700">{invoice.aciklama}</div>
                  </div>
                </>
              )}

              {invoice.notlar && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Notlar</div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap">{invoice.notlar}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Invoice Items */}
        <div className="lg:col-span-3 space-y-4">
          {/* Fatura Kalemleri */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-600" />
                Fatura Kalemleri
                <Badge variant="outline" className="ml-2 text-xs">{invoiceItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {itemsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : invoiceItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Fatura kalemleri bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="w-12 font-semibold text-xs">#</TableHead>
                        <TableHead className="font-semibold text-xs">Ürün</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Miktar</TableHead>
                        <TableHead className="text-center font-semibold text-xs">Birim</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Birim Fiyat</TableHead>
                        <TableHead className="text-right font-semibold text-xs">İndirim</TableHead>
                        <TableHead className="text-right font-semibold text-xs">KDV</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                          <TableCell className="font-medium text-xs">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                              {item.sira_no || index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <p className="font-medium text-gray-900 truncate text-sm mb-1">
                                {item.urun_adi}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                {item.product?.sku && (
                                  <span className="px-2 py-0.5 bg-gray-100 rounded">SKU: {item.product.sku}</span>
                                )}
                                {item.aciklama && (
                                  <span className="text-gray-500">{item.aciklama}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono text-sm font-semibold text-gray-700">
                              {item.miktar.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-xs font-medium text-gray-600">
                              {formatUnit(item.birim)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(item.birim_fiyat, item.para_birimi || invoice.para_birimi)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.indirim_orani && item.indirim_orani > 0 ? (
                              <span className="text-red-600 text-xs">{item.indirim_orani}%</span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">{item.kdv_orani}%</TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            {formatCurrency(item.satir_toplami, item.para_birimi || invoice.para_birimi)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <TableCell colSpan={7} className="text-right text-sm">
                          Genel Toplam
                        </TableCell>
                        <TableCell className="text-right text-base">
                          {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.satir_toplami || 0), 0), invoice.para_birimi)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* E-Fatura Bilgileri */}
          {(invoice.einvoice_status || invoice.nilvera_invoice_id) && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100/50 border-b p-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  E-Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Durum:</span>
                    <p className="mt-0.5 text-xs font-medium">{invoice.einvoice_status || 'Bilinmiyor'}</p>
                  </div>
                  {invoice.nilvera_invoice_id && (
                    <div>
                      <span className="text-gray-500 text-xs">Nilvera ID:</span>
                      <p className="mt-0.5 font-mono text-xs">{invoice.nilvera_invoice_id}</p>
                    </div>
                  )}
                  {invoice.einvoice_sent_at && (
                    <div>
                      <span className="text-gray-500 text-xs">Gönderilme Tarihi:</span>
                      <p className="mt-0.5 text-xs font-medium">{format(new Date(invoice.einvoice_sent_at), "dd.MM.yyyy HH:mm", { locale: tr })}</p>
                    </div>
                  )}
                  {invoice.einvoice_error_message && (
                    <div className="md:col-span-2">
                      <span className="text-gray-500 text-xs">Hata Mesajı:</span>
                      <p className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">{invoice.einvoice_error_message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fatura Etiketleri */}
          {invoice.nilvera_invoice_id && invoice.einvoice_status && invoice.einvoice_status !== 'draft' ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100/50 border-b p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-pink-600" />
                    Fatura Etiketleri
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshTags()}
                    disabled={isRefreshing}
                    className="shadow-sm h-7 text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Yenile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {tagsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                ) : tags.length > 0 ? (
                  <div className="space-y-2">
                    {tags.map((tag, index) => (
                      <div key={tag.UUID || index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        {tag.Color && (
                          <div 
                            className="w-3 h-3 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: tag.Color }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-xs">{tag.Name || 'İsimsiz Etiket'}</p>
                          {tag.Description && (
                            <p className="text-xs text-gray-500 mt-0.5">{tag.Description}</p>
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
                    <p className="font-medium text-sm">Bu fatura için etiket bulunamadı</p>
                    <p className="text-xs mt-1">Etiketler Nilvera sisteminde oluşturulduktan sonra burada görünecektir</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100/50 border-b p-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-pink-600" />
                  Fatura Etiketleri
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center py-8 text-gray-500">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-sm">Etiketler henüz mevcut değil</p>
                  <p className="text-xs mt-1">
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
      </div>
    </div>
  );
};

export default SalesInvoiceDetail;
