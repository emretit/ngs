
import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Table, TableBody } from "@/components/ui/table";
import { Proposal, ProposalStatus } from "@/types/proposal";
import ProposalTableHeader from "./table/ProposalTableHeader";
import { ProposalTableRow } from "./table/ProposalTableRow";
import ProposalTableEmpty from "./table/ProposalTableEmpty";
import ProposalTableSkeleton from "./table/ProposalTableSkeleton";
import { useSortedProposals } from "./table/useSortedProposals";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { changeProposalStatus } from "@/services/crmService";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import { PdfTemplate } from "@/types/pdf-template";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import type { ProposalSortField, ProposalSortDirection } from "./table/types";
import { createProposal, getProposalById } from "@/services/proposal/api/crudOperations";

interface ProposalTableProps {
  proposals: Proposal[];
  isLoading: boolean;
  onProposalSelect: (proposal: Proposal) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
  statusFilter?: string;
  employeeFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const ProposalTable = ({ 
  proposals, 
  isLoading, 
  onProposalSelect, 
  onStatusChange,
  searchQuery = "",
  statusFilter = "all",
  employeeFilter = "all",
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: ProposalTableProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  
  // Fallback için internal state (eğer dışarıdan prop geçilmezse)
  const [internalSortField, setInternalSortField] = useState<ProposalSortField>("offer_date");
  const [internalSortDirection, setInternalSortDirection] = useState<ProposalSortDirection>("desc");
  
  // Dışarıdan prop geçilmişse onu kullan, yoksa internal state kullan
  const sortField = (externalSortField as ProposalSortField) ?? internalSortField;
  const sortDirection = (externalSortDirection as ProposalSortDirection) ?? internalSortDirection;
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Copy/Revision states
  const [isCopying, setIsCopying] = useState(false);
  const [isCustomerSelectDialogOpen, setIsCustomerSelectDialogOpen] = useState(false);
  const [proposalToCopy, setProposalToCopy] = useState<Proposal | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false);
  const { customers } = useCustomerSelect();

  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await PdfExportService.getTemplates(undefined, 'quote');
      setTemplates(data);
    } catch (error) {
      logger.error('Error loading templates:', error);
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
      logger.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    }
  };


  const handleStatusUpdate = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await changeProposalStatus(proposalId, newStatus);
      // Tüm proposal query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-list'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'], exact: false });
      // Hemen refetch yap - tablo otomatik yenilensin
      await queryClient.refetchQueries({ queryKey: ['proposals-list'], exact: false });
      // Sayfayı yenile
      onStatusChange?.();
      
      toast.success("Teklif durumu başarıyla güncellendi.");
    } catch (error) {
      logger.error('Error updating proposal status:', error);
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
      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-list'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposal', proposalToDelete.id] });
      // Hemen refetch yap - tablo otomatik yenilensin
      await queryClient.refetchQueries({ queryKey: ['proposals-list'], exact: false });
      
      toast.success("Teklif başarıyla silindi.");
    } catch (error) {
      logger.error('Error deleting proposal:', error);
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

  // Aynı müşteri için kopyalama - direkt kopyala
  const handleCopySameCustomer = async (proposal: Proposal) => {
    if (isCopying) return;
    
    setIsCopying(true);
    try {
      const { data: fullProposal, error: fetchError } = await getProposalById(proposal.id);
      
      if (fetchError || !fullProposal) {
        throw new Error('Teklif detayları alınamadı');
      }

      const copyData = {
        title: `${fullProposal.title} (Kopya)`,
        subject: fullProposal.subject ? `${fullProposal.subject} (Kopya)` : undefined,
        description: fullProposal.description,
        customer_id: fullProposal.customer_id,
        employee_id: fullProposal.employee_id,
        opportunity_id: undefined,
        status: 'draft' as ProposalStatus,
        valid_until: undefined,
        payment_terms: fullProposal.payment_terms,
        delivery_terms: fullProposal.delivery_terms,
        warranty_terms: fullProposal.warranty_terms,
        price_terms: fullProposal.price_terms,
        other_terms: fullProposal.other_terms,
        notes: fullProposal.notes,
        terms: fullProposal.terms,
        currency: fullProposal.currency || 'TRY',
        exchange_rate: fullProposal.exchange_rate,
        total_amount: fullProposal.total_amount,
        items: fullProposal.items?.map(item => ({
          ...item,
          id: undefined
        })) || [],
      };

      const { data: newProposal, error } = await createProposal(copyData);
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-list'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['proposals-list'], exact: false });
      
      toast.success("Teklif aynı müşteri için kopyalandı!");
      
      if (newProposal?.id) {
        navigate(`/proposal/${newProposal.id}`);
      }
    } catch (error) {
      logger.error('Error copying proposal:', error);
      toast.error("Teklif kopyalanırken bir hata oluştu.");
    } finally {
      setIsCopying(false);
    }
  };

  // Farklı müşteri için kopyalama - müşteri seçim dialog'unu aç
  const handleCopyDifferentCustomer = (proposal: Proposal) => {
    setProposalToCopy(proposal);
    setSelectedCustomerId("");
    setIsCustomerSelectDialogOpen(true);
  };

  // Farklı müşteri için kopyalama işlemini gerçekleştir
  const handleConfirmCopyDifferentCustomer = async () => {
    if (!proposalToCopy || !selectedCustomerId) {
      toast.error("Lütfen bir müşteri seçin");
      return;
    }

    if (isCopying) return;
    
    setIsCopying(true);
    try {
      const { data: fullProposal, error: fetchError } = await getProposalById(proposalToCopy.id);
      
      if (fetchError || !fullProposal) {
        throw new Error('Teklif detayları alınamadı');
      }

      const copyData = {
        title: `${fullProposal.title} (Kopya)`,
        subject: fullProposal.subject ? `${fullProposal.subject} (Kopya)` : undefined,
        description: fullProposal.description,
        customer_id: selectedCustomerId,
        employee_id: fullProposal.employee_id,
        opportunity_id: undefined,
        status: 'draft' as ProposalStatus,
        valid_until: undefined,
        payment_terms: fullProposal.payment_terms,
        delivery_terms: fullProposal.delivery_terms,
        warranty_terms: fullProposal.warranty_terms,
        price_terms: fullProposal.price_terms,
        other_terms: fullProposal.other_terms,
        notes: fullProposal.notes,
        terms: fullProposal.terms,
        currency: fullProposal.currency || 'TRY',
        exchange_rate: fullProposal.exchange_rate,
        total_amount: fullProposal.total_amount,
        items: fullProposal.items?.map(item => ({
          ...item,
          id: undefined
        })) || [],
      };

      const { data: newProposal, error } = await createProposal(copyData);
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-list'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['proposals-list'], exact: false });
      
      toast.success("Teklif farklı müşteri için kopyalandı!");
      
      setIsCustomerSelectDialogOpen(false);
      setProposalToCopy(null);
      setSelectedCustomerId("");
      
      if (newProposal?.id) {
        navigate(`/proposal/${newProposal.id}`);
      }
    } catch (error) {
      logger.error('Error copying proposal:', error);
      toast.error("Teklif kopyalanırken bir hata oluştu.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleCustomerSelectDialogClose = () => {
    setIsCustomerSelectDialogOpen(false);
    setProposalToCopy(null);
    setSelectedCustomerId("");
  };

  // Revizyon oluşturma fonksiyonu
  const handleCreateRevision = async (proposal: Proposal) => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      toast.loading("Revizyon oluşturuluyor...", { id: 'revision' });

      // Önce tam proposal verisini çekelim
      const { data: fullProposal, error: fetchError } = await getProposalById(proposal.id);

      if (fetchError || !fullProposal) {
        throw new Error('Teklif detayları alınamadı');
      }

      // Orijinal teklifi belirle (bu zaten bir revizyon mu?)
      const originalProposalId = fullProposal.parent_proposal_id || fullProposal.id;

      // Mevcut revizyonların sayısını al (database fonksiyonu kullanarak)
      const { data: revisionCount } = await import('@/integrations/supabase/client').then(m =>
        m.supabase.rpc('get_next_revision_number', { p_parent_id: originalProposalId })
      );

      const nextRevisionNumber = revisionCount || 1;

      // Revizyon için yeni proposal verisi hazırla ve hemen kaydet
      const revisionData = {
        title: fullProposal.title, // Başlığı değiştirme
        subject: fullProposal.subject,
        description: fullProposal.description,
        customer_id: fullProposal.customer_id,
        employee_id: fullProposal.employee_id,
        contact_name: fullProposal.contact_name,
        offer_date: fullProposal.offer_date,
        opportunity_id: fullProposal.opportunity_id, // Opportunity bağlantısını koru
        status: 'draft' as ProposalStatus,
        valid_until: undefined, // Yeni geçerlilik tarihi girilmeli
        payment_terms: fullProposal.payment_terms,
        delivery_terms: fullProposal.delivery_terms,
        warranty_terms: fullProposal.warranty_terms,
        price_terms: fullProposal.price_terms,
        other_terms: fullProposal.other_terms,
        notes: fullProposal.notes,
        terms: fullProposal.terms,
        currency: fullProposal.currency || 'TRY',
        exchange_rate: (fullProposal as any).exchange_rate,
        total_amount: fullProposal.total_amount,
        subtotal: fullProposal.subtotal,
        total_discount: fullProposal.total_discount,
        total_tax: fullProposal.total_tax,
        items: fullProposal.items?.map(item => ({
          ...item,
          id: undefined // Yeni itemlar için ID'yi temizle
        })) || [],
        // Revizyon bilgileri
        parent_proposal_id: originalProposalId,
        revision_number: nextRevisionNumber,
      };

      const { data: newProposal, error } = await createProposal(revisionData);

      if (error) {
        throw error;
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-list'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['proposals-list'], exact: false });

      toast.success(`Revizyon R${nextRevisionNumber} oluşturuldu!`, { id: 'revision' });

      // Yeni oluşturulan revizyonun düzenleme sayfasına yönlendir (aynı sayfa formatı)
      if (newProposal?.id) {
        navigate(`/proposal/${newProposal.id}`);
      }
    } catch (error) {
      logger.error('Error creating revision:', error);
      toast.error("Revizyon oluşturulurken bir hata oluştu.", { id: 'revision' });
    } finally {
      setIsCopying(false);
    }
  };

  const handleSort = (field: ProposalSortField) => {
    // Eğer dışarıdan onSort prop'u geçilmişse onu kullan (veritabanı seviyesinde sıralama)
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      // Fallback: client-side sıralama
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === "asc" ? "desc" : "asc");
      } else {
        setInternalSortField(field);
        setInternalSortDirection("asc");
      }
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

  // Eğer dışarıdan sıralama geçilmişse (veritabanı seviyesinde sıralama), 
  // ama employee_name veya customer_name gibi join edilen alanlar için
  // veritabanı seviyesinde sıralama yapılamaz, client-side sıralama yapılmalı
  const joinFields = ['employee_name', 'customer_name'];
  const needsClientSideSort = joinFields.includes(sortField);
  
  const sortedProposals = (externalOnSort && !needsClientSideSort)
    ? filteredProposals // Veritabanından sıralı geliyor, tekrar sıralama yapma
    : useSortedProposals(filteredProposals, sortField, sortDirection);

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
              onCopySameCustomer={handleCopySameCustomer}
              onCopyDifferentCustomer={handleCopyDifferentCustomer}
              onCreateRevision={handleCreateRevision}
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

    {/* Farklı Müşteri için Müşteri Seçim Dialog'u */}
    <Dialog open={isCustomerSelectDialogOpen} onOpenChange={handleCustomerSelectDialogClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Müşteri Seçin</DialogTitle>
          <DialogDescription>
            Teklifi kopyalamak istediğiniz müşteriyi seçin
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label htmlFor="customer-select">Müşteri <span className="text-red-500">*</span></Label>
          <Popover open={customerSelectOpen} onOpenChange={setCustomerSelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerSelectOpen}
                className={cn(
                  "w-full justify-between mt-2",
                  !selectedCustomerId && "text-muted-foreground"
                )}
              >
                {selectedCustomerId && customers
                  ? (() => {
                      const selected = customers.find(c => c.id === selectedCustomerId);
                      return selected
                        ? selected.company 
                          ? `${selected.name} (${selected.company})`
                          : selected.name
                        : "Müşteri seçin...";
                    })()
                  : "Müşteri seçin..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Müşteri ara..." />
                <CommandList>
                  <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {customers?.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.name} ${customer.company || ''}`}
                        onSelect={() => {
                          setSelectedCustomerId(customer.id);
                          setCustomerSelectOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          {customer.company && (
                            <span className="text-sm text-muted-foreground">{customer.company}</span>
                          )}
                          {customer.email && (
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCustomerSelectDialogClose}
            disabled={isCopying}
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirmCopyDifferentCustomer}
            disabled={isCopying || !selectedCustomerId}
          >
            {isCopying ? "Kopyalanıyor..." : "Kopyala"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </> );
};

export default ProposalTable;
