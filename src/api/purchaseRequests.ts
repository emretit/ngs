
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  PurchaseRequest, 
  PurchaseRequestItem, 
  PurchaseRequestFormData, 
  PurchaseRequestStatus 
} from "@/types/purchase";

export const fetchPurchaseRequests = async (filters: {
  status: string;
  search: string;
  dateRange: { from: Date | null, to: null | Date };
}): Promise<PurchaseRequest[]> => {
  let query = supabase
    .from("purchase_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status as PurchaseRequestStatus);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%`);
  }

  if (filters.dateRange.from) {
    query = query.gte("created_at", filters.dateRange.from.toISOString());
  }

  if (filters.dateRange.to) {
    query = query.lte("created_at", filters.dateRange.to.toISOString());
  }

  const { data, error } = await query;
  
  if (error) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestLoadError'));
    throw error;
  }
  
  return (data as unknown as PurchaseRequest[]) || [];
};

export const fetchPurchaseRequestById = async (id: string): Promise<PurchaseRequest> => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestLoadError'));
    throw error;
  }

  return data as unknown as PurchaseRequest;
};

export const fetchPurchaseRequestItems = async (requestId: string): Promise<PurchaseRequestItem[]> => {
  const { data, error } = await supabase
    .from("purchase_request_items")
    .select("*")
    .eq("request_id", requestId);

  if (error) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestItemLoadError'));
    throw error;
  }

  return (data as unknown as PurchaseRequestItem[]) || [];
};

export const fetchRequestWithItems = async (id: string) => {
  const request = await fetchPurchaseRequestById(id);
  const items = await fetchPurchaseRequestItems(id);
  return { ...request, items };
};

export const createPurchaseRequest = async (requestData: PurchaseRequestFormData) => {
  const { items, ...requestDetails } = requestData;
  
  // Get current user from Supabase - Updated to use the correct method
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.userIdNotFound'));
    throw new Error("User not authenticated");
  }
  
  // Create the request first
  const { data: request, error: requestError } = await supabase
    .from("purchase_requests")
    .insert([
      { ...requestDetails, requester_id: data.user.id }
    ])
    .select()
    .single();

  if (requestError) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestCreateError'));
    throw requestError;
  }

  // Then create all items
  const itemsWithRequestId = items.map(item => ({
    ...item,
    request_id: (request as any).id,
    estimated_total: (item.quantity || 0) * (item.estimated_unit_price || 0)
  }));

  const { error: itemsError } = await supabase
    .from("purchase_request_items")
    .insert(itemsWithRequestId);

  if (itemsError) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestItemAddError'));
    throw itemsError;
  }

  const i18n = (await import('@/i18n/config')).default;
  toast.success(i18n.t('toast.purchaseRequestCreated'));
  return request;
};

export const updatePurchaseRequest = async ({ id, data }: { id: string, data: Partial<PurchaseRequestFormData> }) => {
  const { items, ...requestDetails } = data as any;
  
  // Update the request details
  const { error: requestError } = await supabase
    .from("purchase_requests")
    .update(requestDetails)
    .eq("id", id);

  if (requestError) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestUpdateError'));
    throw requestError;
  }

  // If items are provided, handle them
  if (items && items.length > 0) {
    // First, delete the existing items
    const { error: deleteError } = await supabase
      .from("purchase_request_items")
      .delete()
      .eq("request_id", id);

    if (deleteError) {
      const i18n = (await import('@/i18n/config')).default;
      toast.error(i18n.t('toast.purchaseRequestItemAddError'));
      throw deleteError;
    }

    // Then insert the new items
    const itemsWithRequestId = items.map((item: any) => ({
      ...item,
      request_id: id,
      estimated_total: (item.quantity || 0) * (item.estimated_unit_price || 0)
    }));

    const { error: itemsError } = await supabase
      .from("purchase_request_items")
      .insert(itemsWithRequestId);

    if (itemsError) {
      const i18n = (await import('@/i18n/config')).default;
      toast.error(i18n.t('toast.purchaseRequestItemAddError'));
      throw itemsError;
    }
  }

  const i18n = (await import('@/i18n/config')).default;
  toast.success(i18n.t('toast.purchaseRequestUpdated'));
  return { id };
};

export const updateRequestStatus = async ({ 
  id, 
  status, 
  approvedBy = null 
}: { 
  id: string, 
  status: PurchaseRequestStatus, 
  approvedBy?: string | null 
}) => {
  const updateData: any = { status };
  
  // If the status is 'approved', set the approved_by and approved_at fields
  if (status === 'approved') {
    updateData.approved_by = approvedBy;
    updateData.approved_at = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from("purchase_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestStatusError'));
    throw error;
  }

  const i18n = (await import('@/i18n/config')).default;
  toast.success(i18n.t('toast.purchaseRequestStatusUpdated'));
  return { id };
};

export const deletePurchaseRequest = async (id: string) => {
  // Delete the request (cascade will delete items)
  const { error } = await supabase
    .from("purchase_requests")
    .delete()
    .eq("id", id);

  if (error) {
    const i18n = (await import('@/i18n/config')).default;
    toast.error(i18n.t('toast.purchaseRequestDeleteError'));
    throw error;
  }

  const i18n = (await import('@/i18n/config')).default;
  toast.success(i18n.t('toast.purchaseRequestDeleted'));
  return { id };
};
