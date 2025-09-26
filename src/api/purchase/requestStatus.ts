
import { supabase } from "@/integrations/supabase/client";
import { PurchaseRequestStatus } from "@/types/purchase";
import { handleError, handleSuccess } from "@/utils/errorHandler";

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
  try {
    const updateData: any = { status };
    
    if (status === 'approved') {
      updateData.approved_by = approvedBy;
      updateData.approved_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("purchase_requests")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw error;
    }

    handleSuccess("Talep durumu başarıyla güncellendi", "updateRequestStatus", { id, status });
    return { id };
  } catch (error) {
    handleError(error, {
      operation: "updateRequestStatus",
      resourceId: id,
      metadata: { status, approvedBy }
    });
    throw error;
  }
};
