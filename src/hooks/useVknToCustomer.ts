import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VknToCustomerData {
  taxNumber: string;
  companyName: string;
  aliasName?: string;
  taxOffice?: string;
  address?: string;
  city?: string;
  district?: string;
  mersisNo?: string;
  sicilNo?: string;
  accountType?: string;
  type?: string;
  email?: string;
  phone?: string;
}

interface VknToCustomerResult {
  success: boolean;
  customerId?: string;
  message?: string;
  error?: string;
}

export const useVknToCustomer = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCustomerFromVkn = useCallback(async (vknData: VknToCustomerData): Promise<VknToCustomerResult> => {
    if (!vknData.taxNumber || !vknData.companyName) {
      return {
        success: false,
        error: 'Vergi numarası ve şirket adı zorunludur'
      };
    }

    setIsCreating(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Get user's company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Kullanıcı profil bilgileri bulunamadı');
      }

      // Check if customer already exists with this tax number
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id, name, company')
        .eq('tax_number', vknData.taxNumber)
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (checkError) {
        logger.error('Error checking existing customer:', checkError);
        throw new Error('Müşteri kontrolü yapılamadı');
      }

      if (existingCustomer) {
        return {
          success: false,
          error: `Bu vergi numarasına sahip müşteri zaten mevcut: ${existingCustomer.company || existingCustomer.name}`
        };
      }

      // Create new customer
      const customerData = {
        name: vknData.companyName, // Şirket adını name olarak kullan
        company: vknData.companyName,
        type: 'kurumsal' as const,
        status: 'potansiyel' as const,
        tax_number: vknData.taxNumber,
        tax_office: vknData.taxOffice || null,
        address: vknData.address || null,
        city: vknData.city || null,
        district: vknData.district || null,
        email: vknData.email || null,
        mobile_phone: vknData.phone || null,
        office_phone: null,
        representative: null,
        balance: 0,
        company_id: profile.company_id,
        // Nilvera için ticaret sicil ve mersis numaraları
        trade_registry_number: vknData.sicilNo || null,
        mersis_number: vknData.mersisNo || null,
        // E-fatura mükellefi bilgileri
        is_einvoice_mukellef: true,
        einvoice_alias_name: vknData.aliasName || null,
        einvoice_company_name: vknData.companyName,
        einvoice_tax_office: vknData.taxOffice || null,
        einvoice_address: vknData.address || null,
        einvoice_city: vknData.city || null,
        einvoice_district: vknData.district || null,
        einvoice_mersis_no: vknData.mersisNo || null,
        einvoice_sicil_no: vknData.sicilNo || null,
        einvoice_checked_at: new Date().toISOString(),
      };

      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating customer:', insertError);
        throw new Error(insertError.message || 'Müşteri oluşturulamadı');
      }

      // Invalidate customers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-select'] });

      toast({
        title: "Müşteri Eklendi",
        description: `${vknData.companyName} başarıyla müşteri listesine eklendi.`,
      });

      return {
        success: true,
        customerId: newCustomer.id,
        message: 'Müşteri başarıyla oluşturuldu'
      };

    } catch (error) {
      logger.error('VKN to customer creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsCreating(false);
    }
  }, [toast, queryClient]);

  return {
    createCustomerFromVkn,
    isCreating
  };
};
