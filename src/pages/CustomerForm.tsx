
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <CustomerFormHeader id={id} />

        {isLoadingCustomer && id ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <CustomerFormContent 
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            isPending={mutation.isPending}
            isEdit={!!id}
            onCancel={() => navigate('/contacts')}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerForm;
