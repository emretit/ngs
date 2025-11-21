
import React, { useState, useEffect } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Proposal, ProposalStatus } from "@/types/proposal";
import ProposalTableHeader from "./table/ProposalTableHeader";
import { ProposalTableRow } from "./table/ProposalTableRow";
import ProposalTableEmpty from "./table/ProposalTableEmpty";
import ProposalTableSkeleton from "./table/ProposalTableSkeleton";
import { useSortedProposals } from "./table/useSortedProposals";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { changeProposalStatus } from "@/services/crmService";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import { PdfTemplate } from "@/types/pdf-template";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import type { ProposalSortField, ProposalSortDirection } from "./table/types";

interface ProposalTableProps {
  proposals: Proposal[];
  isLoading: boolean;
  onProposalSelect: (proposal: Proposal) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
  statusFilter?: string;
  employeeFilter?: string;
}

const ProposalTable = ({ 
  proposals, 
  isLoading, 
  onProposalSelect, 
  onStatusChange,
  searchQuery = "",
  statusFilter = "all",
  employeeFilter = "all"
}: ProposalTableProps) => {
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [sortField, setSortField] = useState<ProposalSortField>("offer_date");
  const [sortDirection, setSortDirection] = useState<ProposalSortDirection>("desc");
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      
      toast.success("PDF yeni sekmede açıldı");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    }
  };


  const handleStatusUpdate = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await changeProposalStatus(proposalId, newStatus);
      // Hem normal proposals hem de infinite scroll query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      // Hemen refetch yap - tablo otomatik yenilensin
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      // Sayfayı yenile
      onStatusChange?.();
      
      toast.success("Teklif durumu başarıyla güncellendi.");
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast.error("Teklif durumu güncellenirken bir hata oluştu.");
    }
  };

  const handleDeleteProposalClick = (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProposalConfirm = async () => {
    if (!proposalToDelete) return;

    setIsDeleting(true);
    try {
      // Import deleteProposal function
      const { deleteProposal } = await import("@/services/proposal/api/crudOperations");
      const result = await deleteProposal(proposalToDelete.id);
      
      if (result.error) {
        throw result.error;
      }
      
      // Invalidate all proposal queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', proposalToDelete.id] });
      // Hemen refetch yap - tablo otomatik yenilensin
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      
      toast.success("Teklif başarıyla silindi.");
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error("Teklif silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setProposalToDelete(null);
    }
  };

  const handleDeleteProposalCancel = () => {
    setIsDeleteDialogOpen(false);
    setProposalToDelete(null);
  };

  const handleSort = (field: ProposalSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  // Filter proposals based on criteria
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = !searchQuery ||
      proposal.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proposal.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (proposal.customer_name?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
    const matchesEmployee = employeeFilter === "all" || proposal.employee?.id === employeeFilter;

    return matchesSearch && matchesStatus && matchesEmployee;
  });

  // Sort the filtered proposals
  const sortedProposals = useSortedProposals(filteredProposals, sortField, sortDirection);

  return (<>
    <Table>
      <ProposalTableHeader
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
      />
      <TableBody>
        {sortedProposals.length === 0 ? (
          <ProposalTableEmpty />
        ) : (
          sortedProposals.map((proposal, index) => (
            <ProposalTableRow
              key={proposal.id}
              proposal={proposal}
              index={index}
              formatMoney={formatMoney}
              onSelect={onProposalSelect}
              onStatusChange={handleStatusUpdate}
              onDelete={handleDeleteProposalClick}
              templates={templates}
              onPdfPrint={handlePdfPrint}
            />
          ))
        )}
      </TableBody>
    </Table>

    {/* Confirmation Dialog */}
    <ConfirmationDialogComponent
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      title="Teklifi Sil"
      description={`"${proposalToDelete?.number || 'Bu teklif'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      confirmText="Sil"
      cancelText="İptal"
      variant="destructive"
      onConfirm={handleDeleteProposalConfirm}
      onCancel={handleDeleteProposalCancel}
      isLoading={isDeleting}
    />
  </> );
};

export default ProposalTable;
