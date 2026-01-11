import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShortageItem } from "./useStockReservation";

interface CreatePurchaseRequestParams {
  orderId: string;
  shortageItems: ShortageItem[];
}

export const useAutoPurchaseRequest = () => {
  const queryClient = useQueryClient();
  
  const createPurchaseRequest = async ({ orderId, shortageItems }: CreatePurchaseRequestParams) => {
    console.log("🛒 [useAutoPurchaseRequest] Creating purchase request for order:", orderId);
    
    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_number, customer_id, company_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Sipariş bilgileri alınamadı");
    }
    
    // 2. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Kullanıcı bilgisi alınamadı");
    }
    
    // 3. Generate purchase request number
    const timestamp = Date.now().toString().slice(-8);
    const prNumber = `PR-${timestamp}`;
    
    // 4. Create purchase request
    const { data: purchaseRequest, error: prError } = await supabase
      .from("purchase_requests")
      .insert({
        company_id: order.company_id,
        request_number: prNumber,
        requester_id: user.id,
        status: 'pending',
        priority: 'high',
        requester_notes: `Sipariş ${order.order_number} için otomatik oluşturuldu - Stok yetersizliği`,
      })
      .select()
      .single();
    
    if (prError) {
      console.error("❌ [useAutoPurchaseRequest] Purchase request creation error:", prError);
      throw new Error(`Satın alma talebi oluşturulamadı: ${prError.message}`);
    }

    console.log("✅ [useAutoPurchaseRequest] Purchase request created:", purchaseRequest.id);
    
    // 5. Create purchase request items
    const requestItems = shortageItems.map(item => ({
      request_id: purchaseRequest.id,
      product_id: item.product_id,
      description: item.product_name,
      quantity: item.shortage, // Sadece eksik miktar
      unit: item.unit,
      notes: `Sipariş ${order.order_number} için gerekli - Eksik: ${item.shortage} ${item.unit}`
    }));
    
    const { error: itemsError } = await supabase
      .from("purchase_request_items")
      .insert(requestItems);
    
    if (itemsError) {
      console.error("❌ [useAutoPurchaseRequest] Items creation error:", itemsError);
      throw new Error(`Satın alma talebi kalemleri eklenemedi: ${itemsError.message}`);
    }

    console.log(`✅ [useAutoPurchaseRequest] Added ${requestItems.length} items to purchase request`);
    
    return purchaseRequest;
  };
  
  const mutation = useMutation({
    mutationFn: createPurchaseRequest,
    onSuccess: (data) => {
      toast.success(`Satın alma talebi oluşturuldu: ${data.request_number}`);
      queryClient.invalidateQueries({ queryKey: ["purchase_requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error("❌ [useAutoPurchaseRequest] Mutation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Satın alma talebi oluşturulamadı";
      toast.error(errorMessage);
    }
  });
  
  return {
    createPurchaseRequest: mutation.mutateAsync,
    isCreating: mutation.isPending
  };
};
