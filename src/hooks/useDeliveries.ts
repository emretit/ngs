import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Delivery,
  DeliveryItem,
  DeliveryStatus,
  CreateDeliveryData,
  UpdateDeliveryData,
  DeliveryFilters,
  DeliveryStats,
} from "@/types/deliveries";

export const useDeliveries = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DeliveryFilters>({
    status: "all",
    customer_id: "all",
    shipping_method: "all",
    search: "",
    dateRange: { from: null, to: null },
    page: 1,
    pageSize: 20,
  });

  const fetchDeliveries = async (): Promise<Delivery[]> => {
    // Get current user's company_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    let query = supabase
      .from("deliveries")
      .select(`
        *,
        customer:customers(id, name, company, email, mobile_phone, office_phone, address),
        order:orders(id, order_number, title, status),
        sales_invoice:sales_invoices(id, fatura_no, document_type),
        employee:employees(id, first_name, last_name, email),
        delivered_by_employee:employees!deliveries_delivered_by_fkey(id, first_name, last_name),
        items:delivery_items(*)
      `)
      .eq("company_id", profile?.company_id)
      .order("created_at", { ascending: false });

    // Status filtresi
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Customer filtresi
    if (filters.customer_id && filters.customer_id !== "all") {
      query = query.eq("customer_id", filters.customer_id);
    }

    // Shipping method filtresi
    if (
      filters.shipping_method &&
      filters.shipping_method !== "all"
    ) {
      query = query.eq("shipping_method", filters.shipping_method);
    }

    // Arama filtresi
    if (filters.search) {
      query = query.or(
        `delivery_number.ilike.%${filters.search}%,customer.name.ilike.%${filters.search}%,customer.company.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%`
      );
    }

    // Tarih aralığı filtresi
    if (filters.dateRange?.from) {
      query = query.gte(
        "planned_delivery_date",
        filters.dateRange.from.toISOString().split("T")[0]
      );
    }
    if (filters.dateRange?.to) {
      query = query.lte(
        "planned_delivery_date",
        filters.dateRange.to.toISOString().split("T")[0]
      );
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Teslimatlar yüklenirken hata oluştu");
      throw error;
    }

    return (data as unknown as Delivery[]) || [];
  };

  const fetchDeliveryById = async (id: string): Promise<Delivery> => {
    const { data, error } = await supabase
      .from("deliveries")
      .select(`
        *,
        customer:customers(id, name, company, email, mobile_phone, office_phone, address),
        order:orders(id, order_number, title, status),
        sales_invoice:sales_invoices(id, fatura_no, document_type),
        employee:employees(id, first_name, last_name, email),
        delivered_by_employee:employees!deliveries_delivered_by_fkey(id, first_name, last_name),
        items:delivery_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Teslimat yüklenirken hata oluştu");
      throw error;
    }

    return data as unknown as Delivery;
  };

  const fetchDeliveryItems = async (
    deliveryId: string
  ): Promise<DeliveryItem[]> => {
    const { data, error } = await supabase
      .from("delivery_items")
      .select(`
        *,
        product:products(name, sku)
      `)
      .eq("delivery_id", deliveryId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Teslimat kalemleri yüklenirken hata oluştu");
      throw error;
    }

    return (data as unknown as DeliveryItem[]) || [];
  };

  const createDelivery = async (deliveryData: CreateDeliveryData) => {
    // Get current user's company_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    // Generate delivery number
    const { count } = await supabase
      .from("deliveries")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile?.company_id);

    const deliveryNumber = `TES-${String((count || 0) + 1).padStart(6, "0")}`;

    // Extract items from deliveryData
    const { items, ...deliveryWithoutItems } = deliveryData;

    // Add company_id and delivery_number to delivery data
    const deliveryWithCompany = {
      ...deliveryWithoutItems,
      company_id: profile?.company_id,
      delivery_number: deliveryNumber,
      created_by: user?.id,
    };

    // First create the delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert([deliveryWithCompany])
      .select()
      .single();

    if (deliveryError) {
      toast.error("Teslimat oluşturulurken hata oluştu");
      throw deliveryError;
    }

    // Then create the delivery items
    if (items && items.length > 0) {
      const itemsWithDeliveryId = items.map((item) => ({
        ...item,
        delivery_id: (delivery as any).id,
      }));

      const { error: itemsError } = await supabase
        .from("delivery_items")
        .insert(itemsWithDeliveryId);

      if (itemsError) {
        toast.error("Teslimat kalemleri oluşturulurken hata oluştu");
        throw itemsError;
      }
    }

    toast.success("Teslimat başarıyla oluşturuldu");
    return delivery;
  };

  const updateDelivery = async ({
    id,
    data,
  }: {
    id: string;
    data: UpdateDeliveryData;
  }) => {
    const { error } = await supabase
      .from("deliveries")
      .update(data)
      .eq("id", id);

    if (error) {
      toast.error("Teslimat güncellenirken hata oluştu");
      throw error;
    }

    toast.success("Teslimat başarıyla güncellendi");
    return { id };
  };

  const updateDeliveryStatus = async ({
    id,
    status,
  }: {
    id: string;
    status: DeliveryStatus;
  }) => {
    const updateData: UpdateDeliveryData = {
      status,
    };

    // Eğer teslim edildi ise, gerçekleşen tarihi set et
    if (status === "delivered") {
      updateData.actual_delivery_date = new Date().toISOString().split("T")[0];
    }

    return updateDelivery({ id, data: updateData });
  };

  const deleteDelivery = async (id: string) => {
    const { error } = await supabase.from("deliveries").delete().eq("id", id);

    if (error) {
      toast.error("Teslimat silinirken hata oluştu");
      throw error;
    }

    toast.success("Teslimat başarıyla silindi");
  };

  const fetchDeliveryStats = async (): Promise<DeliveryStats> => {
    // Get current user's company_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    const { data, error } = await supabase
      .from("deliveries")
      .select("status")
      .eq("company_id", profile?.company_id);

    if (error) {
      throw error;
    }

    const stats: DeliveryStats = {
      total: data?.length || 0,
      pending: data?.filter((d) => d.status === "pending").length || 0,
      prepared: data?.filter((d) => d.status === "prepared").length || 0,
      shipped: data?.filter((d) => d.status === "shipped").length || 0,
      delivered: data?.filter((d) => d.status === "delivered").length || 0,
      cancelled: data?.filter((d) => d.status === "cancelled").length || 0,
    };

    return stats;
  };

  // React Query hooks
  const deliveriesQuery = useQuery({
    queryKey: ["deliveries", filters],
    queryFn: fetchDeliveries,
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
  });

  // Real-time subscription - deliveries tablosundaki değişiklikleri dinle
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Subscribe to deliveries table changes
      const channel = supabase
        .channel('deliveries_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'deliveries',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            console.log('🔄 Delivery changed:', payload.eventType, payload.new || payload.old);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['delivery'] });
            queryClient.invalidateQueries({ queryKey: ['delivery-stats'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);

  const deliveryQuery = (id: string) =>
    useQuery({
      queryKey: ["delivery", id],
      queryFn: () => fetchDeliveryById(id),
      enabled: !!id,
    });

  const deliveryItemsQuery = (deliveryId: string) =>
    useQuery({
      queryKey: ["delivery-items", deliveryId],
      queryFn: () => fetchDeliveryItems(deliveryId),
      enabled: !!deliveryId,
    });

  const statsQuery = useQuery({
    queryKey: ["delivery-stats"],
    queryFn: fetchDeliveryStats,
  });

  const createMutation = useMutation({
    mutationFn: createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateDeliveryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
    },
  });

  return {
    deliveries: deliveriesQuery.data || [],
    isLoading: deliveriesQuery.isLoading,
    error: deliveriesQuery.error,
    filters,
    setFilters,
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    createDelivery: createMutation.mutateAsync,
    updateDelivery: updateMutation.mutateAsync,
    updateDeliveryStatus: updateStatusMutation.mutateAsync,
    deleteDelivery: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    fetchDeliveryById,
    fetchDeliveryItems,
    deliveryQuery,
    deliveryItemsQuery,
  };
};
