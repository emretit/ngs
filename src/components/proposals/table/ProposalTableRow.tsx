
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { Edit2, MoreHorizontal, Trash2, Printer, ShoppingCart, Receipt, Copy, FileEdit, Users, UserPlus, GitBranch } from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProposalStatusCell } from "./ProposalStatusCell";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

import { useProposalCalculations } from "@/hooks/proposals/useProposalCalculations";
import { formatProposalAmount } from "@/services/workflow/proposalWorkflow";
import { toast } from "sonner";
import { PdfExportService } from "@/services/pdf/pdfExportService";

// import { ProposalPdfExporter } from "../ProposalPdfExporter";


interface ProposalTableRowProps {
  proposal: Proposal | null;
  index: number;
  formatMoney: (amount: number) => string;
  onSelect: (proposal: Proposal) => void;
  onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void;
  onDelete: (proposal: Proposal) => void;
  onCopySameCustomer?: (proposal: Proposal) => void;
  onCopyDifferentCustomer?: (proposal: Proposal) => void;
  onCreateRevision?: (proposal: Proposal) => void;
  templates: any[];
  onPdfPrint: (proposal: Proposal, templateId: string) => void;
  isLoading?: boolean;
}

export const ProposalTableRow: React.FC<ProposalTableRowProps> = ({
  proposal, 
  index, 
  formatMoney, 
  onSelect,
  onStatusChange,
  onDelete,
  onCopySameCustomer,
  onCopyDifferentCustomer,
  onCreateRevision,
  templates,
  onPdfPrint,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const { calculateTotals } = useProposalCalculations();

  // Loading state için skeleton göster
  if (isLoading || !proposal) {
    return (
      <TableRow className="h-8">
        <TableCell className="py-2 px-3"><div className="h-3 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-40 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
      </TableRow>
    );
  }

  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };

  // Firma ismini kısalt
  const getShortenedCompanyName = () => {
    const companyName = proposal.customer?.name || proposal.customer_name || "Müşteri yok";
    return shortenText(companyName, 20);
  };

  // Firma şirket bilgisini kısalt
  const getShortenedCompanyInfo = () => {
    if (!proposal.customer?.company) return null;
    return shortenText(proposal.customer.company, 18);
  };
  
  // Use the stored total_amount from database (calculated and saved correctly)
  const getGrandTotal = () => {
    return proposal.total_amount || 0;
  };
  
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/proposal/${proposal.id}`);
  };

  const handlePdfPrintClick = async (e: React.MouseEvent, templateId?: string) => {
    e.stopPropagation();
    try {
      // Teklif detaylarını çek
      const proposalData = await PdfExportService.transformProposalForPdf(proposal);
      
      // PDF'i yeni sekmede aç
      await PdfExportService.openPdfInNewTab(proposalData, { templateId });
      
      toast.success("PDF yeni sekmede açıldı");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    }
  };

  const handleConvertToOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/orders/create?proposalId=${proposal.id}`);
    toast.success("Sipariş oluşturma sayfasına yönlendiriliyorsunuz");
  };

  const handleConvertToInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/sales-invoices/create?proposalId=${proposal.id}`);
    toast.success("Fatura oluşturma sayfasına yönlendiriliyorsunuz");
  };


  
  return (
    <TableRow
      key={proposal.id}
      className="h-8 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelect(proposal)}
    >
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">#{proposal.number}</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 py-0 ${
              (proposal as any).revision_number 
                ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
                : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700'
            }`}
          >
            <GitBranch className="h-3 w-3 mr-0.5" />
            R{(proposal as any).revision_number || 0}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-2 px-3">
        {proposal.customer ? (
          <div className="flex flex-col space-y-0">
            <span className="text-xs font-medium" title={proposal.customer.name}>
              {getShortenedCompanyName()}
            </span>
            {proposal.customer.company && (
              <span className="text-xs text-muted-foreground" title={proposal.customer.company}>
                {getShortenedCompanyInfo()}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">{proposal.customer_name || "Müşteri yok"}</span>
        )}
      </TableCell>
      <TableCell className="py-2 px-3 text-xs" title={(proposal as any).subject || ""}>
        {shortenText((proposal as any).subject || "-", 30)}
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        <ProposalStatusCell 
          status={proposal.status} 
          proposalId={proposal.id} 
          onStatusChange={onStatusChange} 
        />
      </TableCell>
      <TableCell className="py-2 px-3">
        {proposal.employee ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {proposal.employee.first_name?.[0]}
                {proposal.employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium truncate">
              {proposal.employee.first_name} {proposal.employee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs font-medium">
        {formatProposalAmount(getGrandTotal(), proposal.currency || 'TRY')}
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs">
        <DateDisplay date={proposal.offer_date || proposal.created_at} />
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs">
        <DateDisplay date={proposal.valid_until} />
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(proposal);
            }}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8"
                title="İşlemler"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Yazdırma İşlemleri */}
              <DropdownMenuLabel>Yazdırma</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Printer className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Yazdır</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={(e) => handlePdfPrintClick(e, template.id)}
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
              
              <DropdownMenuSeparator />
              
              {/* Kopyala ve Revizyon İşlemleri */}
              <DropdownMenuLabel>Kopyala</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Copy className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Teklifi Kopyala</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {onCopySameCustomer && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopySameCustomer(proposal);
                      }}
                      className="cursor-pointer"
                    >
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Aynı Müşteri İçin</span>
                    </DropdownMenuItem>
                  )}
                  {onCopyDifferentCustomer && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyDifferentCustomer(proposal);
                      }}
                      className="cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                      <span>Farklı Müşteri İçin</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              {onCreateRevision && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateRevision(proposal);
                  }}
                  className="cursor-pointer"
                >
                  <FileEdit className="h-4 w-4 mr-2 text-orange-500" />
                  <span>Revizyon Oluştur</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Dönüştürme İşlemleri */}
              <DropdownMenuLabel>Dönüştür</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleConvertToOrder}
                className="cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
                <span>Siparişe Çevir</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleConvertToInvoice}
                className="cursor-pointer"
              >
                <Receipt className="h-4 w-4 mr-2 text-purple-500" />
                <span>Faturaya Çevir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
