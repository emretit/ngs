
import { useState } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProposalFormData } from "@/types/proposal-form";

export const useProposalDraft = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const saveDraft = async (data: Partial<ProposalFormData>) => {
    setIsLoading(true);
    
    try {
      const { data: newProposal, error } = await supabase
        .from('proposals')
        .insert({
          title: data.title || "Taslak Teklif",
          customer_id: data.customer_id,
          employee_id: data.employee_id,
          status: "draft",
          number: Math.floor(Math.random() * 1000000).toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Teklif taslağı kaydedildi");
      navigate("/proposals");
      return newProposal.id;
    } catch (error) {
      logger.error('Error saving draft:', error);
      toast.error("Taslak kaydedilirken bir hata oluştu");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    saveDraft
  };
};
