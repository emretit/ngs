
import CustomerFormFields from "./CustomerFormFields";
import { CustomerFormData } from "@/types/customer";

interface CustomerFormContentProps {
  formData: CustomerFormData;
  setFormData: (data: CustomerFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

const CustomerFormContent = ({
  formData,
  setFormData,
  handleSubmit,
  isPending,
  isEdit,
  onCancel
}: CustomerFormContentProps) => {
  return (
    <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
      <CustomerFormFields formData={formData} setFormData={setFormData} isEdit={isEdit} />
    </form>
  );
};

export default CustomerFormContent;
