
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Proposal } from "@/types/proposal";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import StatusBadge from "./detail/StatusBadge";

import { 
  Edit3,
  FileText,
  Package,
  MessageSquare,
  Download,
  CreditCard,
  Truck,
  Shield,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { proposalStatusLabels } from "@/types/proposal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProposalDetailSheetProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProposalDetailSheet: React.FC<ProposalDetailSheetProps> = ({
  proposal,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await PdfExportService.getTemplates('quote');
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  if (!proposal) return null;

  const formatMoney = (amount: number) => {
    const currency = proposal.currency || "TRY";

    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleEdit = () => {
    onOpenChange(false);
    navigate(`/proposal/${proposal.id}/edit?focus=items`);
  };

  const handleDownloadPdf = async (templateId?: string) => {
    if (!proposal) return;
    
    setIsLoading(true);
    try {
      // Teklif detaylarını çek
      const proposalData = await PdfExportService.transformProposalForPdf(proposal);
      
      // PDF'i yeni sekmede aç
      await PdfExportService.openPdfInNewTab(proposalData, { templateId });
      
      toast("PDF yeni sekmede açıldı");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };





  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return "-";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {/* Kompakt Header */}
        <SheetHeader className="space-y-2 pb-3 border-b">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <SheetTitle className="text-base font-semibold truncate">
                  #{proposal.number || proposal.proposal_number}
                </SheetTitle>
                <StatusBadge status={proposal.status} size="sm" />
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {(proposal as any).subject || proposal.title || "Konu belirtilmemiş"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {proposal.customer?.company || proposal.customer?.name || proposal.customer_name || "Müşteri yok"}
              </p>
            </div>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="flex gap-1.5">
            <Button onClick={handleEdit} size="sm" className="flex-1">
              <Edit3 className="mr-2 h-3.5 w-3.5" />
              Düzenle
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  PDF
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {templates.map(template => (
                  <DropdownMenuItem 
                    key={template.id} 
                    onClick={() => handleDownloadPdf(template.id)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {template.name}
                  </DropdownMenuItem>
                ))}
                {templates.length === 0 && (
                  <DropdownMenuItem disabled>
                    Şablon bulunamadı
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <div className="space-y-2.5 pt-2.5">
          {/* Özet Bilgiler */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Teklif Tarihi</p>
              <p className="font-medium text-sm">{formatDate((proposal as any).offer_date || proposal.created_at)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Geçerlilik</p>
              <p className="font-medium text-sm">{formatDate(proposal.valid_until)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Satış Temsilcisi</p>
              <p className="font-medium text-sm">
                {proposal.employee ? `${proposal.employee.first_name} ${proposal.employee.last_name}` : "-"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Para Birimi</p>
              <p className="font-medium text-sm">{proposal.currency || "TRY"}</p>
            </div>
            {(proposal as any).exchange_rate && proposal.currency !== "TRY" && (
              <div className="space-y-0.5 col-span-2">
                <p className="text-xs text-muted-foreground">Döviz Kuru</p>
                <p className="font-medium text-sm">
                  1 {proposal.currency} = {(proposal as any).exchange_rate} TRY
                </p>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Toplam Tutar - Öne Çıkarılmış */}
          <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Toplam Tutar</span>
              <span className="text-lg font-bold text-primary">
                {formatMoney(proposal.total_amount || proposal.total_value || 0)}
              </span>
            </div>
            {proposal.items && proposal.items.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {proposal.items.length} kalem
              </p>
            )}
          </div>

          {/* Teklif Kalemleri - Kompakt Liste */}
          {proposal.items && proposal.items.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Kalemler ({proposal.items.length})</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {proposal.items.slice(0, 5).map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-center p-1.5 bg-muted/30 rounded text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.name || (item as any).product_name || 'Ürün'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} adet × {formatMoney(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-semibold text-primary ml-2 text-sm">
                      {formatMoney(item.total_price)}
                    </span>
                  </div>
                ))}
                {proposal.items.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground py-1">
                    +{proposal.items.length - 5} kalem daha
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notlar - Sadece varsa göster */}
          {(proposal.description || proposal.notes) && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Notlar</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {proposal.description || proposal.notes}
                </p>
              </div>
            </>
          )}

          {/* Şartlar - Tek Accordion */}
          {(proposal.payment_terms || proposal.delivery_terms || proposal.warranty_terms || proposal.price_terms || proposal.other_terms) && (
            <>
              <Separator className="my-2" />
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="terms" className="border-0">
                  <AccordionTrigger className="py-1 px-0 hover:no-underline">
                    <h3 className="text-sm font-medium">Şartlar</h3>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1.5 pb-0">
                    <div className="space-y-2">
                      {proposal.payment_terms && (
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-start gap-1.5">
                            <CreditCard className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs mb-0.5">Ödeme Şartları</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {proposal.payment_terms}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {proposal.delivery_terms && (
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-start gap-1.5">
                            <Truck className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs mb-0.5">Teslimat Şartları</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {proposal.delivery_terms}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {proposal.warranty_terms && (
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-start gap-1.5">
                            <Shield className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs mb-0.5">Garanti Şartları</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {proposal.warranty_terms}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {proposal.price_terms && (
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-start gap-1.5">
                            <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs mb-0.5">Fiyatlandırma Koşulları</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {proposal.price_terms}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {proposal.other_terms && (
                        <div className="p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-start gap-1.5">
                            <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs mb-0.5">Diğer Şartlar</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {proposal.other_terms}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          )}

          {/* Geçmiş - Accordion */}
          <Separator className="my-2" />
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history" className="border-0">
              <AccordionTrigger className="py-1 px-0 hover:no-underline">
                <h3 className="text-sm font-medium">Geçmiş</h3>
              </AccordionTrigger>
              <AccordionContent className="pt-1.5 pb-0">
                <div className="space-y-2">
                  {/* History entries from database */}
                  {(proposal as any).history && Array.isArray((proposal as any).history) && (proposal as any).history.length > 0 ? (
                    (proposal as any).history
                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((entry: any, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className={`p-1 rounded-full mt-0.5 ${
                            entry.type === 'created' ? 'bg-gray-100' :
                            entry.type === 'status_changed' ? 'bg-purple-100' :
                            entry.type === 'updated' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            {entry.type === 'created' ? (
                              <CheckCircle2 className="h-2.5 w-2.5 text-gray-600" />
                            ) : entry.type === 'status_changed' ? (
                              <FileText className="h-2.5 w-2.5 text-purple-600" />
                            ) : (
                              <Edit3 className="h-2.5 w-2.5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium">{entry.title || 'Değişiklik'}</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(entry.timestamp), 'dd MMM yyyy HH:mm', { locale: tr })}
                              </span>
                            </div>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {entry.description}
                              </p>
                            )}
                            {entry.changes && entry.changes.length > 0 && (
                              <div className="mt-0.5 space-y-0.5">
                                {entry.changes.map((change: any, idx: number) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    • {change.field}: {change.oldValue || '-'} → {change.newValue || '-'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <>
                      {/* Fallback: Oluşturulma */}
                      {proposal.created_at && (
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded-full bg-gray-100 mt-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium">Teklif Oluşturuldu</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(proposal.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              #{proposal.number} numaralı teklif oluşturuldu
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Fallback: Güncelleme */}
                      {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded-full bg-blue-100 mt-0.5">
                            <Edit3 className="h-2.5 w-2.5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium">Son Güncelleme</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(proposal.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Durum: {proposalStatusLabels[proposal.status]}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProposalDetailSheet;
