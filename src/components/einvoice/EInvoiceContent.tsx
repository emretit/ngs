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
  const handleViewXml = (invoice: any) => {
    setSelectedXmlContent(invoice.xmlContent || '<Invoice>XML içeriği bulunamadı</Invoice>');
    setSelectedInvoiceNumber(invoice.invoiceNumber);
    setXmlViewerOpen(true);
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
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">👤 Müşteri</TableHead>
                      <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🔢 Vergi No</TableHead>
                    </>
                  )}
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">📅 Fatura Tarihi</TableHead>
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
                            <span className="text-xs">{invoice.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs py-2 px-3" onClick={() => undefined}>
                          {invoice.customerTaxNumber}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-center py-2 px-3 text-xs" onClick={() => invoiceType === 'incoming' ? navigate(`/e-invoice/process/${invoice.id}`) : undefined}>
                      <div className="flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                        {format(new Date(invoice.invoiceDate), 'dd MMM yyyy', { locale: tr })}
                      </div>
                    </TableCell>
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
            <SheetTitle>XML İçeriği - {selectedInvoiceNumber}</SheetTitle>
            <SheetDescription>
              Fatura XML içeriğini buradan inceleyebilir ve matching yapabilirsiniz.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs border">
              <code className="language-xml">{selectedXmlContent}</code>
            </pre>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EInvoiceContent;
