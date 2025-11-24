import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SupplierFormData } from "@/types/supplier";
import SupplierFormHeader from "@/components/suppliers/SupplierFormHeader";
import SupplierFormContent from "@/components/suppliers/SupplierFormContent";
const SupplierNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
        // Yeni alanlar - şimdilik null olarak gönder, veritabanı güncellemesi gerekebilir
        bank_name: data.bank_name || null,
        iban: data.iban || null,
        account_number: data.account_number || null,
        trade_registry_number: data.trade_registry_number || null,
        mersis_number: data.mersis_number || null,
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
      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla eklendi.",
      });
      navigate('/suppliers');
    },
    onError: (error) => {
      console.error('Form submission error:', error);
      toast({
        title: "Hata",
        description: "Tedarikçi eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
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
