
import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactHeader } from "@/components/customers/details/ContactHeader";
import { ContactTabs } from "@/components/customers/details/ContactTabs";
import { EditableCustomerDetails } from "@/components/customers/details/EditableCustomerDetails";
import { ContactInfo } from "@/components/customers/details/ContactInfo";

import { Customer } from "@/types/customer";

interface ContactDetailsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ContactDetails = ({ isCollapsed, setIsCollapsed }: ContactDetailsProps) => {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
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
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSuccess = async () => {
    setIsEditing(false);
    await refetch();
  };

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer);
  };

  const currentCustomer = customer || fetchedCustomer;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
          <TopBar />
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
                <span className="text-gray-600">Müşteri bilgileri yükleniyor...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
          <TopBar />
          <div className="p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteri bulunamadı</h2>
              <p className="text-gray-600">Bu müşteri mevcut değil veya silinmiş olabilir.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <TopBar />
        
        {isEditing ? (
          <div className="p-8">
            <EditableCustomerDetails 
              customer={currentCustomer} 
              onCancel={handleCancel} 
              onSuccess={handleSuccess}
            />
          </div>
        ) : (
          <>
            <ContactHeader 
              customer={currentCustomer} 
              id={id || ''} 
              onEdit={handleEdit}
              onUpdate={handleCustomerUpdate}
            />
            <div className="p-1">
              <div className="max-w-7xl mx-auto space-y-1">
                {/* Ultra compact general information */}
                <ContactInfo 
                  customer={currentCustomer} 
                  onUpdate={handleCustomerUpdate} 
                />
                
                {/* Tabs Section - More prominent */}
                <ContactTabs customer={currentCustomer} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ContactDetails;
