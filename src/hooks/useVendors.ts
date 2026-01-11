import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Vendor {
  id: string;
  company_id: string;
  code: string | null;
  name: string;
  tax_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  currency: string;
  payment_terms: string | null;
  payment_terms_days: number | null;
  rating: number;
  incoterm: string | null;
  delivery_lead_days: number | null;
  tags: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  contacts?: VendorContact[];
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorFormData {
  code?: string;
  name: string;
  tax_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  payment_terms?: string;
  payment_terms_days?: number;
  rating?: number;
  incoterm?: string;
  delivery_lead_days?: number;
  tags?: any[];
  is_active?: boolean;
}

// Fetch all vendors
export const useVendors = (filters?: {
  search?: string;
  is_active?: boolean;
  currency?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select(`
          *,
          contacts:supplier_contacts(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.currency) {
        query = query.eq('currency', filters.currency);
      }

      if (filters?.startDate) {
        query = query.gte('updated_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('updated_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Vendor[];
    },
  });
};

// Fetch single vendor
export const useVendor = (id: string) => {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          contacts:supplier_contacts(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!id,
  });
};

// Check for duplicate vendor
export const useCheckVendorDuplicate = () => {
  return useMutation({
    mutationFn: async ({ tax_number, name, excludeId }: { 
      tax_number?: string; 
      name: string; 
      excludeId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      let query = supabase
        .from('suppliers')
        .select('id, name, tax_number')
        ;

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      if (tax_number) {
        query = query.or(`tax_number.eq.${tax_number},name.ilike.${name}`);
      } else {
        query = query.ilike('name', name);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

// Create vendor
export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: VendorFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      const { data: vendor, error } = await supabase
        .from('suppliers')
        .insert({
          company_id: profile.company_id,
          created_by: user.id,
          updated_by: user.id,
          ...formData,
          currency: formData.currency || 'TRY',
          rating: formData.rating || 0,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
        })
        .select()
        .single();

      if (error) throw error;
      return vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Başarılı",
        description: "Tedarikçi oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Tedarikçi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Update vendor
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VendorFormData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('suppliers')
        .update({
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
      toast({
        title: "Başarılı",
        description: "Tedarikçi güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Tedarikçi güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Toggle vendor active status
export const useToggleVendorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('suppliers')
        .update({ 
          is_active,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Başarılı",
        description: variables.is_active ? "Tedarikçi aktif edildi." : "Tedarikçi devre dışı bırakıldı.",
      });
    },
  });
};

// Vendor Contacts Hooks
export const useVendorContacts = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendor-contacts', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_contacts')
        .select('*')
        .eq('supplier_id', vendorId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data as VendorContact[];
    },
    enabled: !!vendorId,
  });
};

export const useCreateVendorContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<VendorContact, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      const { data, error } = await supabase
        .from('supplier_contacts')
        .insert({
          ...contact,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', data.vendor_id] });
      toast({
        title: "Başarılı",
        description: "İletişim kişisi eklendi.",
      });
    },
  });
};

export const useUpdateVendorContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, vendorId, data }: { 
      id: string; 
      vendorId: string;
      data: Partial<VendorContact>;
    }) => {
      const { error } = await supabase
        .from('supplier_contacts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return vendorId;
    },
    onSuccess: (vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', vendorId] });
      toast({
        title: "Başarılı",
        description: "İletişim kişisi güncellendi.",
      });
    },
  });
};

export const useDeleteVendorContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const { error } = await supabase
        .from('supplier_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return vendorId;
    },
    onSuccess: (vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', vendorId] });
      toast({
        title: "Başarılı",
        description: "İletişim kişisi silindi.",
      });
    },
  });
};
