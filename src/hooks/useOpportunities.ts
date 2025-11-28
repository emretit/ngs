
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Opportunity, OpportunityStatus, OpportunitiesState } from "@/types/crm";
import { DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/components/ui/use-toast";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useCurrentUser } from "./useCurrentUser";

interface UseOpportunitiesFilters {
  search?: string;
  status?: OpportunityStatus | "all";
  priority?: string | null;
  employeeId?: string | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useOpportunities = (filters: UseOpportunitiesFilters = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Infinite scroll için query fonksiyonu
  const fetchOpportunities = async (page: number, pageSize: number) => {
    // Company_id kontrolü - güvenlik için
    if (!userData?.company_id) {
      console.warn('No company_id found for user');
      return {
        data: [],
        totalCount: 0,
        hasNextPage: false
      };
    }

    let query = supabase
      .from("opportunities")
      .select(`
        *,
        customer:customer_id (*),
        employee:employee_id (*)
      `, { count: 'exact' })
      .eq("company_id", userData.company_id); // Company_id filtresi eklendi

    // Apply filters
    // Note: customer.name cannot be used in or() filter as it's a joined table field
    // We'll filter by title and description in the query, and customer.name will be filtered client-side
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters.employeeId) {
      query = query.eq("employee_id", filters.employeeId);
    }

    // Tarih filtreleri
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString());
    }

    if (filters.endDate) {
      // Bitiş tarihini günün sonuna kadar genişlet
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Apply sorting - veritabanı seviyesinde sıralama
    const sortField = filters.sortField || 'created_at';
    const sortDirection = filters.sortDirection || 'desc';
    const ascending = sortDirection === 'asc';
    
    query = query.range(from, to).order(sortField, { ascending });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }

    // Transform the data to match our Opportunity type
    const transformedData = data.map((item: any) => {
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
        currency: item.currency,
        opportunity_type: item.opportunity_type,
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

    return {
      data: transformedData,
      totalCount: count || 0,
      hasNextPage: transformedData.length === pageSize
    };
  };

  // Infinite scroll hook
  const {
    data: opportunitiesData,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount
  } = useInfiniteScroll(
    ["opportunities", userData?.company_id, JSON.stringify(filters)],
    fetchOpportunities,
    {
      pageSize: 20, // Her 20 fırsatta bir yükle
      enabled: !!userData?.company_id, // Company_id yüklenene kadar bekle
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika
    }
  );

  // Group opportunities by status (dynamic grouping)
  const opportunities: { [key: string]: Opportunity[] } = {};

  if (opportunitiesData) {
    opportunitiesData.forEach((opportunity: Opportunity) => {
      const status = opportunity.status || 'new';
      if (!opportunities[status]) {
        opportunities[status] = [];
      }
      opportunities[status].push(opportunity);
    });
  }

  // Ensure default columns exist even if empty (6-stage system)
  const defaultStatuses = ['new', 'meeting_visit', 'proposal', 'negotiation', 'won', 'lost'];
  defaultStatuses.forEach(status => {
    if (!opportunities[status]) {
      opportunities[status] = [];
    }
  });

  // Handle drag and drop updates
  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OpportunityStatus }) => {
      if (!userData?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }
      
      const { error } = await supabase
        .from("opportunities")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", userData.company_id); // Company_id kontrolü eklendi

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

  // Function for updating opportunity status (for custom columns)
  const handleUpdateOpportunityStatus = async (id: string, status: string) => {
    try {
      if (!userData?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }
      
      const { error } = await supabase
        .from("opportunities")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", userData.company_id); // Company_id kontrolü eklendi
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      
      toast({
        title: "Durum güncellendi",
        description: `Fırsat durumu başarıyla güncellendi.`,
        className: "bg-green-50 border-green-200",
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating opportunity status:", error);
      toast({
        title: "Hata",
        description: "Fırsat durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle other opportunity updates
  const handleUpdateOpportunity = async (
    opportunity: Partial<Opportunity> & { id: string }
  ) => {
    try {
      if (!userData?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }
      
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
        .eq("id", opportunity.id)
        .eq("company_id", userData.company_id); // Company_id kontrolü eklendi
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
    opportunitiesData, // Tüm fırsatlar (infinite scroll için)
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    refresh,
    totalCount,
    error,
    handleDragEnd,
    handleUpdateOpportunity,
    handleUpdateOpportunityStatus,
    selectedOpportunity,
    setSelectedOpportunity,
    isDetailOpen,
    setIsDetailOpen,
  };
};
