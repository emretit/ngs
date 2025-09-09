
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PurchaseRequestStatus } from "@/types/purchase";

// Function to update purchase request status
export const updateRequestStatus = async ({ 
  id, 
  status, 
  approvedBy = null 
}: { 
  id: string, 
  status: PurchaseRequestStatus, 
  approvedBy?: string | null 
}) => {
  console.log(`Updating status of purchase request ID ${id} to ${status}`);
  
  try {
    const updateData: any = { status };
    
    // If the status is 'approved', set the approved_by and approved_at fields
    if (status === 'approved') {
      updateData.approved_by = approvedBy;
      updateData.approved_at = new Date().toISOString();
      console.log(`Setting approval data for request ID ${id}`);
    }
    
    const { error } = await supabase
      .from("purchase_requests")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error(`Error updating status of request ID ${id} to ${status}:`, error);
      toast.error("Satın alma talebi durumu güncellenirken hata oluştu");
      throw error;
    }

    console.log(`Successfully updated status of request ID ${id} to ${status}`);
    toast.success("Talep durumu başarıyla güncellendi");
    return { id };
  } catch (error) {
    console.error(`Exception in updateRequestStatus for request ID ${id}:`, error);
    toast.error("Satın alma talebi durumu güncellenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};
