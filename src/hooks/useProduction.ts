import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  WorkOrder,
  BOM,
  CreateWorkOrderData,
  CreateBOMData,
  WorkOrderFilters,
  ProductionStats,
  WorkOrderStatus,
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    let query = supabase
      .from("work_orders")
      .select(`
        *,
        bom:boms(id, name, product_name)
      `)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,order_number.eq.${isNaN(Number(filters.search)) ? -1 : filters.search}`);
    }

    if (filters.dateRange?.from) {
      query = query.gte("planned_start_date", filters.dateRange.from.toISOString());
    }

    if (filters.dateRange?.to) {
      query = query.lte("planned_start_date", filters.dateRange.to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching work orders:", error);
      toast.error("İş emirleri yüklenirken hata oluştu");
      return [];
    }

    return data as WorkOrder[];
  };

  const fetchBOMs = async (): Promise<BOM[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data, error } = await supabase
      .from("boms")
      .select(`
        *,
        items:bom_items(*)
      `)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching BOMs:", error);
      toast.error("Reçeteler yüklenirken hata oluştu");
      return [];
    }

    return data as BOM[];
  };

  const createWorkOrder = async (workOrderData: CreateWorkOrderData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Firma bilgisi bulunamadı");

    const { data, error } = await supabase
      .from("work_orders")
      .insert({
        ...workOrderData,
        company_id: profile.company_id,
        status: workOrderData.status || 'draft',
        priority: workOrderData.priority || 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating work order:", error);
      throw error;
    }

    // toast.success("İş emri başarıyla oluşturuldu"); // Component içinde gösteriliyor
    return data as WorkOrder;
  };

  const updateWorkOrder = async ({ id, data }: { id: string; data: Partial<WorkOrder> }) => {
    const { error } = await supabase
      .from("work_orders")
      .update(data)
      .eq("id", id);

    if (error) {
      console.error("Error updating work order:", error);
      throw error;
    }
  };

  const createBOM = async (bomData: CreateBOMData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Firma bilgisi bulunamadı");

    const { data: bom, error: bomError } = await supabase
      .from("boms")
      .insert({
        name: bomData.name,
        description: bomData.description,
        product_id: bomData.product_id,
        product_name: bomData.product_name,
        company_id: profile.company_id
      })
      .select()
      .single();

    if (bomError) {
      console.error("Error creating BOM:", bomError);
      throw bomError;
    }

    if (bomData.items && bomData.items.length > 0) {
      const itemsToInsert = bomData.items.map(item => ({
        bom_id: bom.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit
      }));

      const { error: itemsError } = await supabase
        .from("bom_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error creating BOM items:", itemsError);
        await supabase.from("boms").delete().eq("id", bom.id);
        throw itemsError;
      }
    }

    toast.success("Reçete başarıyla oluşturuldu");
    return bom as BOM;
  };

  const getStats = async (): Promise<ProductionStats> => {
    const workOrders = await fetchWorkOrders();
    const boms = await fetchBOMs();
    
    return {
      active_work_orders: workOrders.filter(wo => wo.status === 'in_progress' || wo.status === 'planned').length,
      completed_this_month: workOrders.filter(wo => 
        wo.status === 'completed' && 
        wo.actual_end_date && 
        new Date(wo.actual_end_date).getMonth() === new Date().getMonth()
      ).length,
      bom_count: boms.length,
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

  const updateWorkOrderMutation = useMutation({
    mutationFn: updateWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_orders"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
      toast.success("İş emri güncellendi");
    },
    onError: (error) => {
      toast.error("Güncelleme sırasında hata oluştu");
    }
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
    updateWorkOrder: updateWorkOrderMutation.mutateAsync,
    createBOM: createBOMMutation.mutateAsync,
    isCreating: createWorkOrderMutation.isPending || createBOMMutation.isPending,
  };
};
