import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { FormProvider, UseFormReturn, useForm } from "react-hook-form";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";

interface CustomerInfoCardProps {
  formData: {
    customer_id: string;
    contact_name: string;
    prepared_by: string;
    employee_id: string;
  };
  handleFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  form?: UseFormReturn<any>; // Ana form'u prop olarak al
}

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  formData,
  handleFieldChange,
  errors = {},
  form // Ana form'u prop olarak al
}) => {
  // Eğer form prop'u verilmişse onu kullan, yoksa kendi form'unu oluştur (backward compatibility)
  const localForm = useForm({
    defaultValues: {
      customer_id: formData.customer_id || '',
      contact_name: formData.contact_name || '',
      prepared_by: formData.prepared_by || '',
      employee_id: formData.employee_id || '',
    }
  });
  
  const formToUse = form || localForm;

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          Müşteri / Tedarikçi Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
        <FormProvider {...formToUse}>
          <div className="grid grid-cols-1 gap-3">
            <ProposalPartnerSelect partnerType="customer" placeholder="Müşteri veya Tedarikçi seçin..." required />
            <ContactPersonInput
              value={formData.contact_name}
              onChange={(value) => handleFieldChange('contact_name', value)}
              customerId={formData.customer_id}
              error={errors.contact_name || ""}
              required
            />
            {/* Müşteri Temsilcisi */}
            <EmployeeSelector
              value={formData.employee_id || ""}
              onChange={(value) => handleFieldChange('employee_id', value)}
              label="Müşteri Temsilcisi"
              placeholder="Müşteri temsilcisi seçin..."
              error={errors.employee_id || ""}
            />
            {/* Hazırlayan */}
              <EmployeeSelector
                value={formData.prepared_by || ""}
              onChange={(value) => handleFieldChange('prepared_by', value)}
              label="Hazırlayan"
              placeholder="Hazırlayan seçin..."
                error={errors.prepared_by || ""}
              />
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard;
