import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SupplierFormHeader from "@/components/suppliers/SupplierFormHeader";
import SupplierFormContent from "@/components/suppliers/SupplierFormContent";
import { SupplierFormData } from "@/types/supplier";
const SupplierForm = () => {
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
      if (!id) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching supplier:', error);
        throw error;
      }
      if (!data) {
        throw new Error('Tedarikçi bulunamadı');
      }
      return data;
    },
    enabled: !!id,
    retry: false,
  });
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        email: supplier.email || "",
        mobile_phone: supplier.mobile_phone || "",
        office_phone: supplier.office_phone || "",
        company: supplier.company || "",
        type: supplier.type,
        status: supplier.status,
        representative: supplier.representative || "",
        balance: supplier.balance || 0,
        address: supplier.address || "",
        tax_number: supplier.tax_number || "",
        tax_office: supplier.tax_office || "",
        city: supplier.city || "",
        district: supplier.district || "",
        country: supplier.country || "",
        postal_code: supplier.postal_code || "",
        fax: supplier.fax || "",
        website: supplier.website || "",
        is_active: supplier.is_active ?? true,
        payee_financial_account_id: supplier.payee_financial_account_id || "",
        payment_means_channel_code: supplier.payment_means_channel_code || "",
        payment_means_code: supplier.payment_means_code || "",
        aliases: supplier.aliases || [],
        einvoice_alias_name: supplier.einvoice_alias_name || "",
        // İkinci yetkili kişi bilgileri
        second_contact_name: supplier.second_contact_name || "",
        second_contact_email: supplier.second_contact_email || "",
        second_contact_phone: supplier.second_contact_phone || "",
        second_contact_position: supplier.second_contact_position || "",
        // İkinci adres bilgileri
        second_address: supplier.second_address || "",
        second_city: supplier.second_city || "",
        second_district: supplier.second_district || "",
        second_country: supplier.second_country || "",
        second_postal_code: supplier.second_postal_code || "",
        // Finansal bilgiler
        bank_name: supplier.bank_name || "",
        iban: supplier.iban || "",
        account_number: supplier.account_number || "",
        payment_terms: supplier.payment_terms || "",
        // Şirket detay bilgileri
        trade_registry_number: supplier.trade_registry_number || "",
        mersis_number: supplier.mersis_number || "",
        establishment_date: supplier.establishment_date || "",
        sector: supplier.sector || "",
        supplier_segment: supplier.supplier_segment || "",
        supplier_source: supplier.supplier_source || "",
        // Notlar
        notes: supplier.notes || "",
        // İlk yetkili kişi pozisyonu
        first_contact_position: supplier.first_contact_position || "",
      });
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
        tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
        tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
        city: data.city || null,
        district: data.district || null,
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
        // İkinci yetkili kişi bilgileri
        second_contact_name: data.second_contact_name || null,
        second_contact_email: data.second_contact_email || null,
        second_contact_phone: data.second_contact_phone || null,
        second_contact_position: data.second_contact_position || null,
        // İkinci adres bilgileri
        second_address: data.second_address || null,
        second_city: data.second_city || null,
        second_district: data.second_district || null,
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
      if (id) {
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
        const { data: newData, error } = await supabase
          .from('suppliers')
          .insert([sanitizedData])
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
  return (
    <>
      <SupplierFormHeader id={id} />
      {isLoadingSupplier && id ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <SupplierFormContent
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isPending={mutation.isPending}
          isEdit={!!id}
          onCancel={() => navigate('/suppliers')}
        />
      )}
    </>
  );
};
export default SupplierForm;