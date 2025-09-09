
import { CustomerFormData } from "@/types/customer";

interface CompanyInformationProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const CompanyInformation = ({ formData, setFormData }: CompanyInformationProps) => {
  if (formData.type !== 'kurumsal') return null;

  return null;
};

export default CompanyInformation;
