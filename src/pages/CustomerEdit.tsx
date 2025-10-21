import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";
import CustomerFormHeader from "@/components/customers/CustomerFormHeader";
import CustomerFormContent from "@/components/customers/CustomerFormContent";
const CustomerEdit = () => {
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
  });
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Müşteri ID\'si bulunamadı');
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }
      return data;
    },
  });
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        mobile_phone: customer.mobile_phone || "",
        office_phone: customer.office_phone || "",
        company: customer.company || "",
        type: customer.type,
        status: customer.status,
        representative: customer.representative || "",
        balance: customer.balance || 0,
        address: customer.address || "",
        tax_number: customer.tax_number || "",
        tax_office: customer.tax_office || "",
        city: customer.city || customer.einvoice_city || "",
        district: customer.district || customer.einvoice_district || "",
        einvoice_alias_name: customer.einvoice_alias_name || "",
        website: customer.website || "",
        country: customer.country || "",
        postal_code: customer.postal_code || "",
        fax: customer.fax || "",
        bank_name: customer.bank_name || "",
        iban: customer.iban || "",
        account_number: customer.account_number || "",
        trade_registry_number: customer.trade_registry_number || "",
        mersis_number: customer.mersis_number || "",
        establishment_date: customer.establishment_date || "",
        sector: customer.sector || "",
        customer_segment: customer.customer_segment || "",
        customer_source: customer.customer_source || "",
        notes: customer.notes || "",
        first_contact_position: customer.first_contact_position || "",
        second_contact_name: customer.second_contact_name || "",
        second_contact_email: customer.second_contact_email || "",
        second_contact_phone: customer.second_contact_phone || "",
        second_contact_position: customer.second_contact_position || "",
        second_address: customer.second_address || "",
        second_city: customer.second_city || "",
        second_district: customer.second_district || "",
        second_country: customer.second_country || "",
        second_postal_code: customer.second_postal_code || "",
      });
    }
  }, [customer]);
  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!id) throw new Error('Müşteri ID\'si bulunamadı');
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
        website: data.website || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        fax: data.fax || null,
        bank_name: data.bank_name || null,
        iban: data.iban || null,
        account_number: data.account_number || null,
        tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
        tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
        city: data.city || null,
        district: data.district || null,
        einvoice_alias_name: data.einvoice_alias_name || null,
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
        second_city: data.second_city || null,
        second_district: data.second_district || null,
        second_country: data.second_country || null,
        second_postal_code: data.second_postal_code || null,
      };
      const { error } = await supabase
        .from('customers')
        .update(sanitizedData)
        .eq('id', id);
      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast({
        title: "Başarılı",
        description: "Müşteri bilgileri güncellendi.",
      });
      navigate('/contacts');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Hata",
        description: "Müşteri güncellenirken bir hata oluştu.",
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
  if (isLoadingCustomer) {
    return (
    <div className="text-center py-8">Müşteri bilgileri yükleniyor...</div>
  );
  }
  return (
    <>
      <CustomerFormHeader id={id} />
      <CustomerFormContent
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isPending={mutation.isPending}
        isEdit={true}
        onCancel={() => navigate('/contacts')}
      />
    </>
  );
};
export default CustomerEdit;
