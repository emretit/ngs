import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupplierFormData } from "@/types/supplier";

export const useSupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  });

  const { data: supplier, isLoading: isLoadingSupplier, error: supplierError } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) {
        console.log('No ID provided, skipping supplier fetch');
        return null;
      }
      
      console.log('🔍 Fetching supplier data for ID:', id);
      
      // Önce company_id'yi al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        console.error('❌ No company_id found for user');
        throw new Error('Şirket bilgisi bulunamadı');
      }
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching supplier:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No supplier found with ID:', id);
        throw new Error('Tedarikçi bulunamadı');
      }

      console.log('✅ Retrieved supplier data:', data);
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (supplier) {
      console.log('📝 Setting form data with supplier:', supplier);
      console.log('📋 Supplier name:', supplier.name);
      console.log('📋 Supplier company:', supplier.company);
      
      // City ve district için string'den ID'ye çevirme fonksiyonu
      const resolveCityId = async (cityName: string | null): Promise<string> => {
        if (!cityName) return "";
        try {
          // Önce city_id varsa onu kullan
          if ((supplier as any).city_id) {
            return (supplier as any).city_id.toString();
          }
          // Yoksa city name'den ID bul (turkey_cities tablosunu kullan)
          const { data } = await supabase
            .from('turkey_cities')
            .select('id')
            .ilike('name', `%${cityName}%`)
            .maybeSingle();
          return data?.id?.toString() || "";
        } catch (error) {
          console.error('Error resolving city ID:', error);
          return "";
        }
      };

      const resolveDistrictId = async (districtName: string | null, cityId: string): Promise<string> => {
        if (!districtName || !cityId) return "";
        try {
          // Önce district_id varsa onu kullan
          if ((supplier as any).district_id) {
            return (supplier as any).district_id.toString();
          }
          // Yoksa district name ve city_id'den ID bul (turkey_districts tablosunu kullan)
          const { data } = await supabase
            .from('turkey_districts')
            .select('id')
            .ilike('name', `%${districtName}%`)
            .eq('city_id', parseInt(cityId))
            .maybeSingle();
          return data?.id?.toString() || "";
        } catch (error) {
          console.error('Error resolving district ID:', error);
          return "";
        }
      };

      // Async olarak city ve district ID'lerini çöz
      const loadFormData = async () => {
        // Önce city_id varsa onu kullan, yoksa string'den ID bul
        let cityId = "";
        if ((supplier as any).city_id) {
          cityId = (supplier as any).city_id.toString();
          console.log('✅ Using city_id from database:', cityId);
        } else if (supplier.city) {
          cityId = await resolveCityId(supplier.city);
          console.log('✅ Resolved city ID from string:', supplier.city, '→', cityId);
        }
        
        // Önce district_id varsa onu kullan, yoksa string'den ID bul
        let districtId = "";
        if ((supplier as any).district_id) {
          districtId = (supplier as any).district_id.toString();
          console.log('✅ Using district_id from database:', districtId);
        } else if (supplier.district && cityId) {
          districtId = await resolveDistrictId(supplier.district, cityId);
          console.log('✅ Resolved district ID from string:', supplier.district, '→', districtId);
        }
        
        // İkinci adres için aynı mantık
        let secondCityId = "";
        if ((supplier as any).second_city_id) {
          secondCityId = (supplier as any).second_city_id.toString();
        } else if (supplier.second_city) {
          secondCityId = await resolveCityId(supplier.second_city);
        }
        
        let secondDistrictId = "";
        if ((supplier as any).second_district_id) {
          secondDistrictId = (supplier as any).second_district_id.toString();
        } else if (supplier.second_district && secondCityId) {
          secondDistrictId = await resolveDistrictId(supplier.second_district, secondCityId);
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
          city: cityId || supplier.city || "",
          district: districtId || supplier.district || "",
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
          second_city: secondCityId || supplier.second_city || "",
          second_district: secondDistrictId || supplier.second_district || "",
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
        };

        console.log('📝 New form data created:', newFormData);
        setFormData(newFormData);
        console.log('✅ Form data set successfully');
      };

      loadFormData();
    } else {
      console.log('⚠️ No supplier data available to set');
    }
  }, [supplier]);

  useEffect(() => {
    if (supplierError) {
      toast({
        title: "Hata",
        description: "Tedarikçi bilgileri yüklenemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      navigate('/suppliers');
    }
  }, [supplierError, navigate, toast]);

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      // City ve district ID'lerini integer'a çevir
      const cityId = data.city ? parseInt(data.city) : null;
      const districtId = data.district ? parseInt(data.district) : null;
      const secondCityId = data.second_city ? parseInt(data.second_city) : null;
      const secondDistrictId = data.second_district ? parseInt(data.second_district) : null;

      // City ve district string isimlerini al (eğer ID değilse)
      let cityName: string | null = null;
      let districtName: string | null = null;
      let secondCityName: string | null = null;
      let secondDistrictName: string | null = null;

      if (data.city && !cityId) {
        cityName = data.city;
      }
      if (data.district && !districtId) {
        districtName = data.district;
      }
      if (data.second_city && !secondCityId) {
        secondCityName = data.second_city;
      }
      if (data.second_district && !secondDistrictId) {
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
        tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
        tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
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
        console.log('Updating supplier data:', sanitizedData);
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(sanitizedData)
          .eq('id', id);
        if (updateError) {
          console.error('Güncelleme hatası:', updateError);
          throw updateError;
        }
        const { data: updatedData, error: fetchError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (fetchError) {
          console.error('Veri getirme hatası:', fetchError);
          throw fetchError;
        }
        if (!updatedData) {
          console.error('Güncellenmiş veri bulunamadı');
          throw new Error('Güncellenmiş tedarikçi bulunamadı');
        }
        return updatedData;
      } else {
        // Add new supplier - add company_id to sanitized data
        const dataWithCompanyId = { ...sanitizedData, company_id };
        console.log('Inserting supplier data:', dataWithCompanyId);
        const { data: newData, error } = await supabase
          .from('suppliers')
          .insert([dataWithCompanyId])
          .select()
          .maybeSingle();
        if (error) {
          console.error('Ekleme hatası:', error);
          throw error;
        }
        if (!newData) {
          console.error('Yeni eklenen veri bulunamadı');
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
      toast({
        title: id ? "Tedarikçi güncellendi" : "Tedarikçi eklendi",
        description: id ? "Tedarikçi bilgileri başarıyla güncellendi." : "Yeni tedarikçi başarıyla eklendi.",
      });
      navigate('/suppliers');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form gönderiliyor:', formData);
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
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

