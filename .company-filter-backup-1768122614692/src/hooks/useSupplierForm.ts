import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupplierFormData } from "@/types/supplier";
import { withErrorHandling } from "@/utils/supabaseErrorHandler";
import { logger } from "@/utils/logger";

export const useSupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    email: "",
    mobile_phone: "",
    office_phone: "",
    company: "",
    type: "bireysel",
    status: "potansiyel",
    representative: "",
    balance: 0,
    address: "",
    tax_number: "",
    tax_office: "",
    city: "",
    district: "",
    country: "",
    postal_code: "",
    apartment_number: "",
    unit_number: "",
    fax: "",
    website: "",
    is_active: true,
    payee_financial_account_id: "",
    payment_means_channel_code: "",
    payment_means_code: "",
    aliases: [],
    einvoice_alias_name: "",
    // İkinci yetkili kişi bilgileri
    second_contact_name: "",
    second_contact_email: "",
    second_contact_phone: "",
    second_contact_position: "",
    // İkinci adres bilgileri
    second_address: "",
    second_city: "",
    second_district: "",
    second_country: "",
    second_postal_code: "",
    // Finansal bilgiler
    bank_name: "",
    iban: "",
    account_number: "",
    payment_terms: "",
    // Şirket detay bilgileri
    trade_registry_number: "",
    mersis_number: "",
    establishment_date: "",
    sector: "",
    supplier_segment: "",
    supplier_source: "",
    // Notlar
    notes: "",
    // İlk yetkili kişi pozisyonu
    first_contact_position: "",
    einvoice_document_type: "",
  });

  const { data: supplier, isLoading: isLoadingSupplier, error: supplierError } = useQuery<any>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) {
        logger.debug('No ID provided, skipping supplier fetch');
        return null;
      }
      
      logger.debug('Fetching supplier data', { supplierId: id });
      
      // Önce company_id'yi al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        logger.error('No company_id found for user', new Error('Şirket bilgisi bulunamadı'));
        throw new Error('Şirket bilgisi bulunamadı');
      }
      
      const data = await withErrorHandling(
        () => supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .eq('company_id', companyId)
          .maybeSingle(),
        {
          operation: 'Tedarikçi bilgileri yükleme',
          table: 'suppliers',
          showToast: false, // React Query zaten error handling yapıyor
          logError: true
        }
      );

      if (!data) {
        throw new Error('Tedarikçi bulunamadı');
      }

      logger.debug('Retrieved supplier data', { supplierId: id });
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (supplier) {
      logger.debug('📝 Setting form data with supplier:', supplier);
      logger.debug('📋 Supplier name:', supplier.name);
      logger.debug('📋 Supplier company:', supplier.company);
      
      // City ve district için ID'den isim çözme fonksiyonları
      const resolveCityName = async (cityId: number | null): Promise<string> => {
        if (!cityId) return "";
        try {
          const { data } = await supabase
            .from('turkey_cities')
            .select('name')
            .eq('id', cityId)
            .maybeSingle();
          return data?.name || "";
        } catch (error) {
          logger.error('Error resolving city name:', error);
          return "";
        }
      };

      const resolveDistrictName = async (districtId: number | null, cityId: number | null): Promise<string> => {
        if (!districtId || !cityId) return "";
        try {
          const { data } = await supabase
            .from('turkey_districts')
            .select('name')
            .eq('id', districtId)
            .eq('city_id', cityId)
            .maybeSingle();
          return data?.name || "";
        } catch (error) {
          logger.error('Error resolving district name:', error);
          return "";
        }
      };

      // Async olarak city ve district isimlerini çöz
      const loadFormData = async () => {
        // İl için: ID varsa isim çöz, yoksa supplier.city string'ini kullan
        let cityName = "";
        if ((supplier as any).city_id) {
          cityName = await resolveCityName((supplier as any).city_id);
        } else {
          cityName = supplier.city || "";
        }
        
        // İlçe için: ID varsa isim çöz, yoksa supplier.district string'ini kullan
        let districtName = "";
        if ((supplier as any).district_id) {
          districtName = await resolveDistrictName((supplier as any).district_id, (supplier as any).city_id);
        } else {
          districtName = supplier.district || "";
        }
        
        // İkinci adres için aynı mantık
        let secondCityName = "";
        if ((supplier as any).second_city_id) {
          secondCityName = await resolveCityName((supplier as any).second_city_id);
        } else {
          secondCityName = supplier.second_city || "";
        }
        
        let secondDistrictName = "";
        if ((supplier as any).second_district_id) {
          secondDistrictName = await resolveDistrictName((supplier as any).second_district_id, (supplier as any).second_city_id);
        } else {
          secondDistrictName = supplier.second_district || "";
        }

        const newFormData: SupplierFormData = {
          name: supplier.name ?? "",
          email: supplier.email ?? "",
          mobile_phone: supplier.mobile_phone ?? "",
          office_phone: supplier.office_phone ?? "",
          company: supplier.company ?? "",
          type: supplier.type ?? "bireysel",
          status: supplier.status ?? "potansiyel",
          representative: supplier.representative ?? "",
          balance: supplier.balance ?? 0,
          address: supplier.address ?? "",
          tax_number: supplier.tax_number ?? "",
          tax_office: supplier.tax_office ?? "",
          city: cityName,
          district: districtName,
          country: supplier.country ?? "",
          postal_code: supplier.postal_code ?? "",
          apartment_number: supplier.apartment_number ?? "",
          unit_number: supplier.unit_number ?? "",
          fax: supplier.fax ?? "",
          website: supplier.website ?? "",
          is_active: supplier.is_active ?? true,
          payee_financial_account_id: supplier.payee_financial_account_id ?? "",
          payment_means_channel_code: supplier.payment_means_channel_code ?? "",
          payment_means_code: supplier.payment_means_code ?? "",
          aliases: supplier.aliases ?? [],
          einvoice_alias_name: supplier.einvoice_alias_name ?? "",
          // İkinci yetkili kişi bilgileri
          second_contact_name: supplier.second_contact_name ?? "",
          second_contact_email: supplier.second_contact_email ?? "",
          second_contact_phone: supplier.second_contact_phone ?? "",
          second_contact_position: supplier.second_contact_position ?? "",
          // İkinci adres bilgileri
          second_address: supplier.second_address ?? "",
          second_city: secondCityName,
          second_district: secondDistrictName,
          second_country: supplier.second_country ?? "",
          second_postal_code: supplier.second_postal_code ?? "",
          // Finansal bilgiler
          bank_name: supplier.bank_name ?? "",
          iban: supplier.iban ?? "",
          account_number: supplier.account_number ?? "",
          payment_terms: supplier.payment_terms ?? "",
          // Şirket detay bilgileri
          trade_registry_number: supplier.trade_registry_number ?? "",
          mersis_number: supplier.mersis_number ?? "",
          establishment_date: supplier.establishment_date ?? "",
          sector: supplier.sector ?? "",
          supplier_segment: supplier.supplier_segment ?? "",
          supplier_source: supplier.supplier_source ?? "",
          // Notlar
          notes: supplier.notes ?? "",
          // İlk yetkili kişi pozisyonu
          first_contact_position: supplier.first_contact_position ?? "",
          // E-Belge Tipi
          einvoice_document_type: (supplier as any).einvoice_document_type ?? "",
        };

        logger.debug('📝 New form data created:', newFormData);
        setFormData(newFormData);
        logger.debug('✅ Form data set successfully');
      };

      loadFormData();
    } else {
      logger.debug('⚠️ No supplier data available to set');
    }
  }, [supplier]);

  useEffect(() => {
    if (supplierError) {
      toast.error("Tedarikçi bilgileri yüklenemedi. Lütfen tekrar deneyin.");
      navigate('/suppliers');
    }
  }, [supplierError, navigate]);

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      // City ve district isimlerinden ID'ye çevir
      let cityId: number | null = null;
      let districtId: number | null = null;
      let secondCityId: number | null = null;
      let secondDistrictId: number | null = null;
      
      let cityName: string | null = null;
      let districtName: string | null = null;
      let secondCityName: string | null = null;
      let secondDistrictName: string | null = null;

      // İl için: Eğer sayısal bir değer ise ID olarak kabul et, değilse isimden ID bul
      if (data.city) {
        const parsedCityId = parseInt(data.city);
        if (!isNaN(parsedCityId) && data.city === parsedCityId.toString()) {
          // Sayısal bir ID
          cityId = parsedCityId;
        } else {
          // İsim olarak geldi, ID'ye çevir
          cityName = data.city;
          const { data: cityData } = await supabase
            .from('turkey_cities')
            .select('id')
            .ilike('name', data.city)
            .maybeSingle();
          if (cityData) {
            cityId = cityData.id;
          }
        }
      }

      // İlçe için: Eğer sayısal bir değer ise ID olarak kabul et, değilse isimden ID bul
      if (data.district && cityId) {
        const parsedDistrictId = parseInt(data.district);
        if (!isNaN(parsedDistrictId) && data.district === parsedDistrictId.toString()) {
          // Sayısal bir ID
          districtId = parsedDistrictId;
        } else {
          // İsim olarak geldi, ID'ye çevir
          districtName = data.district;
          const { data: districtData } = await supabase
            .from('turkey_districts')
            .select('id')
            .ilike('name', data.district)
            .eq('city_id', cityId)
            .maybeSingle();
          if (districtData) {
            districtId = districtData.id;
          }
        }
      } else if (data.district) {
        // İlçe var ama il yok, sadece isim olarak kaydet
        districtName = data.district;
      }

      // İkinci adres için aynı mantık
      if (data.second_city) {
        const parsedSecondCityId = parseInt(data.second_city);
        if (!isNaN(parsedSecondCityId) && data.second_city === parsedSecondCityId.toString()) {
          secondCityId = parsedSecondCityId;
        } else {
          secondCityName = data.second_city;
          const { data: secondCityData } = await supabase
            .from('turkey_cities')
            .select('id')
            .ilike('name', data.second_city)
            .maybeSingle();
          if (secondCityData) {
            secondCityId = secondCityData.id;
          }
        }
      }

      if (data.second_district && secondCityId) {
        const parsedSecondDistrictId = parseInt(data.second_district);
        if (!isNaN(parsedSecondDistrictId) && data.second_district === parsedSecondDistrictId.toString()) {
          secondDistrictId = parsedSecondDistrictId;
        } else {
          secondDistrictName = data.second_district;
          const { data: secondDistrictData } = await supabase
            .from('turkey_districts')
            .select('id')
            .ilike('name', data.second_district)
            .eq('city_id', secondCityId)
            .maybeSingle();
          if (secondDistrictData) {
            secondDistrictId = secondDistrictData.id;
          }
        }
      } else if (data.second_district) {
        secondDistrictName = data.second_district;
      }

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
        // İkinci yetkili kişi bilgileri
        second_contact_name: data.second_contact_name || null,
        second_contact_email: data.second_contact_email || null,
        second_contact_phone: data.second_contact_phone || null,
        second_contact_position: data.second_contact_position || null,
        // İkinci adres bilgileri
        second_address: data.second_address || null,
        second_city: secondCityName,
        second_city_id: secondCityId,
        second_district: secondDistrictName,
        second_district_id: secondDistrictId,
        second_country: data.second_country || null,
        second_postal_code: data.second_postal_code || null,
        // Finansal bilgiler
        bank_name: data.bank_name || null,
        iban: data.iban || null,
        account_number: data.account_number || null,
        payment_terms: data.payment_terms || null,
        // Şirket detay bilgileri
        trade_registry_number: data.trade_registry_number || null,
        mersis_number: data.mersis_number || null,
        establishment_date: data.establishment_date || null,
        sector: data.sector || null,
        supplier_segment: data.supplier_segment || null,
        supplier_source: data.supplier_source || null,
        // Notlar
        notes: data.notes || null,
        // İlk yetkili kişi pozisyonu
        first_contact_position: data.first_contact_position || null,
        // E-Belge Tipi
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
        // Add new supplier - add company_id to sanitized data
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug('Form gönderiliyor:', formData);
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      logger.error('Form submission error:', error);
    }
  };

  return {
    id,
    formData,
    setFormData,
    isLoadingSupplier,
    supplierError,
    mutation,
    handleSubmit,
    navigate
  };
};

