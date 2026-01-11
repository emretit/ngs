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
          department:departments(name),
          items:purchase_request_items(
            *,
            product:products(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch requester details from profiles separately
      if (data && data.length > 0) {
        const requesterIds = data.map(r => r.requester_id).filter(Boolean);
        if (requesterIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', requesterIds);
          
          // Merge profiles data
          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
          data.forEach(req => {
            if (req.requester_id) {
              req.requester = profilesMap.get(req.requester_id);
            }
          });
        }
      }
      
      return data as PurchaseRequest[];
    },
    // Cache optimizasyonu
    staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
    gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
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
          department:departments(name),
          items:purchase_request_items(
            *,
            product:products(name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Fetch requester details from profiles separately
      if (data && data.requester_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', data.requester_id)
          .single();
        
        if (profile) {
          data.requester = profile;
        }
      }
      
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

// Convert PR to RFQ
export const useConvertPRToRFQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prId: string) => {
      // Update PR status to converted
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'converted' })
        .eq('id', prId);

      if (error) throw error;
      return prId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({
        title: "Başarılı",
        description: "Talep RFQ'ya dönüştürülüyor...",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Dönüştürme işlemi başarısız.",
        variant: "destructive",
      });
    },
  });
};

// Convert PR to PO
export const useConvertPRToPO = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prId: string) => {
      // Update PR status to converted
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'converted' })
        .eq('id', prId);

      if (error) throw error;
      return prId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({
        title: "Başarılı",
        description: "Talep PO'ya dönüştürülüyor...",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Dönüştürme işlemi başarısız.",
        variant: "destructive",
      });
    },
  });
};
