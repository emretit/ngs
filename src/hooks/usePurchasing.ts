import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { 
  PurchaseRequest, 
  PurchaseRequestFormData,
  Approval,
  PurchasingSettings
} from '@/types/purchasing';

// Fetch all purchase requests
export const usePurchaseRequests = () => {
  return useQuery({
    queryKey: ['purchase-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          requester:employees!purchase_requests_requester_id_fkey(first_name, last_name),
          department:departments(name),
          items:purchase_request_items(
            *,
            product:products(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseRequest[];
    },
  });
};

// Fetch single purchase request
export const usePurchaseRequest = (id: string) => {
  return useQuery({
    queryKey: ['purchase-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          requester:employees!purchase_requests_requester_id_fkey(first_name, last_name),
          department:departments(name),
          items:purchase_request_items(
            *,
            product:products(name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PurchaseRequest;
    },
    enabled: !!id,
  });
};

// Fetch approvals for an object
export const useApprovals = (objectType: string, objectId: string) => {
  return useQuery({
    queryKey: ['approvals', objectType, objectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          approver:profiles(first_name, last_name)
        `)
        .eq('object_type', objectType)
        .eq('object_id', objectId)
        .order('step', { ascending: true });

      if (error) throw error;
      return data as Approval[];
    },
    enabled: !!objectId,
  });
};

// Create purchase request
export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PurchaseRequestFormData) => {
      // 1. Create the request header
      const { data: request, error: requestError } = await supabase
        .from('purchase_requests')
        .insert([{
          requester_id: data.requester_id,
          department_id: data.department_id,
          priority: data.priority,
          need_by_date: data.need_by_date,
          requester_notes: data.requester_notes,
          cost_center: data.cost_center,
          status: 'draft',
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      // 2. Create items
      if (data.items.length > 0) {
        const items = data.items.map(item => ({
          request_id: request.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          estimated_price: item.estimated_price,
          uom: item.uom,
          notes: item.notes,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_request_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({
        title: "Başarılı",
        description: "Satın alma talebi oluşturuldu.",
      });
    },
    onError: (error) => {
      console.error('PR creation error:', error);
      toast({
        title: "Hata",
        description: "Talep oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Submit purchase request for approval
export const useSubmitPurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .update({ status: 'submitted' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({
        title: "Başarılı",
        description: "Talep onaya gönderildi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Talep gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Approve/Reject approval
export const useDecideApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      comment 
    }: { 
      id: string; 
      status: 'approved' | 'rejected'; 
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from('approvals')
        .update({ 
          status, 
          comment,
          decided_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update PR status if all approvals are done
      const approval = data as Approval;
      const { data: allApprovals } = await supabase
        .from('approvals')
        .select('*')
        .eq('object_id', approval.object_id)
        .eq('object_type', approval.object_type);

      const allApproved = allApprovals?.every(a => a.status === 'approved');
      const anyRejected = allApprovals?.some(a => a.status === 'rejected');

      if (allApproved) {
        await supabase
          .from('purchase_requests')
          .update({ status: 'approved' })
          .eq('id', approval.object_id);
      } else if (anyRejected) {
        await supabase
          .from('purchase_requests')
          .update({ status: 'rejected' })
          .eq('id', approval.object_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({
        title: "Başarılı",
        description: "Onay kaydedildi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Onay kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Fetch purchasing settings
export const usePurchasingSettings = () => {
  return useQuery({
    queryKey: ['purchasing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchasing_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as PurchasingSettings | null;
    },
  });
};
