
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PurchaseRequestItem, PurchaseRequestItemFormData } from "@/types/purchase";

// Function to fetch purchase request items
export const fetchPurchaseRequestItems = async (requestId: string): Promise<PurchaseRequestItem[]> => {
  console.log(`Fetching items for purchase request ID ${requestId}`);
  
  try {
    const { data, error } = await supabase
      .from("purchase_request_items")
      .select("*")
      .eq("request_id", requestId);

    if (error) {
      console.error(`Error fetching items for request ID ${requestId}:`, error);
      toast.error("Talep öğeleri yüklenirken hata oluştu");
      throw error;
    }

    console.log(`Successfully fetched ${data?.length || 0} items for request ID ${requestId}`);
    return (data as unknown as PurchaseRequestItem[]) || [];
  } catch (error) {
    console.error(`Exception in fetchPurchaseRequestItems for request ID ${requestId}:`, error);
    toast.error("Talep öğeleri yüklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to add purchase request items
export const addPurchaseRequestItems = async (requestId: string, items: PurchaseRequestItemFormData[]) => {
  console.log(`Adding ${items.length} items to purchase request ID ${requestId}`);
  
  try {
    if (!items || items.length === 0) {
      console.log(`No items to add for request ID ${requestId}`);
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
      console.error(`Error adding items to request ID ${requestId}:`, error);
      toast.error("Talep öğeleri eklenirken hata oluştu");
      throw error;
    }

    console.log(`Successfully added ${items.length} items to request ID ${requestId}`);
    return true;
  } catch (error) {
    console.error(`Exception in addPurchaseRequestItems for request ID ${requestId}:`, error);
    toast.error("Talep öğeleri eklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to update purchase request items
export const updatePurchaseRequestItems = async (requestId: string, items: PurchaseRequestItemFormData[]) => {
  console.log(`Updating items for purchase request ID ${requestId}`);
  
  try {
    // First, delete the existing items
    const { error: deleteError } = await supabase
      .from("purchase_request_items")
      .delete()
      .eq("request_id", requestId);

    if (deleteError) {
      console.error(`Error deleting existing items for request ID ${requestId}:`, deleteError);
      toast.error("Mevcut talep öğeleri silinirken hata oluştu");
      throw deleteError;
    }

    console.log(`Successfully deleted existing items for request ID ${requestId}`);
    
    // Then insert the new items if there are any
    if (items && items.length > 0) {
      const result = await addPurchaseRequestItems(requestId, items);
      return result;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception in updatePurchaseRequestItems for request ID ${requestId}:`, error);
    toast.error("Talep öğeleri güncellenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};
