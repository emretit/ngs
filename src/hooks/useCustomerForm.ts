
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
      if (!id) return null;
      console.log('Fetching customer data for ID:', id);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }

      if (!data) {
        console.error('No customer found with ID:', id);
        throw new Error('Müşteri bulunamadı');
      }

      console.log('Retrieved customer data:', data);
      return data;
    },
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (customer) {
      console.log('Setting form data with customer:', customer);
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
        city: customer.city || "",
        district: customer.district || "",
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
        payment_terms: customer.payment_terms || "",
      });
    }
  }, [customer]);

  useEffect(() => {
    if (customerError) {
      toast({
        title: "Hata",
        description: "Müşteri bilgileri yüklenemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      navigate('/contacts');
    }
  }, [customerError, navigate, toast]);

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
        // Add new customer
        const { data: newData, error } = await supabase
          .from('customers')
          .insert([sanitizedData])
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

      navigate('/contacts');
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
