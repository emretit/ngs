import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type {
  PortalSupplier,
  PortalRFQ,
  PortalPurchaseOrder,
  PortalDashboardStats,
  QuoteFormData,
  PortalInviteFormData,
} from '@/types/supplier-portal';

// Storage keys
const SESSION_TOKEN_KEY = 'supplier_portal_session';
const SUPPLIER_DATA_KEY = 'supplier_portal_data';

// Get session token
export const getSessionToken = (): string | null => {
  return localStorage.getItem(SESSION_TOKEN_KEY);
};

// Set session token
export const setSessionToken = (token: string): void => {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
};

// Clear session
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SUPPLIER_DATA_KEY);
};

// Get supplier data from storage
export const getStoredSupplier = (): PortalSupplier | null => {
  const data = localStorage.getItem(SUPPLIER_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

// Set supplier data to storage
export const setStoredSupplier = (supplier: PortalSupplier): void => {
  localStorage.setItem(SUPPLIER_DATA_KEY, JSON.stringify(supplier));
};

// ==========================================
// PORTAL AUTH HOOK
// ==========================================
export const useSupplierPortalAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [supplier, setSupplier] = useState<PortalSupplier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = getSessionToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('supplier-portal-auth', {
          body: {},
          headers: {
            'x-supplier-session': token,
          },
          method: 'GET',
        });

        // Parse the URL to add action parameter
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supplier-portal-auth?action=verify`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-supplier-session': token,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );

        const result = await response.json();

        if (result.is_valid && result.supplier) {
          setIsAuthenticated(true);
          setSupplier(result.supplier);
          setStoredSupplier(result.supplier);
        } else {
          clearSession();
          setIsAuthenticated(false);
          setSupplier(null);
        }
      } catch (error) {
        console.error('Session verification error:', error);
        clearSession();
        setIsAuthenticated(false);
        setSupplier(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  // Login with token
  const login = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supplier-portal-auth?action=login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token }),
        }
      );

      const result = await response.json();

      if (result.success && result.session_token) {
        setSessionToken(result.session_token);
        setIsAuthenticated(true);
        setSupplier(result.supplier);
        setStoredSupplier(result.supplier);
        return true;
      } else {
        toast({
          title: 'Giriş Başarısız',
          description: result.error || 'Geçersiz veya süresi dolmuş token',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Hata',
        description: 'Giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    const token = getSessionToken();
    
    if (token) {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supplier-portal-auth?action=logout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-supplier-session': token,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearSession();
    setIsAuthenticated(false);
    setSupplier(null);
  }, []);

  return {
    isAuthenticated,
    supplier,
    isLoading,
    login,
    logout,
    sessionToken: getSessionToken(),
  };
};

// ==========================================
// PORTAL DATA FETCHER
// ==========================================
const fetchPortalData = async (action: string, params?: Record<string, string>) => {
  const token = getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supplier-portal-data`);
  url.searchParams.set('action', action);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-supplier-session': token,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// ==========================================
// DASHBOARD STATS HOOK
// ==========================================
export const usePortalDashboardStats = () => {
  return useQuery({
    queryKey: ['portal-dashboard-stats'],
    queryFn: () => fetchPortalData('dashboard'),
    staleTime: 5 * 60 * 1000,
    enabled: !!getSessionToken(),
  });
};

// ==========================================
// RFQS HOOK
// ==========================================
export const usePortalRFQs = () => {
  return useQuery({
    queryKey: ['portal-rfqs'],
    queryFn: async () => {
      const data = await fetchPortalData('rfqs');
      return data.rfqs as PortalRFQ[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!getSessionToken(),
  });
};

// ==========================================
// SINGLE RFQ HOOK
// ==========================================
export const usePortalRFQ = (rfqId: string) => {
  return useQuery({
    queryKey: ['portal-rfq', rfqId],
    queryFn: async () => {
      const data = await fetchPortalData('rfq', { id: rfqId });
      return data as PortalRFQ;
    },
    enabled: !!rfqId && !!getSessionToken(),
  });
};

// ==========================================
// SUBMIT QUOTE HOOK
// ==========================================
export const useSubmitQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rfqId, quoteData }: { rfqId: string; quoteData: QuoteFormData }) => {
      const token = getSessionToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supplier-portal-data?action=submit_quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-supplier-session': token,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            rfq_id: rfqId,
            quote_data: quoteData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit quote');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['portal-rfq', variables.rfqId] });
      queryClient.invalidateQueries({ queryKey: ['portal-dashboard-stats'] });
      toast({
        title: 'Başarılı',
        description: 'Teklifiniz gönderildi',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Teklif gönderilirken bir hata oluştu',
        variant: 'destructive',
      });
    },
  });
};

// ==========================================
// ORDERS HOOK
// ==========================================
export const usePortalOrders = () => {
  return useQuery({
    queryKey: ['portal-orders'],
    queryFn: async () => {
      const data = await fetchPortalData('orders');
      return data.orders as PortalPurchaseOrder[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!getSessionToken(),
  });
};

// ==========================================
// SINGLE ORDER HOOK
// ==========================================
export const usePortalOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['portal-order', orderId],
    queryFn: async () => {
      const data = await fetchPortalData('order', { id: orderId });
      return data as PortalPurchaseOrder;
    },
    enabled: !!orderId && !!getSessionToken(),
  });
};

// ==========================================
// ADMIN: INVITE SUPPLIER HOOK
// ==========================================
export const useInviteSupplierToPortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PortalInviteFormData) => {
      const { data: result, error } = await supabase.functions.invoke('supplier-portal-invite', {
        body: data,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: 'Başarılı',
        description: 'Portal daveti oluşturuldu',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Davet oluşturulurken bir hata oluştu',
        variant: 'destructive',
      });
    },
  });
};

// ==========================================
// ADMIN: GET PORTAL ACTIVITIES
// ==========================================
export const useSupplierPortalActivities = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier-portal-activities', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_portal_activities')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
};

