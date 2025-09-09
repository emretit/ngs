
import { useState, useEffect } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { useProposals } from "@/hooks/useProposals";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { changeProposalStatus } from "@/services/crmService";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "./types";
import { Column } from "./types";
import { ProposalTableHeader } from "./table/ProposalTableHeader";
import { ProposalTableRow } from "./table/ProposalTableRow";
import { ProposalTableSkeleton } from "./table/ProposalTableSkeleton";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import { PdfTemplate } from "@/types/pdf-template";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface ProposalTableProps {
  proposals: Proposal[];
  isLoading: boolean;
  onProposalSelect: (proposal: Proposal) => void;
}

const ProposalTable = ({ proposals, isLoading, onProposalSelect }: ProposalTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  
  const [columns] = useState<Column[]>([
    { id: "number", label: "Teklif No", visible: true, sortable: true },
    { id: "customer", label: "Müşteri", visible: true, sortable: true },
    { id: "status", label: "Durum", visible: true, sortable: true },
    { id: "employee", label: "Satış Temsilcisi", visible: true, sortable: true },
    { id: "total_amount", label: "Toplam Tutar", visible: true, sortable: true },
    { id: "created_at", label: "Oluşturma Tarihi", visible: true, sortable: true },
    { id: "valid_until", label: "Geçerlilik", visible: true, sortable: true },
    { id: "actions", label: "İşlemler", visible: true },
  ]);

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

  const handlePdfPrint = async (proposal: Proposal, templateId: string) => {
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
      });
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusUpdate = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await changeProposalStatus(proposalId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      
      toast({
        title: "Durum güncellendi",
        description: "Teklif durumu başarıyla güncellendi.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast({
        title: "Hata",
        description: "Teklif durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm("Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    try {
      // TODO: Add actual delete API call here
      // await deleteProposal(proposalId);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      
      toast({
        title: "Teklif silindi",
        description: "Teklif başarıyla silindi.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast({
        title: "Hata",
        description: "Teklif silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatMoney = (amount: number, currency: string = 'TRY') => {
    if (!amount && amount !== 0) return `${getCurrencySymbol(currency)}0`;
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'TRY': '₺',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  if (isLoading && proposals.length === 0) {
    return <ProposalTableSkeleton />;
  }

  if (!proposals || proposals.length === 0) {
    return <div className="p-4 text-center text-gray-500">Henüz teklif bulunmamaktadır.</div>;
  }

  // Sort proposals based on the sort field and direction
  const sortedProposals = [...proposals].sort((a, b) => {
    if (!a || !b) return 0;
    
    const fieldA = sortField === 'customer' 
      ? a.customer?.name || ''
      : sortField === 'employee'
      ? a.employee?.first_name || ''
      : (a as any)[sortField];
      
    const fieldB = sortField === 'customer' 
      ? b.customer?.name || ''
      : sortField === 'employee'
      ? b.employee?.first_name || ''
      : (b as any)[sortField];
    
    if (!fieldA && !fieldB) return 0;
    if (!fieldA) return sortDirection === 'asc' ? -1 : 1;
    if (!fieldB) return sortDirection === 'asc' ? 1 : -1;
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }
    
    const valueA = String(fieldA).toLowerCase();
    const valueB = String(fieldB).toLowerCase();
    
    return sortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  // Since we're now receiving proposals directly, no need for additional filtering
  // The filtering is handled at the parent level with infinite scroll
  const filteredProposals = sortedProposals;

  return (
    <div className="bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
      <div className="relative z-10 p-6">
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <ProposalTableHeader 
            columns={columns} 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {filteredProposals.map((proposal, index) => (
              <ProposalTableRow
                key={proposal.id}
                proposal={proposal}
                index={index}
                formatMoney={formatMoney}
                onSelect={onProposalSelect}
                onStatusChange={handleStatusUpdate}
                onDelete={handleDeleteProposal}
                templates={templates}
                onPdfPrint={handlePdfPrint}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
};

export default ProposalTable;
