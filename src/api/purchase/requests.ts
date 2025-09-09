
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PurchaseRequest, PurchaseRequestFormData, PurchaseRequestStatus } from "@/types/purchase";

// Function to fetch purchase requests with filters
export const fetchPurchaseRequests = async (filters: {
  status: string;
  search: string;
  dateRange: { from: Date | null, to: null | Date };
}): Promise<PurchaseRequest[]> => {
  console.log("Fetching purchase requests with filters:", filters);
  
  try {
    let query = supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "") {
      // Cast the string to PurchaseRequestStatus to ensure type safety
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
      console.error("Error fetching purchase requests:", error);
      toast.error("Satın alma talepleri yüklenirken hata oluştu");
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} purchase requests`);
    return (data as unknown as PurchaseRequest[]) || [];
  } catch (error) {
    console.error("Exception in fetchPurchaseRequests:", error);
    toast.error("Satın alma talepleri yüklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to fetch a single purchase request by ID
export const fetchPurchaseRequestById = async (id: string): Promise<PurchaseRequest> => {
  console.log(`Fetching purchase request with ID: ${id}`);
  
  try {
    const { data, error } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching purchase request ID ${id}:`, error);
      toast.error("Satın alma talebi yüklenirken hata oluştu");
      throw error;
    }

    console.log(`Successfully fetched purchase request ID ${id}`);
    return data as unknown as PurchaseRequest;
  } catch (error) {
    console.error(`Exception in fetchPurchaseRequestById for ID ${id}:`, error);
    toast.error("Satın alma talebi yüklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to fetch a request with its items
export const fetchRequestWithItems = async (id: string) => {
  console.log(`Fetching purchase request with items for ID: ${id}`);
  
  try {
    const request = await fetchPurchaseRequestById(id);
    const { fetchPurchaseRequestItems } = await import('./requestItems');
    const items = await fetchPurchaseRequestItems(id);
    console.log(`Successfully fetched purchase request ID ${id} with ${items.length} items`);
    return { ...request, items };
  } catch (error) {
    console.error(`Exception in fetchRequestWithItems for ID ${id}:`, error);
    toast.error("Satın alma talebi ve kalemleri yüklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to create a purchase request
export const createPurchaseRequest = async (requestData: PurchaseRequestFormData) => {
  console.log("Creating new purchase request:", { title: requestData.title, itemCount: requestData.items?.length || 0 });
  
  try {
    const { items, ...requestDetails } = requestData;
    
    // Get current user from Supabase - Updated to use the correct method
    const { data, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      toast.error("Kullanıcı kimliği alınamadı");
      throw userError;
    }
    
    if (!data.user) {
      console.error("User not authenticated");
      toast.error("Kullanıcı kimliği alınamadı");
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
      console.error("Error creating purchase request:", requestError);
      toast.error("Satın alma talebi oluşturulurken hata oluştu");
      throw requestError;
    }

    // Import and use the function to add items
    const { addPurchaseRequestItems } = await import('./requestItems');
    await addPurchaseRequestItems((request as any).id, items);

    console.log(`Successfully created purchase request ID ${(request as any).id}`);
    toast.success("Satın alma talebi başarıyla oluşturuldu");
    return request;
  } catch (error) {
    console.error("Exception in createPurchaseRequest:", error);
    toast.error("Satın alma talebi oluşturulurken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to update a purchase request
export const updatePurchaseRequest = async ({ id, data }: { id: string, data: Partial<PurchaseRequestFormData> }) => {
  console.log(`Updating purchase request ID ${id}:`, { 
    title: data.title, 
    hasItems: data.items && data.items.length > 0 
  });
  
  try {
    const { items, ...requestDetails } = data as any;
    
    // Update the request details
    const { error: requestError } = await supabase
      .from("purchase_requests")
      .update(requestDetails)
      .eq("id", id);

    if (requestError) {
      console.error(`Error updating purchase request ID ${id}:`, requestError);
      toast.error("Satın alma talebi güncellenirken hata oluştu");
      throw requestError;
    }

    // If items are provided, handle them
    if (items && items.length > 0) {
      const { updatePurchaseRequestItems } = await import('./requestItems');
      await updatePurchaseRequestItems(id, items);
      console.log(`Updated ${items.length} items for purchase request ID ${id}`);
    }

    console.log(`Successfully updated purchase request ID ${id}`);
    toast.success("Satın alma talebi başarıyla güncellendi");
    return { id };
  } catch (error) {
    console.error(`Exception in updatePurchaseRequest for ID ${id}:`, error);
    toast.error("Satın alma talebi güncellenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

// Function to delete a purchase request
export const deletePurchaseRequest = async (id: string) => {
  console.log(`Deleting purchase request ID ${id}`);
  
  try {
    // Delete the request (cascade will delete items)
    const { error } = await supabase
      .from("purchase_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting purchase request ID ${id}:`, error);
      toast.error("Satın alma talebi silinirken hata oluştu");
      throw error;
    }

    console.log(`Successfully deleted purchase request ID ${id}`);
    toast.success("Satın alma talebi başarıyla silindi");
    return { id };
  } catch (error) {
    console.error(`Exception in deletePurchaseRequest for ID ${id}:`, error);
    toast.error("Satın alma talebi silinirken beklenmeyen bir hata oluştu");
    throw error;
  }
};
