
import CustomerFormHeader from "@/components/customers/CustomerFormHeader";
import CustomerFormContent from "@/components/customers/CustomerFormContent";
import { useCustomerForm } from "@/hooks/useCustomerForm";

interface CustomerFormProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CustomerForm = ({ isCollapsed, setIsCollapsed }: CustomerFormProps) => {
  const {
    id,
    formData,
    setFormData,
    isLoadingCustomer,
    customerError,
    mutation,
    handleSubmit,
    navigate
  } = useCustomerForm();

  if (customerError) {
    return null;
  }

  // For edit mode, show loading if customer data hasn't loaded yet (name is empty means data not loaded)
  const isEditMode = !!id;
  const isDataLoading = isEditMode && isLoadingCustomer;
  const isWaitingForData = isEditMode && !isLoadingCustomer && !formData.name && !formData.company;

  return (
    <div>
      <CustomerFormHeader 
        id={id} 
        isPending={mutation.isPending}
        onCancel={() => navigate('/customers')}
      />

      {(isDataLoading || isWaitingForData) ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <span className="text-gray-600">Müşteri bilgileri yükleniyor...</span>
          </div>
        </div>
      ) : (
        <CustomerFormContent 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isPending={mutation.isPending}
          isEdit={isEditMode}
          onCancel={() => navigate('/customers')}
        />
      )}
    </div>
  );
};

export default CustomerForm;
