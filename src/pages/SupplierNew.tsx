import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SupplierFormData } from "@/types/supplier";
import SupplierFormHeader from "@/components/suppliers/SupplierFormHeader";
import SupplierFormContent from "@/components/suppliers/SupplierFormContent";
const SupplierNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
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
    apartment_number: "",
    unit_number: "",
    einvoice_document_type: "",
  });
  // URL parametrelerinden form verilerini doldur
  useEffect(() => {
    const name = searchParams.get('name');
    const tax_number = searchParams.get('tax_number');
    const type = searchParams.get('type') as 'bireysel' | 'kurumsal' | null;
    const status = searchParams.get('status') as 'aktif' | 'pasif' | 'potansiyel' | null;
    if (name || tax_number || type || status) {
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        tax_number: tax_number || prev.tax_number,
        type: type || prev.type,
        status: status || prev.status,
        company: name || prev.company, // E-faturadan gelen name'i company olarak da kullan
      }));
    }
  }, [searchParams]);
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
          cityId = parsedCityId;
        } else {
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
          districtId = parsedDistrictId;
        } else {
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

      const sanitizedData = {
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
        fax: data.fax || null,
        website: data.website || null,
        is_active: data.is_active,
        payee_financial_account_id: data.payee_financial_account_id || null,
        payment_means_channel_code: data.payment_means_channel_code || null,
        payment_means_code: data.payment_means_code || null,
        aliases: data.aliases.length > 0 ? data.aliases : null,
        einvoice_alias_name: data.einvoice_alias_name || null,
        // Yeni alanlar - şimdilik null olarak gönder, veritabanı güncellemesi gerekebilir
        bank_name: data.bank_name || null,
        iban: data.iban || null,
        account_number: data.account_number || null,
        trade_registry_number: data.trade_registry_number || null,
        mersis_number: data.mersis_number || null,
        establishment_date: data.establishment_date || null,
        sector: data.sector || null,
        supplier_segment: data.supplier_segment || null,
        supplier_source: data.supplier_source || null,
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
        apartment_number: data.apartment_number || null,
        unit_number: data.unit_number || null,
        einvoice_document_type: data.einvoice_document_type || null,
      };
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([sanitizedData])
        .select()
        .single();
      if (error) {
        console.error('Supplier add error:', error);
        throw error;
      }
      return newSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Tedarikçi başarıyla eklendi.");
      navigate('/suppliers');
    },
    onError: (error) => {
      console.error('Form submission error:', error);
      toast.error("Tedarikçi eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
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
  return (
    <div>
      <SupplierFormHeader
        isPending={mutation.isPending}
        onCancel={() => navigate('/suppliers')}
      />
      <SupplierFormContent
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isPending={mutation.isPending}
        isEdit={false}
        onCancel={() => navigate('/suppliers')}
      />
    </div>
  );
};
export default SupplierNew;
