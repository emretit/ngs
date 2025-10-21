import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";
import CustomerFormHeader from "@/components/customers/CustomerFormHeader";
import CustomerFormContent from "@/components/customers/CustomerFormContent";
import { useEinvoiceMukellefCheck } from "@/hooks/useEinvoiceMukellefCheck";
const CustomerNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { result: einvoiceResult } = useEinvoiceMukellefCheck();
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
  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
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
        is_einvoice_mukellef: einvoiceResult?.isEinvoiceMukellef || false,
        einvoice_alias_name: einvoiceResult?.data?.aliasName || null,
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
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([sanitizedData])
        .select()
        .single();
      if (error) {
        console.error('Customer add error:', error);
        throw error;
      }
      return newCustomer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla eklendi.",
      });
      navigate('/contacts');
    },
    onError: (error) => {
      console.error('Form submission error:', error);
      toast({
        title: "Hata",
        description: "Müşteri eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
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
      <CustomerFormHeader
        isPending={mutation.isPending}
        onCancel={() => navigate('/contacts')}
      />
      <CustomerFormContent 
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isPending={mutation.isPending}
        isEdit={false}
        onCancel={() => navigate('/contacts')}
      />
    </div>
  );
};
export default CustomerNew;
