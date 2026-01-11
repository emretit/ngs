import { useState } from "react";
import { logger } from '@/utils/logger';
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
  WorkOrderPriority,
} from "@/types/production";

// Veritabanı status değerlerini frontend status değerlerine map et
const mapStatusToFrontend = (dbStatus: string): WorkOrderStatus => {
  const statusMap: Record<string, WorkOrderStatus> = {
    'assigned': 'draft',
    'enroute': 'planned',
    'in_progress': 'in_progress',
    'on_hold': 'planned',
    'parts_pending': 'planned',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  return statusMap[dbStatus] || 'draft';
};

// Veritabanı priority değerlerini frontend priority değerlerine map et
const mapPriorityToFrontend = (dbPriority: string): WorkOrderPriority => {
  const priorityMap: Record<string, WorkOrderPriority> = {
    'low': 'low',
    'normal': 'medium',
    'high': 'high',
    'urgent': 'high'
  };
  return priorityMap[dbPriority] || 'medium';
};

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
      // Frontend status değerlerini veritabanı değerlerine map et
      const statusMap: Record<string, string> = {
        'draft': 'assigned',
        'planned': 'assigned',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };
      const dbStatus = statusMap[filters.status] || filters.status;
      query = query.eq("status", dbStatus);
    }

    if (filters.search) {
      // code field'ını da arama kapsamına al
      query = query.or(`title.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    if (filters.dateRange?.from) {
      query = query.gte("scheduled_start", filters.dateRange.from.toISOString());
    }

    if (filters.dateRange?.to) {
      query = query.lte("scheduled_start", filters.dateRange.to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching work orders:", error);
      toast.error("İş emirleri yüklenirken hata oluştu");
      return [];
    }

    // Veritabanı formatını frontend formatına map et
    return (data || []).map((wo: any, index: number) => {
      // code'dan order_number çıkar (WO-20251210175108 -> 20251210175108)
      let orderNumber = 0;
      if (wo.code) {
        const numbers = wo.code.replace(/\D/g, '');
        orderNumber = numbers ? parseInt(numbers.slice(-8)) || (index + 1) : (index + 1);
      } else {
        orderNumber = index + 1;
      }

      return {
        ...wo,
        order_number: orderNumber,
        quantity: wo.quantity || 1, // Varsayılan quantity
        status: mapStatusToFrontend(wo.status),
        priority: mapPriorityToFrontend(wo.priority),
        planned_start_date: wo.scheduled_start,
        planned_end_date: wo.scheduled_end,
        actual_start_date: wo.actual_start,
        actual_end_date: wo.actual_end,
        bom_name: wo.bom?.name || wo.bom_name, // BOM name'i map et
      } as WorkOrder;
    });
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
      logger.error("Error fetching BOMs:", error);
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

    // Frontend formatını veritabanı formatına map et
    const insertData: any = {
      company_id: profile.company_id,
      title: workOrderData.title,
      description: workOrderData.description || null,
      bom_id: workOrderData.bom_id || null,
      assigned_to: workOrderData.assigned_to || user.id,
    };

    // Status mapping (frontend -> database)
    const statusMap: Record<string, string> = {
      'draft': 'assigned',
      'planned': 'assigned',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    insertData.status = statusMap[workOrderData.status || 'draft'] || 'assigned';

    // Priority mapping (frontend -> database)
    const priorityMap: Record<string, string> = {
      'low': 'low',
      'medium': 'normal',
      'high': 'high'
    };
    insertData.priority = priorityMap[workOrderData.priority || 'medium'] || 'normal';

    // Tarih mapping
    if (workOrderData.planned_start_date) {
      insertData.scheduled_start = workOrderData.planned_start_date;
    }
    if (workOrderData.planned_end_date) {
      insertData.scheduled_end = workOrderData.planned_end_date;
    }

    // Code oluştur
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').slice(0, 14);
    insertData.code = `WO-${timestamp}`;

    const { data, error } = await supabase
      .from("work_orders")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error("Error creating work order:", error);
      throw error;
    }

    // Veritabanı formatını frontend formatına map et
    const mappedData = {
      ...data,
      order_number: parseInt(data.code?.replace(/\D/g, '').slice(-8) || '0') || 1,
      quantity: workOrderData.quantity || 1,
      status: mapStatusToFrontend(data.status),
      priority: mapPriorityToFrontend(data.priority),
      planned_start_date: data.scheduled_start,
      planned_end_date: data.scheduled_end,
      actual_start_date: data.actual_start,
      actual_end_date: data.actual_end,
    };

    // toast.success("İş emri başarıyla oluşturuldu"); // Component içinde gösteriliyor
    return mappedData as WorkOrder;
  };

  const updateWorkOrder = async ({ id, data }: { id: string; data: Partial<WorkOrder> }) => {
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

    // Frontend formatını veritabanı formatına map et
    const updateData: any = { ...data };
    
    // Status mapping (frontend -> database)
    if (updateData.status) {
      const statusMap: Record<string, string> = {
        'draft': 'assigned',
        'planned': 'assigned',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };
      updateData.status = statusMap[updateData.status] || updateData.status;
    }

    // Priority mapping (frontend -> database)
    if (updateData.priority) {
      const priorityMap: Record<string, string> = {
        'low': 'low',
        'medium': 'normal',
        'high': 'high'
      };
      updateData.priority = priorityMap[updateData.priority] || updateData.priority;
    }

    // Tarih field mapping
    if (updateData.planned_start_date) {
      updateData.scheduled_start = updateData.planned_start_date;
      delete updateData.planned_start_date;
    }
    if (updateData.planned_end_date) {
      updateData.scheduled_end = updateData.planned_end_date;
      delete updateData.planned_end_date;
    }
    if (updateData.actual_start_date) {
      updateData.actual_start = updateData.actual_start_date;
      delete updateData.actual_start_date;
    }
    if (updateData.actual_end_date) {
      updateData.actual_end = updateData.actual_end_date;
      delete updateData.actual_end_date;
    }

    // order_number ve quantity gibi frontend-only field'ları kaldır
    delete updateData.order_number;
    delete updateData.quantity;
    delete updateData.bom_name;

    // Company ID filtresi ile güncelleme yap
    const { error } = await supabase
      .from("work_orders")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", profile.company_id); // Company ID filtresi eklendi

    if (error) {
      logger.error("Error updating work order:", error);
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
      logger.error("Error creating BOM:", bomError);
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
        logger.error("Error creating BOM items:", itemsError);
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
