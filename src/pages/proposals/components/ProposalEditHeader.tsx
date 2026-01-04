import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Save, MoreHorizontal, Printer, Eye, Send, Clock, 
  ArrowLeft, Check, XCircle, Copy, Users, UserPlus, GitBranch, 
  ShoppingCart, Receipt, Building2, Trash 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { proposalStatusColors, proposalStatusLabels, ProposalStatus } from "@/types/proposal";
import { cn } from "@/lib/utils";

interface ProposalEditHeaderProps {
  proposal: any;
  proposalId?: string;
  hasChanges: boolean;
  isSaving: boolean;
  revisions: any[];
  templates: any[];
  formData: { customer_id: string };
  onSave: () => void;
  onPdfPrint: (templateId?: string) => void;
  onPreview: () => void;
  onSendEmail: () => void;
  onSendToCustomer: () => void;
  onSendForApproval: () => void;
  onConvertToDraft: () => void;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
  onCopySameCustomer: () => void;
  onCopyDifferentCustomer: () => void;
  onCreateRevision: () => void;
  onConvertToOrder: () => void;
  onConvertToInvoice: () => void;
  onDelete: () => void;
  isCopying: boolean;
}

export const ProposalEditHeader: React.FC<ProposalEditHeaderProps> = ({
  proposal,
  proposalId,
  hasChanges,
  isSaving,
  revisions,
  templates,
  formData,
  onSave,
  onPdfPrint,
  onPreview,
  onSendEmail,
  onSendToCustomer,
  onSendForApproval,
  onConvertToDraft,
  onAcceptProposal,
  onRejectProposal,
  onCopySameCustomer,
  onCopyDifferentCustomer,
  onCreateRevision,
  onConvertToOrder,
  onConvertToInvoice,
  onDelete,
  isCopying
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
      <div className="flex items-center justify-between p-3 pl-12">
        <div className="flex items-center gap-3">
          <BackButton 
            onClick={() => navigate("/proposals")}
            variant="ghost"
            size="sm"
          >
            Teklifler
          </BackButton>
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Teklif Düzenle
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground/70">
                  {proposal.number || 'Teklif #' + proposalId}
                </p>
                <Badge className={`${proposalStatusColors[proposal.status]} text-xs`}>
                  {proposalStatusLabels[proposal.status]}
                </Badge>
                {proposal.revision_number !== undefined && proposal.revision_number !== null && (
                  <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    proposal.revision_number
                      ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
                      : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700'
                  }`}
                >
                  R{proposal.revision_number || 0}
                </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Kaydediliyor..." : hasChanges ? "Değişiklikleri Kaydet" : "Kaydedildi"}</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="font-medium">İşlemler</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Yazdırma</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Printer className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Yazdır</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => onPdfPrint(template.id)}
                        className="cursor-pointer"
                      >
                        <Printer className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{template.name || 'PDF Yazdır'}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Şablon bulunamadı
                    </div>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={onPreview} className="gap-2 cursor-pointer">
                <Eye className="h-4 w-4 text-slate-500" />
                <span>Önizle</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendEmail} className="gap-2 cursor-pointer">
                <Send className="h-4 w-4 text-slate-500" />
                <span>E-posta Gönder</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Durum</DropdownMenuLabel>
              {proposal.status === 'draft' && (
                <>
                  <DropdownMenuItem onClick={onSendToCustomer} className="gap-2 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Send className="h-4 w-4" />
                    <span>Müşteriye Gönder</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSendForApproval} className="gap-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    <Clock className="h-4 w-4" />
                    <span>Onaya Gönder</span>
                  </DropdownMenuItem>
                </>
              )}
              
              {proposal.status === 'pending_approval' && (
                <>
                  <DropdownMenuItem onClick={onSendToCustomer} className="gap-2 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Send className="h-4 w-4" />
                    <span>Müşteriye Gönder</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onConvertToDraft} className="gap-2 cursor-pointer text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Taslağa Çevir</span>
                  </DropdownMenuItem>
                </>
              )}
              
              {proposal.status === 'sent' && (
                <>
                  <DropdownMenuItem onClick={onAcceptProposal} className="gap-2 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Check className="h-4 w-4" />
                    <span>Kabul Edildi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onRejectProposal} className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                    <XCircle className="h-4 w-4" />
                    <span>Reddedildi</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Kopyala & Revizyon</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Copy className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Teklifi Kopyala</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuItem
                    onClick={onCopySameCustomer}
                    className="cursor-pointer"
                    disabled={isCopying}
                  >
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Aynı Müşteri İçin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onCopyDifferentCustomer}
                    className="cursor-pointer"
                    disabled={isCopying}
                  >
                    <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                    <span>Farklı Müşteri İçin</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={onCreateRevision} className="gap-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                <GitBranch className="h-4 w-4" />
                <span>Yeni Revizyon Oluştur</span>
              </DropdownMenuItem>

              {revisions.length > 1 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <GitBranch className="h-4 w-4 mr-2 text-orange-500" />
                    <span>Revizyonlar ({revisions.length})</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    {revisions.map((rev) => (
                      <DropdownMenuItem
                        key={rev.id}
                        onClick={() => navigate(`/proposal/${rev.id}`)}
                        className={cn(
                          "cursor-pointer flex items-center justify-between",
                          rev.id === proposal.id && "bg-orange-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              rev.revision_number === 0
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : "bg-orange-50 text-orange-600 border-orange-200"
                            )}
                          >
                            R{rev.revision_number || 0}
                          </Badge>
                          <span className="text-xs">{rev.number}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              proposalStatusColors[rev.status as ProposalStatus]
                            )}
                          >
                            {proposalStatusLabels[rev.status as ProposalStatus]}
                          </Badge>
                        </div>
                        {rev.id === proposal.id && (
                          <Check className="h-3 w-3 text-orange-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Dönüştür</DropdownMenuLabel>
              <DropdownMenuItem onClick={onConvertToOrder} className="gap-2 cursor-pointer">
                <ShoppingCart className="h-4 w-4 text-green-500" />
                <span>Siparişe Çevir</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onConvertToInvoice} className="gap-2 cursor-pointer">
                <Receipt className="h-4 w-4 text-purple-500" />
                <span>Faturaya Çevir</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {formData.customer_id && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate(`/customers/${formData.customer_id}`)}
                    className="gap-2 cursor-pointer"
                  >
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span>Müşteri Sayfasına Git</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={onDelete} className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash className="h-4 w-4" />
                <span>Sil</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

