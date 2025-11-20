
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Edit2, MoreHorizontal, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProposalStatusCell } from "./ProposalStatusCell";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { useProposalCalculations } from "@/hooks/proposals/useProposalCalculations";
import { formatProposalAmount } from "@/services/workflow/proposalWorkflow";
import { useToast } from "@/hooks/use-toast";
import { PdfExportService } from "@/services/pdf/pdfExportService";

// import { ProposalPdfExporter } from "../ProposalPdfExporter";


interface ProposalTableRowProps {
  proposal: Proposal | null;
  index: number;
  formatMoney: (amount: number) => string;
  onSelect: (proposal: Proposal) => void;
  onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void;
  onDelete: (proposal: Proposal) => void;
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
  templates,
  onPdfPrint,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const { calculateTotals } = useProposalCalculations();
  const { toast } = useToast();

  // Loading state için skeleton göster
  if (isLoading || !proposal) {
    return (
      <TableRow className="h-8">
        <TableCell className="py-2 px-3"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-2"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-2"><div className="h-6 w-6 bg-gray-200 rounded animate-pulse" /></TableCell>
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
  
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch {
      return "-";
    }
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/proposal/${proposal.id}`);
  };

  const handlePdfPrintClick = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    try {
      // Teklif detaylarını çek
      const proposalData = await PdfExportService.transformProposalForPdf(proposal);
      
      // PDF'i yeni sekmede aç
      await PdfExportService.openPdfInNewTab(proposalData, { templateId });
      
      toast({
        title: "Başarılı",
        description: "PDF yeni sekmede açıldı",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken hata oluştu: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };


  
  return (
    <TableRow
      key={proposal.id}
      className="h-16 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelect(proposal)}
    >
      <TableCell className="p-4 font-medium text-sm">#{proposal.number}</TableCell>
      <TableCell className="p-4">
        {proposal.customer ? (
          <div className="flex flex-col space-y-0">
            <span className="text-sm font-medium" title={proposal.customer.name}>
              {getShortenedCompanyName()}
            </span>
            {proposal.customer.company && (
              <span className="text-xs text-muted-foreground" title={proposal.customer.company}>
                {getShortenedCompanyInfo()}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">{proposal.customer_name || "Müşteri yok"}</span>
        )}
      </TableCell>
      <TableCell className="text-center p-4">
        <ProposalStatusCell 
          status={proposal.status} 
          proposalId={proposal.id} 
          onStatusChange={onStatusChange} 
        />
      </TableCell>
      <TableCell className="p-4">
        {proposal.employee ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {proposal.employee.first_name?.[0]}
                {proposal.employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {proposal.employee.first_name} {proposal.employee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="text-center p-4 text-sm font-medium">
        {formatProposalAmount(getGrandTotal(), proposal.currency || 'TRY')}
      </TableCell>
      <TableCell className="text-center p-4 text-sm">{formatDate(proposal.offer_date)}</TableCell>
      <TableCell className="text-center p-4 text-sm">{formatDate(proposal.valid_until)}</TableCell>
      <TableCell className="p-4 text-center">
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
          
          {templates && templates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8"
                  title="Daha Fazla"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={(e) => handlePdfPrintClick(e, template.id)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {template.name || 'PDF Yazdır'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
