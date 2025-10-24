import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { FormProvider, useForm } from "react-hook-form";

interface CustomerInfoCardProps {
  data: {
    customer_id?: string;
    contact_name?: string;
    prepared_by?: string;
    employee_id?: string;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  required?: boolean;
}

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  data,
  onChange,
  errors = {},
  required = false
}) => {
  // Form object for FormProvider
  const form = useForm({
    defaultValues: {
      customer_id: data.customer_id || '',
      contact_name: data.contact_name || '',
      prepared_by: data.prepared_by || '',
      employee_id: data.employee_id || '',
    }
  });

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          Müşteri Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
        <FormProvider {...form}>
          <div className="grid grid-cols-1 gap-3">
            <ProposalPartnerSelect 
              partnerType="customer" 
              required={required} 
            />
            <ContactPersonInput
              value={data.contact_name}
              onChange={(value) => onChange('contact_name', value)}
              customerId={data.customer_id}
              error={errors.contact_name || ""}
              required={required}
            />
            <div>
              <EmployeeSelector
                value={data.prepared_by || ""}
                onChange={(value) => {
                  onChange('prepared_by', value);
                  onChange('employee_id', value);
                }}
                error={errors.prepared_by || ""}
              />
            </div>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard;
