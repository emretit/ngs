import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDateToLocalString } from "@/utils/dateUtils";
import { ProposalStatus, proposalStatusLabels } from "@/types/proposal";
import { handleProposalStatusChange } from "@/services/workflow/proposalWorkflow";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import { ProposalItem } from "@/types/proposal";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface ProposalFormData {
  contact_name: string;
  validity_date: Date | undefined;
  subject: string;
  offer_date: Date | undefined;
  offer_number: string;
  customer_id: string;
  employee_id: string;
  notes: string;
  payment_terms: string;
  delivery_terms: string;
  warranty_terms: string;
  price_terms: string;
  other_terms: string;
  currency: string;
  exchange_rate: number | undefined;
  vat_percentage: number;
}

interface TotalsByCurrency {
  gross: number;
  discount: number;
  vat: number;
  grand: number;
}

export const useProposalActions = (
  proposal: any,
  formData: ProposalFormData,
  items: LineItem[],
  primaryTotals: TotalsByCurrency,
  primaryCurrency: string,
  customers: any[],
  handleSave: (data: any) => Promise<void>,
  refetchProposal?: () => Promise<void>,
  proposalId?: string
) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCustomerSelectDialogOpen, setIsCustomerSelectDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const handleSaveChanges = useCallback(async (status: ProposalStatus = proposal?.status || 'draft') => {
    // Validation
    if (!formData.contact_name.trim()) {
      toast.error("İletişim kişisi adı gereklidir");
      return;
    }
    if (!formData.validity_date) {
      toast.error("Geçerlilik tarihi gereklidir");
      return;
    }
    if (items.length === 0 || items.every(item => !item.name.trim() && !item.description.trim())) {
      toast.error("En az bir teklif kalemi eklenmelidir");
      return;
    }

    setIsSaving(true);
    try {
      let customerCompanyName = "Müşteri";
      if (formData.customer_id) {
        const selected = customers?.find(c => c.id === formData.customer_id);
        if (selected) {
          customerCompanyName = selected.company || selected.name || "Müşteri";
        }
      }
      
      const proposalData = {
        title: `${customerCompanyName} - Teklif`,
        subject: formData.subject,
        description: formData.notes,
        number: formData.offer_number,
        customer_id: formData.customer_id || null,
        employee_id: formData.employee_id || null,
        contact_name: formData.contact_name || "",
        offer_date: formData.offer_date ? formatDateToLocalString(formData.offer_date) : null,
        valid_until: formData.validity_date ? formatDateToLocalString(formData.validity_date) : "",
        terms: `${formData.payment_terms}\n\n${formData.delivery_terms}\n\nGaranti: ${formData.warranty_terms}`,
        payment_terms: formData.payment_terms,
        delivery_terms: formData.delivery_terms,
        warranty_terms: formData.warranty_terms,
        price_terms: formData.price_terms,
        other_terms: formData.other_terms,
        notes: formData.notes,
        status: status,
        subtotal: primaryTotals.gross,
        total_discount: primaryTotals.discount,
        total_tax: primaryTotals.vat,
        total_amount: primaryTotals.grand,
        currency: primaryCurrency,
        exchange_rate: formData.exchange_rate,
        items: items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price
        }))
      };

      await handleSave(proposalData);
      
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      if (proposalId) {
        queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
      }
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      
      if (refetchProposal) {
        await refetchProposal();
      }
    } catch (error) {
      console.error("Error saving proposal:", error);
      toast.error("Teklif güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  }, [proposal, formData, items, primaryTotals, primaryCurrency, customers, handleSave, refetchProposal, proposalId, queryClient]);

  const handleStatusChange = useCallback(async (newStatus: ProposalStatus) => {
    if (!proposal) return;
    
    try {
      await handleProposalStatusChange(
        proposal.id,
        proposal.title,
        proposal.opportunity_id || null,
        newStatus,
        proposal.employee_id
      );
      
      toast.success(`Teklif durumu "${proposalStatusLabels[newStatus]}" olarak güncellendi`);
    } catch (error) {
      console.error("Error updating proposal status:", error);
      toast.error("Teklif durumu güncellenirken bir hata oluştu");
    }
  }, [proposal]);

  const handleDeleteClick = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      toast.success("Teklif silindi");
      navigate("/proposals");
    } catch (error) {
      console.error('Error deleting proposal:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [navigate]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const handlePdfPrint = useCallback(async (templateId?: string) => {
    if (!proposal) return;
    
    try {
      const proposalData = await PdfExportService.transformProposalForPdf(proposal);
      await PdfExportService.openPdfInNewTab(proposalData, { templateId });
      toast("PDF yeni sekmede açıldı");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    }
  }, [proposal]);

  const handleSendEmail = useCallback(() => {
    toast.success("E-posta gönderme penceresi açıldı");
  }, []);

  const handleConvertToOrder = useCallback(() => {
    if (!proposal) return;
    navigate(`/orders/create?proposalId=${proposal.id}`);
    toast.success("Sipariş oluşturma sayfasına yönlendiriliyorsunuz");
  }, [proposal, navigate]);

  const handleConvertToInvoice = useCallback(() => {
    if (!proposal) return;
    navigate(`/sales-invoices/create?proposalId=${proposal.id}`);
    toast.success("Fatura oluşturma sayfasına yönlendiriliyorsunuz");
  }, [proposal, navigate]);

  const handleSendToCustomer = useCallback(() => {
    handleStatusChange('sent');
  }, [handleStatusChange]);

  const handleSendForApproval = useCallback(() => {
    handleStatusChange('pending_approval');
  }, [handleStatusChange]);

  const handleConvertToDraft = useCallback(() => {
    handleStatusChange('draft');
  }, [handleStatusChange]);

  const handleAcceptProposal = useCallback(() => {
    handleStatusChange('accepted');
  }, [handleStatusChange]);

  const handleRejectProposal = useCallback(() => {
    handleStatusChange('rejected');
  }, [handleStatusChange]);

  const handleCreateRevision = useCallback(async () => {
    try {
      toast.loading("Revizyon oluşturuluyor...", { id: 'revision' });

      const originalProposalId = proposal.parent_proposal_id || proposal.id;

      const { supabase } = await import('@/integrations/supabase/client');
      const { data: revisionCount } = await supabase.rpc('get_next_revision_number', { p_parent_id: originalProposalId });

      const nextRevisionNumber = revisionCount || 1;

      const { createProposal } = await import('@/services/proposal/api/crudOperations');

      const revisionData = {
        title: proposal.title,
        subject: proposal.subject,
        description: proposal.description,
        customer_id: proposal.customer_id,
        employee_id: proposal.employee_id,
        contact_name: proposal.contact_name,
        offer_date: proposal.offer_date,
        opportunity_id: proposal.opportunity_id,
        status: 'draft' as ProposalStatus,
        valid_until: undefined,
        payment_terms: proposal.payment_terms,
        delivery_terms: proposal.delivery_terms,
        warranty_terms: proposal.warranty_terms,
        price_terms: proposal.price_terms,
        other_terms: proposal.other_terms,
        notes: proposal.notes,
        terms: proposal.terms,
        currency: proposal.currency || 'TRY',
        exchange_rate: proposal.exchange_rate,
        total_amount: proposal.total_amount,
        subtotal: proposal.subtotal,
        total_discount: proposal.total_discount,
        total_tax: proposal.total_tax,
        items: proposal.items?.map((item: any) => ({
          ...item,
          id: undefined
        })) || [],
        parent_proposal_id: originalProposalId,
        revision_number: nextRevisionNumber,
      };

      const { data: newProposal, error } = await createProposal(revisionData);

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] });

      toast.success(`Revizyon R${nextRevisionNumber} oluşturuldu!`, { id: 'revision' });

      if (newProposal?.id) {
        navigate(`/proposal/${newProposal.id}`);
      }
    } catch (error) {
      console.error('Error creating revision:', error);
      toast.error("Revizyon oluşturulurken bir hata oluştu.", { id: 'revision' });
    }
  }, [proposal, queryClient, navigate]);

  const handleCopySameCustomer = useCallback(async () => {
    if (!proposal || isCopying) return;
    
    setIsCopying(true);
    try {
      const { createProposal, getProposalById } = await import('@/services/proposal/api/crudOperations');
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
        items: fullProposal.items?.map((item: any) => ({
          ...item,
          id: undefined
        })) || [],
      };

      const { data: newProposal, error } = await createProposal(copyData);
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      
      toast.success("Teklif aynı müşteri için kopyalandı!");
      
      if (newProposal?.id) {
        navigate(`/proposal/${newProposal.id}`);
      }
    } catch (error) {
      console.error('Error copying proposal:', error);
      toast.error("Teklif kopyalanırken bir hata oluştu.");
    } finally {
      setIsCopying(false);
    }
  }, [proposal, isCopying, queryClient, navigate]);

  const handleCopyDifferentCustomer = useCallback(() => {
    setSelectedCustomerId("");
    setIsCustomerSelectDialogOpen(true);
  }, []);

  const handleConfirmCopyDifferentCustomer = useCallback(async () => {
    if (!proposal || !selectedCustomerId) {
      toast.error("Lütfen bir müşteri seçin");
      return;
    }

    if (isCopying) return;
    
    setIsCopying(true);
    try {
      const { createProposal, getProposalById } = await import('@/services/proposal/api/crudOperations');
      const { data: fullProposal, error: fetchError } = await getProposalById(proposal.id);
      
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
        items: fullProposal.items?.map((item: any) => ({
          ...item,
          id: undefined
        })) || [],
      };

      const { data: newProposal, error } = await createProposal(copyData);
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      
      toast.success("Teklif farklı müşteri için kopyalandı!");
      
      setIsCustomerSelectDialogOpen(false);
      setSelectedCustomerId("");
      
      if (newProposal?.id) {
        navigate(`/proposal/${newProposal.id}`);
      }
    } catch (error) {
      console.error('Error copying proposal:', error);
      toast.error("Teklif kopyalanırken bir hata oluştu.");
    } finally {
      setIsCopying(false);
    }
  }, [proposal, selectedCustomerId, isCopying, queryClient, navigate]);

  return {
    isSaving,
    isDeleting,
    isCopying,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isCustomerSelectDialogOpen,
    setIsCustomerSelectDialogOpen,
    selectedCustomerId,
    setSelectedCustomerId,
    handleSaveChanges,
    handleStatusChange,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handlePdfPrint,
    handleSendEmail,
    handleConvertToOrder,
    handleConvertToInvoice,
    handleSendToCustomer,
    handleSendForApproval,
    handleConvertToDraft,
    handleAcceptProposal,
    handleRejectProposal,
    handleCreateRevision,
    handleCopySameCustomer,
    handleCopyDifferentCustomer,
    handleConfirmCopyDifferentCustomer
  };
};

