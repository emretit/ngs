import React, { useState, useEffect } from "react";
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
  Loader2,
  Package,
  Eye,
  Code
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useNilveraPdf } from "@/hooks/useNilveraPdf";
import { useVeribanPdf } from "@/hooks/useVeribanPdf";
import { IntegratorService, IntegratorType } from "@/services/integratorService";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutgoingInvoiceItem } from "@/types/einvoice";
import { supabase } from "@/integrations/supabase/client";

interface EInvoiceContentProps {
  invoices: any[];
  isLoading: boolean;
  onRefresh: () => void;
  searchTerm: string;
  invoiceType?: 'incoming' | 'outgoing';
}

const EInvoiceContent = ({
  invoices,
  isLoading,
  onRefresh,
  searchTerm,
  invoiceType = 'incoming'
}: EInvoiceContentProps) => {
  const navigate = useNavigate();
  const { downloadAndOpenPdf: downloadNilveraPdf } = useNilveraPdf();
  const { downloadAndOpenPdf: downloadVeribanPdf } = useVeribanPdf();
  
  // Her satır için ayrı loading state
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [currentIntegrator, setCurrentIntegrator] = useState<IntegratorType | null>(null);
  
  // XML görüntüleme state'leri
  const [xmlViewerOpen, setXmlViewerOpen] = useState(false);
  const [selectedXmlContent, setSelectedXmlContent] = useState<string>('');
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null); // Tüm fatura bilgileri
  const [invoiceItems, setInvoiceItems] = useState<OutgoingInvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Get current integrator
  useEffect(() => {
    const fetchIntegrator = async () => {
      const integrator = await IntegratorService.getSelectedIntegrator();
      setCurrentIntegrator(integrator);
    };
    fetchIntegrator();
  }, []);

  // PDF download handler - integrator'e göre doğru fonksiyonu çağır
  const handleDownloadPdf = async (invoiceId: string) => {
    if (currentIntegrator === 'veriban') {
      return await downloadVeribanPdf(invoiceId, 'e-fatura');
    } else {
      // Default to Nilvera
      return await downloadNilveraPdf(invoiceId, 'e-fatura');
    }
  };

  // XML görüntüleme handler
  const handleViewXml = async (invoice: any) => {
    setSelectedInvoice(invoice); // Tüm fatura bilgilerini sakla
    setSelectedXmlContent(invoice.xmlContent || '<Invoice>XML içeriği bulunamadı</Invoice>');
    setSelectedInvoiceNumber(invoice.invoiceNumber);
    setSelectedInvoiceId(invoice.id);
    setXmlViewerOpen(true);
    
    // Fatura kalemlerini yükle
    if (invoiceType === 'outgoing' && invoice.id) {
      setLoadingItems(true);
      try {
        const { data, error } = await supabase
          .from('outgoing_invoice_items')
          .select('*')
          .eq('outgoing_invoice_id', invoice.id)
          .order('line_number', { ascending: true });
        
        if (error) {
          console.error('Fatura kalemleri yüklenemedi:', error);
          setInvoiceItems([]);
        } else {
          setInvoiceItems(data || []);
        }
      } catch (err) {
        console.error('Fatura kalemleri yükleme hatası:', err);
        setInvoiceItems([]);
      } finally {
        setLoadingItems(false);
      }
    }
  };

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
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
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
                <TableRow className="bg-slate-100 border-b border-slate-200">
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">📄 Fatura No</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🏷️ Fatura Tipi</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">📋 Fatura Senaryosu</TableHead>
                  {invoiceType === 'incoming' ? (
                    <>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🏢 Tedarikçi</TableHead>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🔢 Vergi No</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🏭 Tedarikçi</TableHead>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">👤 Müşteri</TableHead>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🔢 Vergi No</TableHead>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🏛️ Vergi Dairesi</TableHead>
                    </>
                  )}
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">📅 Fatura Tarihi</TableHead>
                  {invoiceType === 'outgoing' && (
                    <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">⏰ Saat</TableHead>
                  )}
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">💰 Tutar</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">💱 Para Birimi</TableHead>
                  {(invoiceType === 'incoming' || invoiceType === 'outgoing') && (
                    <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">⚙️ İşlemler</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="hover:bg-blue-50 h-8 cursor-pointer"
                  >
                    <TableCell className="font-medium py-2 px-3 text-xs" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      <span className="text-blue-600">{invoice.invoiceNumber}</span>
                    </TableCell>
                    <TableCell className="py-2 px-3" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      {getInvoiceTypeBadge(invoice.invoiceType)}
                    </TableCell>
                    <TableCell className="py-2 px-3" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      {getInvoiceProfileBadge(invoice.invoiceProfile)}
                    </TableCell>
                    {invoiceType === 'incoming' ? (
                      <>
                        <TableCell className="py-2 px-3" onClick={() => navigate(`/e-invoice/process/${invoice.id}`)}>
                          <div className="flex items-center">
                            <Building className="h-3 w-3 text-muted-foreground mr-2" />
                            <span className="text-xs">{invoice.supplierName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs py-2 px-3" onClick={() => navigate(`/e-invoice/process/${invoice.id}`)}>
                          {invoice.supplierTaxNumber}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="py-2 px-3" onClick={() => undefined}>
                          <div className="flex items-center">
                            <Building className="h-3 w-3 text-muted-foreground mr-2" />
                            <span className="text-xs">{invoice.supplierName || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3" onClick={() => undefined}>
                          <div className="flex items-center">
                            <Building className="h-3 w-3 text-muted-foreground mr-2" />
                            <span className="text-xs">{invoice.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs py-2 px-3" onClick={() => undefined}>
                          {invoice.customerTaxNumber || '-'}
                        </TableCell>
                        <TableCell className="text-xs py-2 px-3" onClick={() => undefined}>
                          {invoice.customerTaxOffice || '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-center py-2 px-3 text-xs" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      <div className="flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                        {format(new Date(invoice.invoiceDate), 'dd MMM yyyy', { locale: tr })}
                      </div>
                    </TableCell>
                    {invoiceType === 'outgoing' && (
                      <TableCell className="text-center py-2 px-3 text-xs" onClick={() => undefined}>
                        {invoice.invoiceTime || '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-semibold py-2 px-3 text-xs" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      {invoice.totalAmount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className="text-center py-2 px-3" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      <Badge variant="outline" className="text-xs">{invoice.currency}</Badge>
                    </TableCell>
                    {invoiceType === 'incoming' && (
                      <TableCell className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/e-invoice/process/${invoice.id}`);
                            }}
                            className="h-8 w-8"
                            title="İşle"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setDownloadingInvoiceId(invoice.id);
                              try {
                                await handleDownloadPdf(invoice.id);
                              } catch (error) {
                                console.error('PDF önizleme hatası:', error);
                              } finally {
                                setDownloadingInvoiceId(null);
                              }
                            }}
                            disabled={downloadingInvoiceId === invoice.id}
                            className="h-8 w-8"
                            title="PDF Önizleme"
                          >
                            {downloadingInvoiceId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    {invoiceType === 'outgoing' && (
                      <TableCell className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewXml(invoice);
                            }}
                            className="h-8 w-8"
                            title="XML Görüntüle"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* XML Viewer Sheet */}
      <Sheet open={xmlViewerOpen} onOpenChange={setXmlViewerOpen}>
        <SheetContent side="right" className="w-full sm:w-2/3 lg:w-1/2 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Fatura Detayı - {selectedInvoiceNumber}</SheetTitle>
            <SheetDescription>
              Fatura kalemlerini, detay bilgilerini ve XML içeriğini inceleyebilirsiniz.
            </SheetDescription>
          </SheetHeader>
          
          <Tabs defaultValue="items" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="items">Kalemler</TabsTrigger>
              <TabsTrigger value="details">Detaylar</TabsTrigger>
              <TabsTrigger value="xml">XML</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="mt-4">
              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : invoiceItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Toplam {invoiceItems.length} kalem
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Ürün</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Birim Fiyat</TableHead>
                          <TableHead className="text-right">İskonto</TableHead>
                          <TableHead className="text-right">KDV</TableHead>
                          <TableHead className="text-right">Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.line_number}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{item.product_name}</div>
                                {item.product_code && (
                                  <div className="text-xs text-gray-500">Kod: {item.product_code}</div>
                                )}
                                {item.description && item.description !== item.product_name && (
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell className="text-right">
                              {new Intl.NumberFormat('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(item.unit_price)} ₺
                            </TableCell>
                            <TableCell className="text-right">
                              {item.discount_amount > 0 ? (
                                <div>
                                  <div>
                                    {new Intl.NumberFormat('tr-TR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }).format(item.discount_amount)} ₺
                                  </div>
                                  {item.discount_rate > 0 && (
                                    <div className="text-xs text-gray-500">(%{item.discount_rate})</div>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <div>
                                  {new Intl.NumberFormat('tr-TR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(item.tax_amount)} ₺
                                </div>
                                <div className="text-xs text-gray-500">(%{item.tax_rate})</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {new Intl.NumberFormat('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(item.line_total_with_tax)} ₺
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Bu fatura için kalem bilgisi bulunamadı
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="mt-4">
              {selectedInvoice ? (
                <div className="space-y-6">
                  {/* Tedarikçi Bilgileri */}
                  {selectedInvoice.supplierName && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Tedarikçi Bilgileri
                      </h3>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-500">Firma Adı</dt>
                          <dd className="font-medium">{selectedInvoice.supplierName}</dd>
                        </div>
                        {selectedInvoice.supplierTaxNumber && (
                          <div>
                            <dt className="text-gray-500">VKN/TCKN</dt>
                            <dd className="font-mono">{selectedInvoice.supplierTaxNumber}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                  
                  {/* Müşteri Bilgileri */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Müşteri Bilgileri
                    </h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Müşteri Adı</dt>
                        <dd className="font-medium">{selectedInvoice.customerName}</dd>
                      </div>
                      {selectedInvoice.customerTaxNumber && (
                        <div>
                          <dt className="text-gray-500">VKN/TCKN</dt>
                          <dd className="font-mono">{selectedInvoice.customerTaxNumber}</dd>
                        </div>
                      )}
                      {selectedInvoice.customerTaxOffice && (
                        <div className="col-span-2">
                          <dt className="text-gray-500">Vergi Dairesi</dt>
                          <dd className="font-medium">{selectedInvoice.customerTaxOffice}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Ödeme Bilgileri */}
                  {(selectedInvoice.payeeIban || selectedInvoice.payeeBankName || selectedInvoice.paymentMeansCode) && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-sm mb-3">💳 Ödeme Bilgileri</h3>
                      <dl className="space-y-2 text-sm">
                        {selectedInvoice.paymentMeansCode && (
                          <div>
                            <dt className="text-gray-500">Ödeme Şekli</dt>
                            <dd className="font-medium">
                              {selectedInvoice.paymentMeansCode === '42' ? 'Banka Transferi' : `Kod: ${selectedInvoice.paymentMeansCode}`}
                            </dd>
                          </div>
                        )}
                        {selectedInvoice.payeeIban && (
                          <div>
                            <dt className="text-gray-500">IBAN</dt>
                            <dd className="font-mono text-xs">{selectedInvoice.payeeIban}</dd>
                          </div>
                        )}
                        {selectedInvoice.payeeBankName && (
                          <div>
                            <dt className="text-gray-500">Banka</dt>
                            <dd className="font-medium">{selectedInvoice.payeeBankName}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                  
                  {/* Tarih ve Saat Bilgileri */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-3">📅 Tarih Bilgileri</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Fatura Tarihi</dt>
                        <dd className="font-medium">
                          {format(new Date(selectedInvoice.invoiceDate), 'dd MMMM yyyy', { locale: tr })}
                        </dd>
                      </div>
                      {selectedInvoice.invoiceTime && (
                        <div>
                          <dt className="text-gray-500">Saat</dt>
                          <dd className="font-medium">{selectedInvoice.invoiceTime}</dd>
                        </div>
                      )}
                      {selectedInvoice.dueDate && (
                        <div>
                          <dt className="text-gray-500">Vade Tarihi</dt>
                          <dd className="font-medium">
                            {format(new Date(selectedInvoice.dueDate), 'dd MMMM yyyy', { locale: tr })}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Fatura Tipleri */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-3">🏷️ Fatura Tipleri</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Fatura Tipi</dt>
                        <dd>{getInvoiceTypeBadge(selectedInvoice.invoiceType)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Fatura Profili</dt>
                        <dd>{getInvoiceProfileBadge(selectedInvoice.invoiceProfile)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Fatura detay bilgisi yükleniyor...
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="xml" className="mt-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs border">
                <code className="language-xml">{selectedXmlContent}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EInvoiceContent;
