
import { useState, useEffect } from "react";
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
import { Download, FileText, Building2, BarChart3, User, DollarSign, Calendar, Clock, Settings } from "lucide-react";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface ProposalTableProps {
  proposals: Proposal[];
  isLoading: boolean;
  onProposalSelect: (proposal: Proposal) => void;
  onStatusChange?: () => void;
}

const ProposalTable = ({ proposals, isLoading, onProposalSelect, onStatusChange }: ProposalTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [columns] = useState<Column[]>([
    { id: "number", label: "Teklif No", visible: true, sortable: false },
    { id: "customer", label: "Müşteri", visible: true, sortable: false },
    { id: "status", label: "Durum", visible: true, sortable: false },
    { id: "employee", label: "Satış Temsilcisi", visible: true, sortable: false },
    { id: "total_amount", label: "Toplam Tutar", visible: true, sortable: false },
    { id: "created_at", label: "Oluşturma Tarihi", visible: true, sortable: false },
    { id: "valid_until", label: "Geçerlilik", visible: true, sortable: false },
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


  const handleStatusUpdate = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await changeProposalStatus(proposalId, newStatus);
      // Hem normal proposals hem de infinite scroll query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      // Sayfayı yenile
      onStatusChange?.();
      
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

  const handleDeleteProposalClick = (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProposalConfirm = async () => {
    if (!proposalToDelete) return;

    setIsDeleting(true);
    try {
      // TODO: Add actual delete API call here
      // await deleteProposal(proposalToDelete.id);
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

  // Sort proposals by creation date (newest first) - no other sorting
  const sortedProposals = [...proposals].sort((a, b) => {
    if (!a || !b) return 0;
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    
    // If dates are the same, sort by ID to maintain consistent order
    if (dateA === dateB) {
      return a.id.localeCompare(b.id);
    }
    
    return dateB - dateA; // Newest first
  });

  // Since we're now receiving proposals directly, no need for additional filtering
  // The filtering is handled at the parent level with infinite scroll
  const filteredProposals = sortedProposals;

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Teklif No</span>
              </div>
            </TableHead>
            <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Müşteri Bilgileri</span>
              </div>
            </TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Durum</span>
              </div>
            </TableHead>
            <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Satış Temsilcisi</span>
              </div>
            </TableHead>
            <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Toplam Tutar</span>
              </div>
            </TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Oluşturma Tarihi</span>
              </div>
            </TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Geçerlilik</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-right">
              <div className="flex items-center justify-end gap-2">
                <Settings className="h-4 w-4" />
                <span>İşlemler</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index} className="h-8">
              <TableCell className="py-2 px-3"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-6 w-6 bg-gray-200 rounded animate-pulse" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (<>
    <Table>
      <ProposalTableHeader 
        columns={columns} 
      />
      <TableBody>
        {filteredProposals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun teklif bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          filteredProposals.map((proposal, index) => (
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
