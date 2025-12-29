
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "@/components/proposals/types";
import { useCurrentUser } from "./useCurrentUser";
import { parseProposalData } from "@/services/proposal/helpers/dataParser";

// Helper function to map database results to Proposal type
const mapProposalData = (item: any): Proposal => {
  // Use parseProposalData to handle JSON parsing
  const parsedData = parseProposalData(item);
  if (!parsedData) {
    throw new Error("Failed to parse proposal data");
  }
  
  return {
    ...parsedData,
    // Include relations
    customer: item.customer,
    employee: item.employee,
    customer_name: item.customer?.name,
    employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : undefined
  };
};

// Original useProposals hook for backward compatibility
export const useProposals = (filters?: ProposalFilters) => {
  const { userData, loading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposals", filters, userData?.company_id],
    queryFn: async () => {
      // Kullanıcının company_id'si yoksa hata fırlat
      if (!userData?.company_id) {
        throw new Error("Kullanıcının company_id'si bulunamadı");
      }

      let query = supabase
        .from('proposals')
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .eq('company_id', userData.company_id) // Kullanıcının company_id'sini kullan
        .order('offer_date', { ascending: false, nullsFirst: false });
      
      // Apply status filter if specified
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      // Apply search filter if specified
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,number.ilike.%${filters.search}%`);
      }
      
      // Apply employee filter if specified
      if (filters?.employeeId && filters.employeeId !== 'all') {
        query = query.eq('employee_id', filters.employeeId);
      }
      
      // Apply date range filter if specified - created_at kullan (teklifin oluşturulma tarihine göre filtrele)
      // offer_date gelecekte olabilir, bu yüzden created_at kullanıyoruz
      if (filters?.dateRange?.from) {
        const fromDate = filters.dateRange.from instanceof Date 
          ? filters.dateRange.from
          : new Date(filters.dateRange.from);
        const fromDateISO = fromDate.toISOString();
        query = query.gte('created_at', fromDateISO);
      }
      
      if (filters?.dateRange?.to) {
        const toDate = filters.dateRange.to instanceof Date
          ? filters.dateRange.to
          : new Date(filters.dateRange.to);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }
      
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching proposals:", error);
        throw error;
      }

      // Map the database fields to match our Proposal type
      const mappedData = data.map(mapProposalData);

      // Sadece en son revizyonları göster
      // Her proposal grubu için (parent_proposal_id veya kendi id'si) en yüksek revision_number'a sahip olanı seç
      const latestRevisions = new Map<string, Proposal>();

      mappedData.forEach(proposal => {
        // Proposal'ın ait olduğu grup ID'si (parent varsa parent, yoksa kendi ID'si)
        const groupId = (proposal as any).parent_proposal_id || proposal.id;
        const revisionNumber = (proposal as any).revision_number || 0;

        // Bu gruptaki mevcut en son revizyon
        const existing = latestRevisions.get(groupId);

        if (!existing || revisionNumber > ((existing as any).revision_number || 0)) {
          latestRevisions.set(groupId, proposal);
        }
      });

      return Array.from(latestRevisions.values());
    },
    enabled: !!userData?.company_id, // Sadece company_id varsa query'yi çalıştır
  });

  // Realtime subscription - proposals tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('proposals-kanban-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'proposals',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Proposals tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  return { 
    data, 
    isLoading: isLoading || userLoading, // User loading durumunu da dahil et
    error 
  };
};

// Normal query hook for proposals - son 1 aylık filtre olduğu için infinite scroll gerek yok
export const useProposalsInfiniteScroll = (filters?: ProposalFilters) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const {
    data: proposals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposals-list", JSON.stringify(filters), userData?.company_id],
    queryFn: async () => {
      // Kullanıcının company_id'si yoksa boş sonuç döndür
      if (!userData?.company_id) {
        console.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
        return [];
      }

      let query = supabase
        .from('proposals')
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `, { count: 'exact' })
        .eq('company_id', userData.company_id);
      
      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,number.ilike.%${filters.search}%`);
      }
      
      if (filters?.employeeId && filters.employeeId !== 'all') {
        query = query.eq('employee_id', filters.employeeId);
      }
      
      // Tarih filtreleri - created_at kullan (teklifin oluşturulma tarihine göre filtrele)
      // offer_date gelecekte olabilir, bu yüzden created_at kullanıyoruz
      if (filters?.dateRange?.from) {
        const fromDate = filters.dateRange.from instanceof Date 
          ? filters.dateRange.from
          : new Date(filters.dateRange.from);
        const fromDateISO = fromDate.toISOString();
        query = query.gte('created_at', fromDateISO);
      }
      
      if (filters?.dateRange?.to) {
        const toDate = filters.dateRange.to instanceof Date
          ? filters.dateRange.to
          : new Date(filters.dateRange.to);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      // Apply sorting - veritabanı seviyesinde sıralama
      // Not: employee_name ve customer_name gibi join edilen alanlar için
      // veritabanı seviyesinde sıralama yapılamaz, client-side sıralama yapılmalı
      const sortField = filters?.sortField || 'offer_date';
      const sortDirection = filters?.sortDirection || 'desc';
      const ascending = sortDirection === 'asc';

      // Sadece veritabanı kolonları için sıralama yap
      // employee_name ve customer_name gibi join edilen alanlar için sıralama yapma
      const dbSortableFields = ['number', 'status', 'total_amount', 'offer_date', 'valid_until', 'created_at', 'updated_at', 'employee_id', 'customer_id'];
      
      let finalQuery = query;
      if (dbSortableFields.includes(sortField)) {
        finalQuery = query.order(sortField, { ascending, nullsFirst: false });
      } else {
        // Varsayılan sıralama (offer_date)
        finalQuery = query.order('offer_date', { ascending: false, nullsFirst: false });
      }

      const { data, error: queryError } = await finalQuery;

      if (queryError) {
        console.error("Error fetching proposals:", queryError);
        throw queryError;
      }

      if (!data) return [];

      // Map the database fields to match our Proposal type
      const mappedData = data.map(mapProposalData);

      // Sadece en son revizyonları göster
      // Her proposal grubu için (parent_proposal_id veya kendi id'si) en yüksek revision_number'a sahip olanı seç
      const latestRevisions = new Map<string, Proposal>();

      mappedData.forEach(proposal => {
        // Proposal'ın ait olduğu grup ID'si (parent varsa parent, yoksa kendi ID'si)
        const groupId = (proposal as any).parent_proposal_id || proposal.id;
        const revisionNumber = (proposal as any).revision_number || 0;

        // Bu gruptaki mevcut en son revizyon
        const existing = latestRevisions.get(groupId);

        if (!existing || revisionNumber > ((existing as any).revision_number || 0)) {
          latestRevisions.set(groupId, proposal);
        }
      });

      return Array.from(latestRevisions.values());
    },
    enabled: !!userData?.company_id,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Realtime subscription - proposals tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('proposals-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'proposals',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Proposals tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  return {
    data: proposals,
    isLoading: isLoading || userLoading,
    error: error || userError,
    totalCount: proposals.length,
  };
};
