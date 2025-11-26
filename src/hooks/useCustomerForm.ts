
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";

export const useCustomerForm = (einvoiceMukellefData?: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  });

  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) {
        console.log('No ID provided, skipping customer fetch');
        return null;
      }
      
      console.log('🔍 Fetching customer data for ID:', id);
      
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
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching customer:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No customer found with ID:', id);
        throw new Error('Müşteri bulunamadı');
      }

      console.log('✅ Retrieved customer data:', data);
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (customer) {
      console.log('📝 Setting form data with customer:', customer);
      console.log('📋 Customer name:', customer.name);
      console.log('📋 Customer company:', customer.company);
      
      // City ve district için string'den ID'ye çevirme fonksiyonu
      const resolveCityId = async (cityName: string | null): Promise<string> => {
        if (!cityName) return "";
        try {
          // Önce city_id varsa onu kullan
          if ((customer as any).city_id) {
            return (customer as any).city_id.toString();
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
          if ((customer as any).district_id) {
            return (customer as any).district_id.toString();
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
        if ((customer as any).city_id) {
          cityId = (customer as any).city_id.toString();
          console.log('✅ Using city_id from database:', cityId);
        } else if (customer.city) {
          cityId = await resolveCityId(customer.city);
          console.log('✅ Resolved city ID from string:', customer.city, '→', cityId);
        }
        
        // Önce district_id varsa onu kullan, yoksa string'den ID bul
        let districtId = "";
        if ((customer as any).district_id) {
          districtId = (customer as any).district_id.toString();
          console.log('✅ Using district_id from database:', districtId);
        } else if (customer.district && cityId) {
          districtId = await resolveDistrictId(customer.district, cityId);
          console.log('✅ Resolved district ID from string:', customer.district, '→', districtId);
        }
        
        // İkinci adres için aynı mantık
        let secondCityId = "";
        if ((customer as any).second_city_id) {
          secondCityId = (customer as any).second_city_id.toString();
        } else if (customer.second_city) {
          secondCityId = await resolveCityId(customer.second_city);
        }
        
        let secondDistrictId = "";
        if ((customer as any).second_district_id) {
          secondDistrictId = (customer as any).second_district_id.toString();
        } else if (customer.second_district && secondCityId) {
          secondDistrictId = await resolveDistrictId(customer.second_district, secondCityId);
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
          city: cityId || customer.city || customer.einvoice_city || "",
          district: districtId || customer.district || customer.einvoice_district || "",
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
          second_city: secondCityId || customer.second_city || "",
          second_district: secondDistrictId || customer.second_district || "",
          second_country: customer.second_country ?? "",
          second_postal_code: customer.second_postal_code ?? "",
          payment_terms: customer.payment_terms ?? "",
        };
        
        console.log('📝 New form data created:', newFormData);
        setFormData(newFormData);
        console.log('✅ Form data set successfully');
      };

      loadFormData();
    } else {
      console.log('⚠️ No customer data available to set');
    }
  }, [customer]);

  useEffect(() => {
    if (customerError) {
      toast({
        title: "Hata",
        description: "Müşteri bilgileri yüklenemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      navigate('/customers');
    }
  }, [customerError, navigate, toast]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
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
        is_einvoice_mukellef: einvoiceMukellefData?.isEinvoiceMukellef || false,
        einvoice_alias_name: einvoiceMukellefData?.data?.aliasName || null,
        einvoice_company_name: einvoiceMukellefData?.data?.companyName || null,
        einvoice_tax_office: einvoiceMukellefData?.data?.taxOffice || null,
        einvoice_address: einvoiceMukellefData?.data?.address || null,
        einvoice_city: einvoiceMukellefData?.data?.city || null,
        einvoice_district: einvoiceMukellefData?.data?.district || null,
        einvoice_mersis_no: einvoiceMukellefData?.data?.mersisNo || null,
        einvoice_sicil_no: einvoiceMukellefData?.data?.sicilNo || null,
        einvoice_checked_at: einvoiceMukellefData?.isEinvoiceMukellef ? new Date().toISOString() : null,
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
        console.log('Updating data:', sanitizedData);
        const { error: updateError } = await supabase
          .from('customers')
          .update(sanitizedData)
          .eq('id', id);
        
        if (updateError) {
          console.error('Update error:', updateError);
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

        console.log('Updated data:', updatedData);
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

        console.log('New data:', newData);
        return newData;
      }
    },
    onSuccess: (data) => {
      console.log('Operation successful, returned data:', data);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
      }

      toast({
        title: id ? "Müşteri güncellendi" : "Müşteri eklendi",
        description: id ? "Müşteri bilgileri başarıyla güncellendi." : "Yeni müşteri başarıyla eklendi.",
      });

      navigate('/customers');
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
    console.log('Submitting form:', formData);
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
