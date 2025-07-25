
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";
import Navbar from "@/components/Navbar";
import CustomerFormHeader from "@/components/customers/CustomerFormHeader";
import CustomerFormContent from "@/components/customers/CustomerFormContent";

interface CustomerNewProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CustomerNew = ({ isCollapsed, setIsCollapsed }: CustomerNewProps) => {
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
    <div className="min-h-screen bg-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 p-4 sm:p-8 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <CustomerFormHeader />

        <CustomerFormContent 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isPending={mutation.isPending}
          isEdit={false}
          onCancel={() => navigate('/contacts')}
        />
      </main>
    </div>
  );
};

export default CustomerNew;
