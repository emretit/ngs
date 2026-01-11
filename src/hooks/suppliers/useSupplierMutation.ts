import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SupplierFormData } from "@/types/supplier";
import { logger } from "@/utils/logger";
import { useLocationResolver } from './useLocationResolver';

/**
 * Supplier CRUD Operations
 * Tedarikçi oluşturma ve güncelleme işlemleri
 */

export const useSupplierMutation = (id?: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { parseCityDistrict } = useLocationResolver();

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
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
        country: data.country || null,
        postal_code: data.postal_code || null,
        apartment_number: data.apartment_number || null,
        unit_number: data.unit_number || null,
        fax: data.fax || null,
        website: data.website || null,
        is_active: data.is_active,
        payee_financial_account_id: data.payee_financial_account_id || null,
        payment_means_channel_code: data.payment_means_channel_code || null,
        payment_means_code: data.payment_means_code || null,
        aliases: data.aliases.length > 0 ? data.aliases : null,
        einvoice_alias_name: data.einvoice_alias_name || null,
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
        bank_name: data.bank_name || null,
        iban: data.iban || null,
        account_number: data.account_number || null,
        payment_terms: data.payment_terms || null,
        trade_registry_number: data.trade_registry_number || null,
        mersis_number: data.mersis_number || null,
        establishment_date: data.establishment_date || null,
        sector: data.sector || null,
        supplier_segment: data.supplier_segment || null,
        supplier_source: data.supplier_source || null,
        notes: data.notes || null,
        first_contact_position: data.first_contact_position || null,
        einvoice_document_type: data.einvoice_document_type || null,
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
        logger.debug('Updating supplier data:', sanitizedData);
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(sanitizedData)
          .eq('id', id);
        if (updateError) {
          logger.error('Güncelleme hatası:', updateError);
          throw updateError;
        }
        const { data: updatedData, error: fetchError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (fetchError) {
          logger.error('Veri getirme hatası:', fetchError);
          throw fetchError;
        }
        if (!updatedData) {
          logger.error('Güncellenmiş veri bulunamadı');
          throw new Error('Güncellenmiş tedarikçi bulunamadı');
        }
        return updatedData;
      } else {
        // Add new supplier
        const dataWithCompanyId = { ...sanitizedData, company_id };
        logger.debug('Inserting supplier data:', dataWithCompanyId);
        const { data: newData, error } = await supabase
          .from('suppliers')
          .insert([dataWithCompanyId])
          .select()
          .maybeSingle();
        if (error) {
          logger.error('Ekleme hatası:', error);
          throw error;
        }
        if (!newData) {
          logger.error('Yeni eklenen veri bulunamadı');
          throw new Error('Tedarikçi eklenemedi');
        }
        return newData;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      }
      toast.success(id ? "Tedarikçi bilgileri başarıyla güncellendi." : "Yeni tedarikçi başarıyla eklendi.");
      navigate('/suppliers');
    },
    onError: (error) => {
      logger.error('Mutation error:', error);
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
    },
  });

  return mutation;
};
