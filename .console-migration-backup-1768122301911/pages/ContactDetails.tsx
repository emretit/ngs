import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactHeader } from "@/components/customers/details/ContactHeader";
import { ContactTabs } from "@/components/customers/details/ContactTabs";
import { ContactInfo } from "@/components/customers/details/ContactInfo";
import { Customer } from "@/types/customer";
const ContactDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const { data: fetchedCustomer, isLoading, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }
      return data;
    },
    enabled: !!id,
  });
  const handleEdit = () => {
    navigate(`/customers/${id}/edit`);
  };
  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer);
  };
  const currentCustomer = customer || fetchedCustomer;
  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <span className="text-gray-600">Müşteri bilgileri yükleniyor...</span>
          </div>
        </div>
  );
  }
  if (!currentCustomer) {
    return (
    <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteri bulunamadı</h2>
          <p className="text-gray-600">Bu müşteri mevcut değil veya silinmiş olabilir.</p>
        </div>
  );
  }
  return (
    <>
      <ContactHeader
        customer={currentCustomer}
        id={id || ''}
        onEdit={handleEdit}
        onUpdate={handleCustomerUpdate}
      />
      <div className="space-y-4 mt-4">
        <ContactInfo
          customer={currentCustomer}
          onUpdate={handleCustomerUpdate}
        />
        <ContactTabs customer={currentCustomer} />
      </div>
    </>
  );
};
export default ContactDetails;
