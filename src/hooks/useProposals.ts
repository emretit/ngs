
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "@/components/proposals/types";
import { useCurrentUser } from "./useCurrentUser";
import { parseProposalData } from "@/services/proposal/helpers/dataParser";
import { buildCompanyQuery, buildCompanyQueryWithOr, QueryFilter } from "@/utils/supabaseQueryBuilder";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

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
// Migrated to use new query builder and real-time subscription
export const useProposals = (filters?: ProposalFilters) => {
  const { userData, loading: userLoading } = useCurrentUser();
  
  // Build query filters
  const queryFilters: QueryFilter[] = [];
  
  if (filters?.status && filters.status !== 'all') {
    queryFilters.push({ field: 'status', operator: 'eq', value: filters.status });
  }
  
  if (filters?.employeeId && filters.employeeId !== 'all') {
    queryFilters.push({ field: 'employee_id', operator: 'eq', value: filters.employeeId });
  }
  
  if (filters?.dateRange?.from) {
    const fromDate = filters.dateRange.from instanceof Date 
      ? filters.dateRange.from
      : new Date(filters.dateRange.from);
    queryFilters.push({ field: 'created_at', operator: 'gte', value: fromDate.toISOString() });
  }
  
  if (filters?.dateRange?.to) {
    const toDate = filters.dateRange.to instanceof Date
      ? filters.dateRange.to
      : new Date(filters.dateRange.to);
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    queryFilters.push({ field: 'created_at', operator: 'lte', value: endOfDay.toISOString() });
  }
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposals", filters, userData?.company_id],
    queryFn: async () => {
      // Kullanıcının company_id'si yoksa hata fırlat
      if (!userData?.company_id) {
        throw new Error("Kullanıcının company_id'si bulunamadı");
      }

      // Build query with search (OR condition) or without
      let query;
      if (filters?.search) {
        query = buildCompanyQueryWithOr(
          'proposals',
          userData.company_id,
          `title.ilike.%${filters.search}%,number.ilike.%${filters.search}%`,
          {
            select: `
              *,
              customer:customer_id (*),
              employee:employee_id (*)
            `,
            filters: queryFilters,
            orderBy: {
              column: 'offer_date',
              ascending: false,
              nullsFirst: false,
            },
          }
        );
      } else {
        query = buildCompanyQuery(
          'proposals',
          userData.company_id,
          {
            select: `
              *,
              customer:customer_id (*),
              employee:employee_id (*)
            `,
            filters: queryFilters,
            orderBy: {
              column: 'offer_date',
              ascending: false,
              nullsFirst: false,
            },
          }
        );
      }
      
      const { data, error } = await query;

      if (error) {
        logger.error("Error fetching proposals:", error);
        throw error;
      }

      // Map the database fields to match our Proposal type
      const mappedData = (data || []).map(mapProposalData);

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

  // Real-time subscription using new hook
  useRealtimeSubscription({
    table: 'proposals',
    companyId: userData?.company_id,
    queryKeys: [["proposals"], ["proposals-list"]],
  });

  return { 
    data, 
    isLoading: isLoading || userLoading, // User loading durumunu da dahil et
    error 
  };
};

// Normal query hook for proposals - son 1 aylık filtre olduğu için infinite scroll gerek yok
// Migrated to use new query builder and real-time subscription
export const useProposalsInfiniteScroll = (filters?: ProposalFilters) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  
  // Build query filters
  const queryFilters: QueryFilter[] = [];
  
  if (filters?.status && filters.status !== 'all') {
    queryFilters.push({ field: 'status', operator: 'eq', value: filters.status });
  }
  
  if (filters?.employeeId && filters.employeeId !== 'all') {
    queryFilters.push({ field: 'employee_id', operator: 'eq', value: filters.employeeId });
  }
  
  if (filters?.dateRange?.from) {
    const fromDate = filters.dateRange.from instanceof Date 
      ? filters.dateRange.from
      : new Date(filters.dateRange.from);
    queryFilters.push({ field: 'created_at', operator: 'gte', value: fromDate.toISOString() });
  }
  
  if (filters?.dateRange?.to) {
    const toDate = filters.dateRange.to instanceof Date
      ? filters.dateRange.to
      : new Date(filters.dateRange.to);
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    queryFilters.push({ field: 'created_at', operator: 'lte', value: endOfDay.toISOString() });
  }

  // Determine sort field and direction
  const sortField = filters?.sortField || 'offer_date';
  const sortDirection = filters?.sortDirection || 'desc';
  const ascending = sortDirection === 'asc';
  const dbSortableFields = ['number', 'status', 'total_amount', 'offer_date', 'valid_until', 'created_at', 'updated_at', 'employee_id', 'customer_id'];
  const finalSortField = dbSortableFields.includes(sortField) ? sortField : 'offer_date';
  const finalSortDirection = dbSortableFields.includes(sortField) ? ascending : false;
  
  const {
    data: proposals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposals-list", JSON.stringify(filters), userData?.company_id],
    queryFn: async () => {
      // Kullanıcının company_id'si yoksa boş sonuç döndür
      if (!userData?.company_id) {
        logger.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
        return [];
      }

      // Build query with search (OR condition) or without
      let query;
      if (filters?.search) {
        query = buildCompanyQueryWithOr(
          'proposals',
          userData.company_id,
          `title.ilike.%${filters.search}%,number.ilike.%${filters.search}%`,
          {
            select: `
              *,
              customer:customer_id (*),
              employee:employee_id (*)
            `,
            filters: queryFilters,
            orderBy: {
              column: finalSortField,
              ascending: finalSortDirection,
              nullsFirst: false,
            },
            count: 'exact',
          }
        );
      } else {
        query = buildCompanyQuery(
          'proposals',
          userData.company_id,
          {
            select: `
              *,
              customer:customer_id (*),
              employee:employee_id (*)
            `,
            filters: queryFilters,
            orderBy: {
              column: finalSortField,
              ascending: finalSortDirection,
              nullsFirst: false,
            },
            count: 'exact',
          }
        );
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        logger.error("Error fetching proposals:", queryError);
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

  // Real-time subscription using new hook
  useRealtimeSubscription({
    table: 'proposals',
    companyId: userData?.company_id,
    queryKeys: [["proposals-list"], ["proposals"]],
  });

  return {
    data: proposals,
    isLoading: isLoading || userLoading,
    error: error || userError,
    totalCount: proposals.length,
  };
};
