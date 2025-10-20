import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Employee } from "@/types/employee";
import { useEmployeeForm } from "./hooks/useEmployeeForm";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { AddressSection } from "./sections/AddressSection";
import { EmergencyContactSection } from "./sections/EmergencyContactSection";
import { SalarySection } from "./sections/SalarySection";
import { DocumentUploadSection } from "./sections/DocumentUploadSection";

interface EmployeeEditFormProps {
  employee: Employee;
  onCancel: () => void;
  onSuccess: () => void;
}

export const EmployeeEditForm = ({
  employee,
  onCancel,
  onSuccess,
}: EmployeeEditFormProps) => {
  const form = useEmployeeForm(employee);
  const { isSaving, handleSubmit } = useEmployeeSubmit(employee.id);
  const [documents, setDocuments] = useState<File[]>([]);

  const onSubmit = (values: any) => {
    handleSubmit(values, onSuccess);
  };

  return (
    <Form {...form}>
      <form id="employee-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Temel Bilgiler */}
        <BasicInfoSection control={form.control} />

        {/* Kişisel Bilgiler ve Adres, Maaş Bilgileri ve Acil Durum İletişim */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <AddressSection control={form.control} />
          <div className="space-y-4">
            <SalarySection control={form.control} />
            <EmergencyContactSection control={form.control} />
          </div>
        </div>

        {/* Özlük Dosyaları */}
        <DocumentUploadSection 
          onDocumentsChange={setDocuments}
        />
      </form>
    </Form>
  );
};
