
import { useState } from "react";
import { logger } from '@/utils/logger';
import { mockCrmService } from "@/services/mockCrm";
import { v4 as uuidv4 } from "uuid";
import { ProposalFormData } from "@/types/proposal-form";
import { calculateProposalTotals } from "@/services/workflow/proposalWorkflow";

export const useProposalCreation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createProposal = async (formData: ProposalFormData) => {
    try {
      setIsLoading(true);
      
      logger.debug("Creating proposal with data:", formData);
      
      // Calculate totals from items
      const totals = formData.items ? calculateProposalTotals(formData.items) : { total: 0 };
      
      // Prepare proposal data
      const proposal = {
        id: uuidv4(),
        number: `PRO-${Math.floor(10000 + Math.random() * 90000)}`, // Generate random number
        title: formData.title,
        subject: formData.subject, // Teklif konusu
        description: formData.description,
        customer_id: formData.customer_id,
        employee_id: formData.employee_id,
        opportunity_id: formData.opportunity_id,
        valid_until: formData.valid_until,
        payment_terms: formData.payment_terms,
        delivery_terms: formData.delivery_terms,
        warranty_terms: formData.warranty_terms, // Garanti şartları
        price_terms: formData.price_terms, // Fiyatlandırma koşulları
        other_terms: formData.other_terms, // Diğer şartlar
        terms: formData.terms, // Birleştirilmiş şartlar metni
        notes: formData.notes,
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_amount: formData.computed_total_amount || totals.total || 0,
        currency: formData.currency || "TRY",
        exchange_rate: formData.exchange_rate || 1, // Döviz kuru
        items: formData.items?.map(item => ({
          ...item,
          // Ensure currency is set for each item
          currency: item.currency || formData.currency || "TRY",
          // Preserve original currency info if available
          original_currency: item.original_currency || item.currency || formData.currency || "TRY",
          original_price: item.original_price !== undefined ? item.original_price : item.unit_price
        })) || [],
        internal_notes: formData.internalNotes,
      };
      
      // Save proposal
      const result = await mockCrmService.createProposal(proposal);
      
      return result;
    } catch (error) {
      logger.error("Error creating proposal:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProposal,
    isLoading,
  };
};
