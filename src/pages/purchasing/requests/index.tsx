import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchaseRequests, usePurchaseRequestsInfiniteScroll } from "@/hooks/usePurchaseRequests";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PurchaseRequestsHeader from "@/components/purchasing/requests/PurchaseRequestsHeader";
import PurchaseRequestsFilterBar from "@/components/purchasing/requests/PurchaseRequestsFilterBar";
import PurchaseRequestsContent from "@/components/purchasing/requests/PurchaseRequestsContent";

const PurchaseRequestsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const pageSize = 20;

  // Debounced search - 300ms gecikme ile optimize edildi
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch departments data
  const { userData } = useCurrentUser();
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', userData.company_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id
  });

  // Use only infinite scroll hook for both stats and list - debounced search kullanılıyor
  const {
    data: requests,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = usePurchaseRequestsInfiniteScroll(
    {
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: debouncedSearchQuery, // Debounced search kullanılıyor
      priority: selectedPriority !== 'all' ? selectedPriority : undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      dateRange: { from: startDate || null, to: endDate || null }
    },
    pageSize
  );

  // Durum değişikliği sonrası sayfayı yenile - useCallback ile optimize edildi
  const handleRequestStatusChange = useCallback(() => {
    refresh();
  }, [refresh]);

  if (error) {
    toast.error("Talepler yüklenirken bir hata oluştu");
    console.error("Error loading requests:", error);
  }

  // Request tıklama handler'ı - useCallback ile optimize edildi
  const handleRequestClick = useCallback((request: any) => {
    navigate(`/purchase-requests/${request.id}`);
  }, [navigate]);

  // Group requests by status for header stats - optimize edildi (tek geçişte gruplama)
  const groupedRequests = useMemo<{ [key: string]: any[] }>(() => {
    if (!requests || requests.length === 0) {
      return { draft: [], submitted: [], approved: [], rejected: [], converted: [] };
    }
    
    return requests.reduce<{ [key: string]: any[] }>((acc, r: any) => {
      const status = r.status as string;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(r);
      return acc;
    }, {
      draft: [],
      submitted: [],
      approved: [],
      rejected: [],
      converted: [],
    });
  }, [requests]);

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <PurchaseRequestsHeader requests={groupedRequests} />

        {/* Filters */}
        <PurchaseRequestsFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          departments={departments}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Talepler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Talepler yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <PurchaseRequestsContent
            requests={(requests as any[]) || []}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount}
            error={error}
            onRequestSelect={handleRequestClick}
            onStatusChange={handleRequestStatusChange}
            searchQuery={searchQuery}
            statusFilter={selectedStatus}
            priorityFilter={selectedPriority}
          />
        )}
      </div>
    </>
  );
};

export default React.memo(PurchaseRequestsList);
