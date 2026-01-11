import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";
import { logger } from "@/utils/logger";
import { useLocationResolver } from '../suppliers/useLocationResolver';

/**
 * Customer CRUD Operations
 * Müşteri oluşturma ve güncelleme işlemleri
 */

export const useCustomerMutation = (id?: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { parseCityDistrict } = useLocationResolver();

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // City ve district çözümleme
      const { cityId, districtId, cityName, districtName } = await parseCityDistrict(
        data.city,
        data.district
      );

      const {
        cityId: secondCityId,
        districtId: secondDistrictId,
        cityName: secondCityName,
        districtName: secondDistrictName
      } = await parseCityDistrict(
        data.second_city,
        data.second_district
      );

      const sanitizedData: any = {
        name: data.name,
        email: data.email || null,
        mobile_phone: data.mobile_phone || null,
        office_phone: data.office_phone || null,
        company: data.company || null,
        type: data.type,
        status: data.status,
        representative: data.representative || null,
        balance: data.balance || 0,
        address: data.address || null,
        tax_number: data.tax_number || null,
        tax_office: data.tax_office || null,
        city: cityName,
        city_id: cityId,
        district: districtName,
        district_id: districtId,
        einvoice_alias_name: data.einvoice_alias_name || null,
        website: data.website || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        apartment_number: data.apartment_number || null,
        unit_number: data.unit_number || null,
        fax: data.fax || null,
        bank_name: data.bank_name || null,
        iban: data.iban || null,
        account_number: data.account_number || null,
        trade_registry_number: data.trade_registry_number || null,
        mersis_number: data.mersis_number || null,
        establishment_date: data.establishment_date || null,
        sector: data.sector || null,
        customer_segment: data.customer_segment || null,
        customer_source: data.customer_source || null,
        notes: data.notes || null,
        first_contact_position: data.first_contact_position || null,
        second_contact_name: data.second_contact_name || null,
        second_contact_email: data.second_contact_email || null,
        second_contact_phone: data.second_contact_phone || null,
        second_contact_position: data.second_contact_position || null,
        second_address: data.second_address || null,
        second_city: secondCityName,
        second_city_id: secondCityId,
        second_district: secondDistrictName,
        second_district_id: secondDistrictId,
        second_country: data.second_country || null,
        second_postal_code: data.second_postal_code || null,
        payment_terms: data.payment_terms || null,
        is_einvoice_mukellef: data.is_einvoice_mukellef || false,
      };

      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .maybeSingle();
      
      const company_id = profileData?.company_id;

      if (id) {
        // Update
        const { error: updateError } = await supabase
          .from('customers')
          .update(sanitizedData)
          .eq('id', id);
        if (updateError) {
          logger.error('Güncelleme hatası:', updateError);
          throw updateError;
        }
        const { data: updatedData, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (fetchError) {
          logger.error('Veri getirme hatası:', fetchError);
          throw fetchError;
        }
        if (!updatedData) {
          logger.error('Güncellenmiş veri bulunamadı');
          throw new Error('Güncellenmiş müşteri bulunamadı');
        }
        return updatedData;
      } else {
        // Add new customer
        const dataWithCompanyId = { ...sanitizedData, company_id };
        const { data: newData, error } = await supabase
          .from('customers')
          .insert([dataWithCompanyId])
          .select()
          .maybeSingle();
        if (error) {
          logger.error('Ekleme hatası:', error);
          throw error;
        }
        if (!newData) {
          logger.error('Yeni eklenen veri bulunamadı');
          throw new Error('Müşteri eklenemedi');
        }
        return newData;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
      }
      toast.success(id ? "Müşteri bilgileri başarıyla güncellendi." : "Yeni müşteri başarıyla eklendi.");
      navigate('/customers');
    },
    onError: (error) => {
      logger.error('Mutation error:', error);
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
    },
  });

  return mutation;
};
