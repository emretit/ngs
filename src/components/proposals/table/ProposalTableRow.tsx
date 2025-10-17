
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Eye, PenLine, MoreHorizontal, Trash2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProposalStatusCell } from "./ProposalStatusCell";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      onClick={() => onSelect(proposal)} 
      className="cursor-pointer hover:bg-blue-50 h-8"
    >
      <TableCell className="font-medium py-2 px-3 text-xs">#{proposal.number}</TableCell>
      <TableCell className="py-2 px-3">
        {proposal.customer ? (
          <div className="flex flex-col space-y-0">
            <span className="text-xs font-medium" title={proposal.customer.name}>
              {getShortenedCompanyName()}
            </span>
            {proposal.customer.company && (
              <span className="text-xs text-gray-500" title={proposal.customer.company}>
                {getShortenedCompanyInfo()}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-xs">{proposal.customer_name || "Müşteri yok"}</span>
        )}
      </TableCell>
      <TableCell className="text-center py-2 px-2">
        <ProposalStatusCell 
          status={proposal.status} 
          proposalId={proposal.id} 
          onStatusChange={onStatusChange} 
        />
      </TableCell>
      <TableCell className="py-2 px-2">
        {proposal.employee ? (
          <div className="flex items-center space-x-0.5">
            <Avatar className="h-3.5 w-3.5">
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
      <TableCell className="text-center py-2 px-2 text-xs font-medium">
        {formatProposalAmount(getGrandTotal(), proposal.currency || 'TRY')}
      </TableCell>
      <TableCell className="text-center py-2 px-2 text-xs">{formatDate(proposal.created_at)}</TableCell>
      <TableCell className="text-center py-2 px-2 text-xs">{formatDate(proposal.valid_until)}</TableCell>
      <TableCell className="py-2 px-2">
        <div className="flex justify-end space-x-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(proposal);
            }}
            className="h-4 w-4 hover:bg-blue-100"
          >
            <Eye className="h-2.5 w-2.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 hover:bg-gray-100"
          >
            <MoreHorizontal className="h-2.5 w-2.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
