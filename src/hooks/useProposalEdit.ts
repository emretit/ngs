
import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { mockCrmService } from "@/services/mockCrm";
import { crmService } from "@/services/crmService";
import { Proposal } from "@/types/proposal";

export const useProposalEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProposal = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await mockCrmService.getProposalById(id);
      
      if (error) {
        toast.error("Teklif bilgileri yüklenemedi");
        throw error;
      }
      
      if (data) {
        setProposal(data);
      }
    } catch (error) {
      logger.error("Error fetching proposal:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const handleBack = () => {
    navigate("/proposals");
  };

  const handleSave = async (formData: any) => {
    if (!proposal || !id) return;
    
    try {
      setSaving(true);
      
      // Use the formData directly if it's already prepared (from ProposalEdit.tsx)
      // Otherwise, build updatedProposal from formData fields
      const updatedProposal = {
        ...proposal,
        // Use formData values directly if they exist, otherwise use proposal values
        title: formData.title || proposal.title,
        subject: formData.subject !== undefined ? formData.subject : (proposal as any).subject,
        description: formData.description || proposal.description,
        offer_date: formData.offer_date !== undefined ? formData.offer_date : proposal.offer_date, // Teklif tarihi - valid_until ile aynı şekilde (null değerleri de kabul et)
        valid_until: formData.valid_until !== undefined ? formData.valid_until : proposal.valid_until,
        terms: formData.terms || formData.payment_terms || proposal.terms,
        notes: formData.notes || proposal.notes,
        status: formData.status || proposal.status,
        currency: formData.currency || proposal.currency,
        exchange_rate: formData.exchange_rate !== undefined ? formData.exchange_rate : (proposal as any).exchange_rate,
        items: formData.items || proposal.items,
        customer_id: formData.customer_id || proposal.customer_id,
        employee_id: formData.employee_id || proposal.employee_id,
        contact_name: formData.contact_name !== undefined ? formData.contact_name : (proposal as any).contact_name || "",
        // Financial totals for PDF generation
        subtotal: formData.subtotal !== undefined ? formData.subtotal : proposal.subtotal,
        total_discount: formData.total_discount !== undefined ? formData.total_discount : proposal.total_discount,
        total_tax: formData.total_tax !== undefined ? formData.total_tax : proposal.total_tax,
        total_amount: formData.total_amount !== undefined ? formData.total_amount : proposal.total_amount,
        // Şartlar ve koşullar kaydet
        payment_terms: formData.payment_terms || proposal.payment_terms,
        delivery_terms: formData.delivery_terms || proposal.delivery_terms,
        warranty_terms: formData.warranty_terms || proposal.warranty_terms,
        price_terms: formData.price_terms || proposal.price_terms,
        other_terms: formData.other_terms || proposal.other_terms,
        updated_at: new Date().toISOString()
      };
      
      // Call the update API
      await crmService.updateProposal(id, updatedProposal);
      
      // Invalidate all proposal queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      // Hemen refetch yap - tablo otomatik yenilensin
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      
      toast.success("Teklif başarıyla güncellendi");
      
      // Teklifi tekrar fetch et - sayfayı güncel verilerle yenile
      await fetchProposal();
    } catch (error) {
      logger.error("Error saving proposal:", error);
      toast.error("Teklif güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return {
    proposal,
    loading,
    saving,
    handleBack,
    handleSave,
    refetchProposal: fetchProposal
  };
};
