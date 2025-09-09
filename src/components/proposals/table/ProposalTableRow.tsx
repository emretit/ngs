
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
  proposal: Proposal;
  index: number;
  formatMoney: (amount: number) => string;
  onSelect: (proposal: Proposal) => void;
  onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void;
  onDelete: (proposalId: string) => void;
  templates: any[];
  onPdfPrint: (proposal: Proposal, templateId: string) => void;
}

export const ProposalTableRow: React.FC<ProposalTableRowProps> = ({
  proposal, 
  index, 
  formatMoney, 
  onSelect,
  onStatusChange,
  onDelete,
  templates,
  onPdfPrint
}) => {
  const navigate = useNavigate();
  const { calculateTotals } = useProposalCalculations();
  const { toast } = useToast();

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
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onSelect(proposal)}
    >
      <TableCell className="font-medium p-4">#{proposal.number}</TableCell>
      <TableCell className="p-4">
        {proposal.customer ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {proposal.customer.name?.substring(0, 1) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium" title={proposal.customer.name}>
                {getShortenedCompanyName()}
              </div>
              {proposal.customer.company && (
                <div className="text-xs text-muted-foreground" title={proposal.customer.company}>
                  {getShortenedCompanyInfo()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">{proposal.customer_name || "Müşteri yok"}</span>
        )}
      </TableCell>
      <ProposalStatusCell 
        status={proposal.status} 
        proposalId={proposal.id} 
        onStatusChange={onStatusChange} 
      />
      <TableCell className="p-4">
        {proposal.employee ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                {proposal.employee.first_name?.[0]}
                {proposal.employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {proposal.employee.first_name} {proposal.employee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="font-medium p-4">
        {formatProposalAmount(getGrandTotal(), proposal.currency || 'TRY')}
      </TableCell>
      <TableCell className="p-4">{formatDate(proposal.created_at)}</TableCell>
      <TableCell className="p-4">{formatDate(proposal.valid_until)}</TableCell>
      <TableCell className="p-4">
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <PenLine className="h-4 w-4 mr-2" />
                Düzenle
              </DropdownMenuItem>
              
              {templates.length > 0 && (
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF İndir
                  <DropdownMenu>
                    <DropdownMenuContent>
                      {templates.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={(e) => handlePdfPrintClick(e, template.id)}
                        >
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(proposal.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
