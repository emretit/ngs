
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Proposal } from "@/types/proposal";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import StatusBadge from "./detail/StatusBadge";

import { 
  Edit3,
  FileText,
  Package,
  CreditCard,
  MessageSquare,
  Target,
  Paperclip,
  Download,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: proposal.currency || "TRY",
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





  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {/* Header */}
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-semibold truncate">
                {proposal.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                TEK-{proposal.number || proposal.proposal_number}
              </p>
            </div>
            <StatusBadge status={proposal.status} size="sm" />
          </div>

          <div className="space-y-3">
            <Button onClick={handleEdit} className="w-full">
              <Edit3 className="mr-2 h-4 w-4" />
              Teklifi Düzenle
            </Button>

            {/* PDF Export Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF Yazdır
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
                    {template.name} {template.is_default && '(Varsayılan)'}
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

        <div className="space-y-6">
          {/* Teklif Kalemleri */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">
                Teklif Kalemleri ({proposal.items?.length || 0})
              </h3>
            </div>
            
            <div className="space-y-3">
              {proposal.items && proposal.items.length > 0 ? (
                proposal.items.map((item, index) => (
                  <div key={item.id || index} className="p-4 bg-muted/30 rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <span className="text-sm font-semibold text-primary">
                          {formatMoney(item.total_price)}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="block font-medium">Miktar</span>
                          <span>{item.quantity}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Birim Fiyat</span>
                          <span>{formatMoney(item.unit_price)}</span>
                        </div>
                        <div>
                          <span className="block font-medium">KDV</span>
                          <span>%{item.tax_rate || 18}</span>
                        </div>
                      </div>
                      
                      {item.discount_rate && item.discount_rate > 0 && (
                        <div className="text-xs text-green-600">
                          İndirim: %{item.discount_rate}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Bu teklifte henüz kalem bulunmuyor</p>
                </div>
              )}
            </div>

            {proposal.items && proposal.items.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Toplam Tutar:</span>
                  <span className="text-lg text-primary">
                    {formatMoney(proposal.total_amount || proposal.total_value || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Ödeme ve Teslimat Şartları */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Ödeme ve Teslimat</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Ödeme Şartları</h4>
                <p className="text-sm text-muted-foreground">
                  {proposal.payment_terms || "Belirtilmemiş"}
                </p>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Teslimat Şartları</h4>
                <p className="text-sm text-muted-foreground">
                  {proposal.delivery_terms || "Belirtilmemiş"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notlar ve Açıklamalar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Notlar ve Açıklamalar</h3>
            </div>
            
            <div className="space-y-4">
              {(proposal.description || proposal.notes) && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Teklif Açıklaması</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {proposal.description || proposal.notes}
                  </p>
                </div>
              )}
              
              {proposal.internal_notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 text-yellow-800">Dahili Notlar</h4>
                  <p className="text-sm text-yellow-700 leading-relaxed">
                    {proposal.internal_notes}
                  </p>
                </div>
              )}
              
              {proposal.terms && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Şartlar ve Koşullar</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {proposal.terms}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fırsat Bilgileri */}
          {proposal.opportunity_id && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">İlişkili Fırsat</h3>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Bu teklif bir satış fırsatından oluşturulmuştur.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Fırsat ID: {proposal.opportunity_id}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Ekler */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Ekler ({proposal.attachments.length})</h3>
                </div>
                
                <div className="space-y-2">
                  {proposal.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.type} • {Math.round(attachment.size / 1024)} KB
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          Görüntüle
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProposalDetailSheet;
