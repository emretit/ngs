
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Opportunity, OpportunityStatus, OpportunitiesState } from "@/types/crm";
import { DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/components/ui/use-toast";

export const useOpportunities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch all opportunities
  const { data: opportunitiesData, isLoading, error } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching opportunities:", error);
        throw error;
      }

      // Transform the data to match our Opportunity type
      return data.map((item: any) => {
        // Parse contact_history from JSON if needed
        let contactHistory = [];
        try {
          if (item.contact_history) {
            contactHistory = typeof item.contact_history === 'string' 
              ? JSON.parse(item.contact_history) 
              : item.contact_history;
          }
        } catch (e) {
          console.error("Error parsing contact history:", e);
          contactHistory = [];
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          value: item.value,
          customer_id: item.customer_id,
          employee_id: item.employee_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          expected_close_date: item.expected_close_date,
          notes: item.notes,
          contact_history: contactHistory,
          customer: item.customer,
          employee: item.employee
        } as Opportunity;
      });
    }
  });

  // Group opportunities by status
  const opportunities: OpportunitiesState = {
    new: [],
    first_contact: [],
    site_visit: [],
    preparing_proposal: [],
    proposal_sent: [],
    accepted: [],
    lost: [],
  };

  if (opportunitiesData) {
    opportunitiesData.forEach((opportunity) => {
      if (opportunity.status in opportunities) {
        opportunities[opportunity.status as OpportunityStatus].push(opportunity);
      }
    });
  }

  // Handle drag and drop updates
  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OpportunityStatus }) => {
      const { error } = await supabase
        .from("opportunities")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast({
        title: "Fırsat güncellendi",
        description: "Fırsat durumu başarıyla güncellendi",
      });
    },
    onError: (error) => {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Hata",
        description: "Fırsat güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Drop outside valid area or same status
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    // Update opportunity status
    updateOpportunityMutation.mutate({
      id: draggableId,
      status: destination.droppableId as OpportunityStatus,
    });
  };

  // Handle other opportunity updates
  const handleUpdateOpportunity = async (
    opportunity: Partial<Opportunity> & { id: string }
  ) => {
    try {
      const updateData: any = { ...opportunity };
      delete updateData.customer;
      delete updateData.employee;
      
      // Handle contact_history as JSON
      if (updateData.contact_history) {
        updateData.contact_history = JSON.stringify(updateData.contact_history);
      }

      const { error } = await supabase
        .from("opportunities")
        .update(updateData)
        .eq("id", opportunity.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast({
        title: "Fırsat güncellendi",
        description: "Fırsat başarıyla güncellendi",
      });

      return true;
    } catch (error) {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Hata",
        description: "Fırsat güncellenirken bir hata oluştu",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    opportunities,
    isLoading,
    error,
    handleDragEnd,
    handleUpdateOpportunity,
    selectedOpportunity,
    setSelectedOpportunity,
    isDetailOpen,
    setIsDetailOpen,
  };
};
