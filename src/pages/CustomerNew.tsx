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
        tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
        tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
        is_einvoice_mukellef: einvoiceResult?.isEinvoiceMukellef || false,
        einvoice_alias_name: einvoiceResult?.data?.aliasName || null,
        einvoice_company_name: einvoiceResult?.data?.companyName || null,
        einvoice_tax_office: einvoiceResult?.data?.taxOffice || null,
        einvoice_address: einvoiceResult?.data?.address || null,
        einvoice_city: einvoiceResult?.data?.city || null,
        einvoice_district: einvoiceResult?.data?.district || null,
        einvoice_mersis_no: einvoiceResult?.data?.mersisNo || null,
        einvoice_sicil_no: einvoiceResult?.data?.sicilNo || null,
        einvoice_checked_at: einvoiceResult?.isEinvoiceMukellef ? new Date().toISOString() : null,
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
    <CustomerFormHeader />
      <CustomerFormContent 
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isPending={mutation.isPending}
        isEdit={false}
        onCancel={() => navigate('/contacts')}
      />
  );
};
export default CustomerNew;
