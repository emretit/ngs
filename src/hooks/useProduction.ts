import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  WorkOrder,
  BOM,
  WorkOrderStatus,
  CreateWorkOrderData,
  CreateBOMData,
  WorkOrderFilters,
  ProductionStats,
} from "@/types/production";

export const useProduction = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<WorkOrderFilters>({
    status: "all",
    search: "",
    dateRange: { from: null, to: null },
    page: 1,
    pageSize: 20,
  });

  const fetchWorkOrders = async (): Promise<WorkOrder[]> => {
    // Get current user's company_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    // TODO: work_orders tablosu oluşturulduğunda bu sorguyu güncelle
    // Şimdilik boş array döndürüyoruz
    return [];
  };

  const fetchBOMs = async (): Promise<BOM[]> => {
    // TODO: boms tablosu oluşturulduğunda bu sorguyu güncelle
    return [];
  };

  const createWorkOrder = async (workOrderData: CreateWorkOrderData) => {
    // TODO: Implement when table is ready
    toast.success("İş emri oluşturuldu");
    return {} as WorkOrder;
  };

  const createBOM = async (bomData: CreateBOMData) => {
    // TODO: Implement when table is ready
    toast.success("BOM oluşturuldu");
    return {} as BOM;
  };

  const getStats = async (): Promise<ProductionStats> => {
    const workOrders = await fetchWorkOrders();
    
    return {
      active_work_orders: workOrders.filter(wo => wo.status === 'in_progress').length,
      completed_this_month: workOrders.filter(wo => 
        wo.status === 'completed' && 
        wo.actual_end_date && 
        new Date(wo.actual_end_date).getMonth() === new Date().getMonth()
      ).length,
      bom_count: (await fetchBOMs()).length,
      planned_this_week: workOrders.filter(wo => {
        if (!wo.planned_start_date) return false;
        const plannedDate = new Date(wo.planned_start_date);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return plannedDate >= weekStart && plannedDate <= weekEnd;
      }).length,
    };
  };

  // React Query hooks
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } = useQuery({
    queryKey: ["work_orders", filters],
    queryFn: fetchWorkOrders,
  });

  const { data: boms = [], isLoading: isLoadingBOMs } = useQuery({
    queryKey: ["boms"],
    queryFn: fetchBOMs,
  });

  const { data: stats } = useQuery({
    queryKey: ["production_stats"],
    queryFn: getStats,
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_orders"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
    },
  });

  const createBOMMutation = useMutation({
    mutationFn: createBOM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
    },
  });

  return {
    workOrders,
    boms,
    stats,
    isLoading: isLoadingWorkOrders || isLoadingBOMs,
    filters,
    setFilters,
    createWorkOrder: createWorkOrderMutation.mutateAsync,
    createBOM: createBOMMutation.mutateAsync,
    isCreating: createWorkOrderMutation.isPending || createBOMMutation.isPending,
  };
};

