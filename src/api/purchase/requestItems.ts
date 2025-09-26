
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/utils/errorHandler";
import { PurchaseRequestItem, PurchaseRequestItemFormData } from "@/types/purchase";

export const fetchPurchaseRequestItems = async (requestId: string): Promise<PurchaseRequestItem[]> => {
  try {
    const { data, error } = await supabase
      .from("purchase_request_items")
      .select("*")
      .eq("request_id", requestId);

    if (error) {
      throw error;
    }

    return (data as unknown as PurchaseRequestItem[]) || [];
  } catch (error) {
    handleError(error, {
      operation: "fetchPurchaseRequestItems",
      resourceId: requestId
    });
    throw error;
  }
};

export const addPurchaseRequestItems = async (requestId: string, items: PurchaseRequestItemFormData[]) => {
  try {
    if (!items || items.length === 0) {
      return true;
    }
    
    const itemsWithRequestId = items.map(item => ({
      ...item,
      request_id: requestId,
      estimated_total: (item.quantity || 0) * (item.estimated_unit_price || 0)
    }));

    const { error } = await supabase
      .from("purchase_request_items")
      .insert(itemsWithRequestId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    handleError(error, {
      operation: "addPurchaseRequestItems",
      resourceId: requestId,
      metadata: { itemCount: items?.length }
    });
    throw error;
  }
};

export const updatePurchaseRequestItems = async (requestId: string, items: PurchaseRequestItemFormData[]) => {
  try {
    // First, delete the existing items
    const { error: deleteError } = await supabase
      .from("purchase_request_items")
      .delete()
      .eq("request_id", requestId);

    if (deleteError) {
      throw deleteError;
    }
    
    // Then insert the new items if there are any
    if (items && items.length > 0) {
      const result = await addPurchaseRequestItems(requestId, items);
      return result;
    }
    
    return true;
  } catch (error) {
    handleError(error, {
      operation: "updatePurchaseRequestItems",
      resourceId: requestId,
      metadata: { itemCount: items?.length }
    });
    throw error;
  }
};
