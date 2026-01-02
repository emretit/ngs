
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";
import { withErrorHandling } from "@/utils/supabaseErrorHandler";
import { logger } from "@/utils/logger";

export const useCustomerForm = (einvoiceMukellefData?: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CustomerFormData>({
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
    einvoice_alias_name: "",
    website: "",
    country: "",
    postal_code: "",
    apartment_number: "",
    unit_number: "",
    fax: "",
    bank_name: "",
    iban: "",
    account_number: "",
    trade_registry_number: "",
    mersis_number: "",
    establishment_date: "",
    sector: "",
    customer_segment: "",
    customer_source: "",
    notes: "",
    first_contact_position: "",
    second_contact_name: "",
    second_contact_email: "",
    second_contact_phone: "",
    second_contact_position: "",
    second_address: "",
    second_city: "",
    second_district: "",
    second_country: "",
    second_postal_code: "",
    payment_terms: "",
    is_einvoice_mukellef: false,
  });

  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      
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
          .from('customers')
          .select('*')
          .eq('id', id)
          .eq('company_id', companyId)
          .maybeSingle(),
        {
          operation: 'Müşteri bilgileri yükleme',
          table: 'customers',
          showToast: false, // React Query zaten error handling yapıyor
          logError: true
        }
      );

      if (!data) {
        throw new Error('Müşteri bulunamadı');
      }

      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (customer) {
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
          console.error('Error resolving city name:', error);
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
          console.error('Error resolving district name:', error);
          return "";
        }
      };

      // Async olarak city ve district isimlerini çöz
      const loadFormData = async () => {
        // İl için: ID varsa isim çöz, yoksa customer.city string'ini kullan
        let cityName = "";
        if ((customer as any).city_id) {
          cityName = await resolveCityName((customer as any).city_id);
        } else {
          cityName = customer.city || customer.einvoice_city || "";
        }
        
        // İlçe için: ID varsa isim çöz, yoksa customer.district string'ini kullan
        let districtName = "";
        if ((customer as any).district_id) {
          districtName = await resolveDistrictName((customer as any).district_id, (customer as any).city_id);
        } else {
          districtName = customer.district || customer.einvoice_district || "";
        }
        
        // İkinci adres için aynı mantık
        let secondCityName = "";
        if ((customer as any).second_city_id) {
          secondCityName = await resolveCityName((customer as any).second_city_id);
        } else {
          secondCityName = customer.second_city || "";
        }
        
        let secondDistrictName = "";
        if ((customer as any).second_district_id) {
          secondDistrictName = await resolveDistrictName((customer as any).second_district_id, (customer as any).second_city_id);
        } else {
          secondDistrictName = customer.second_district || "";
        }
        
        // Tüm alanları null-safe şekilde map et
        const newFormData: CustomerFormData = {
          name: customer.name ?? "",
          email: customer.email ?? "",
          mobile_phone: customer.mobile_phone ?? "",
          office_phone: customer.office_phone ?? "",
          company: customer.company ?? "",
          type: customer.type ?? "bireysel",
          status: customer.status ?? "potansiyel",
          representative: customer.representative ?? "",
          balance: customer.balance ?? 0,
          address: customer.address ?? "",
          tax_number: customer.tax_number ?? "",
          tax_office: customer.tax_office ?? "",
          city: cityName,
          district: districtName,
          einvoice_alias_name: customer.einvoice_alias_name ?? "",
          website: customer.website ?? "",
          country: customer.country ?? "",
          postal_code: customer.postal_code ?? "",
          apartment_number: customer.apartment_number ?? "",
          unit_number: customer.unit_number ?? "",
          fax: customer.fax ?? "",
          bank_name: customer.bank_name ?? "",
          iban: customer.iban ?? "",
          account_number: customer.account_number ?? "",
          trade_registry_number: customer.trade_registry_number ?? "",
          mersis_number: customer.mersis_number ?? "",
          establishment_date: customer.establishment_date ?? "",
          sector: customer.sector ?? "",
          customer_segment: customer.customer_segment ?? "",
          customer_source: customer.customer_source ?? "",
          notes: customer.notes ?? "",
          first_contact_position: customer.first_contact_position ?? "",
          second_contact_name: customer.second_contact_name ?? "",
          second_contact_email: customer.second_contact_email ?? "",
          second_contact_phone: customer.second_contact_phone ?? "",
          second_contact_position: customer.second_contact_position ?? "",
          second_address: customer.second_address ?? "",
          second_city: secondCityName,
          second_district: secondDistrictName,
          second_country: customer.second_country ?? "",
          second_postal_code: customer.second_postal_code ?? "",
          payment_terms: customer.payment_terms ?? "",
          is_einvoice_mukellef: customer.is_einvoice_mukellef ?? false,
          einvoice_document_type: (customer as any).einvoice_document_type ?? "",
        };
        
        setFormData(newFormData);
      };

      loadFormData();
    }
  }, [customer]);

  useEffect(() => {
    if (customerError) {
      toast.error("Müşteri bilgileri yüklenemedi. Lütfen tekrar deneyin.");
      navigate('/customers');
    }
  }, [customerError, navigate]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
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
        // E-fatura mükellefi bilgileri
        // Form data'dan gelen değeri öncelikli kullan (mukellefInfo bulunduğunda true olur)
        // Yoksa einvoiceMukellefData'dan al, yoksa false
        is_einvoice_mukellef: data.is_einvoice_mukellef ?? einvoiceMukellefData?.isEinvoiceMukellef ?? false,
        // Formdan gelen değeri öncelikli kullan, yoksa einvoiceMukellefData'dan al
        einvoice_alias_name: data.einvoice_alias_name || einvoiceMukellefData?.data?.aliasName || null,
        einvoice_company_name: einvoiceMukellefData?.data?.companyName || null,
        einvoice_tax_office: einvoiceMukellefData?.data?.taxOffice || null,
        einvoice_address: einvoiceMukellefData?.data?.address || null,
        einvoice_city: einvoiceMukellefData?.data?.city || null,
        einvoice_district: einvoiceMukellefData?.data?.district || null,
        einvoice_mersis_no: einvoiceMukellefData?.data?.mersisNo || null,
        einvoice_sicil_no: einvoiceMukellefData?.data?.sicilNo || null,
        einvoice_checked_at: einvoiceMukellefData?.isEinvoiceMukellef ? new Date().toISOString() : null,
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
        // Önce mevcut kaydı kontrol et
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id, company_id, name')
          .eq('id', id)
          .maybeSingle();
        
        if (checkError) {
          console.error('Mevcut kayıt kontrol hatası:', checkError);
        }
        
        // Company ID kontrolü
        if (existingCustomer?.company_id !== company_id) {
          throw new Error('Bu müşteriye erişim yetkiniz yok.');
        }
        
        // Company ID'yi sanitizedData'dan çıkar (güncelleme sırasında değiştirilmemeli)
        const { company_id: _, ...updateData } = sanitizedData;
        
        const { data: updateResult, error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', id)
          .eq('company_id', company_id) // RLS için ek kontrol
          .select();
        
        if (updateError) {
          console.error('Update hatası:', updateError);
          throw updateError;
        }

        const { data: updatedData, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        if (!updatedData) {
          console.error('Updated data not found');
          throw new Error('Updated customer not found');
        }

        return updatedData;
      } else {
        // Add new customer - add company_id to sanitized data
        const dataWithCompanyId = { ...sanitizedData, company_id };
        const { data: newData, error } = await supabase
          .from('customers')
          .insert([dataWithCompanyId])
          .select()
          .maybeSingle();
        
        if (error) {
          console.error('Add error:', error);
          throw error;
        }

        if (!newData) {
          console.error('New data not found');
          throw new Error('Customer could not be added');
        }

        return newData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
      }

      toast.success(id ? "Müşteri bilgileri başarıyla güncellendi." : "Yeni müşteri başarıyla eklendi.");

      navigate('/customers');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    isLoadingCustomer,
    customerError,
    mutation,
    handleSubmit,
    navigate
  };
};
