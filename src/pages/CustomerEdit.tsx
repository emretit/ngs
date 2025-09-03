
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFormData } from "@/types/customer";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import CustomerFormHeader from "@/components/customers/CustomerFormHeader";
import CustomerFormContent from "@/components/customers/CustomerFormContent";

interface CustomerEditProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CustomerEdit = ({ isCollapsed, setIsCollapsed }: CustomerEditProps) => {
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
        city: customer.einvoice_city || "",
        district: customer.einvoice_district || "",
        einvoice_alias_name: customer.einvoice_alias_name || "",
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!id) throw new Error('Müşteri ID\'si bulunamadı');

      const { error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          email: data.email || null,
          mobile_phone: data.mobile_phone || null,
          office_phone: data.office_phone || null,
          company: data.company || null,
          type: data.type,
          status: data.status,
          representative: data.representative || null,
          address: data.address || null,
          tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
          tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
        })
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
      <div className="min-h-screen bg-white flex relative">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}>
          <TopBar />
          <div className="p-2 sm:p-4">
            <div className="text-center py-8">Yükleniyor...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <TopBar />
        <div className="p-2 sm:p-4">
          <CustomerFormHeader id={id} />

          <CustomerFormContent 
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            isPending={mutation.isPending}
            isEdit={true}
            onCancel={() => navigate('/contacts')}
          />
        </div>
      </main>
    </div>
  );
};

export default CustomerEdit;
