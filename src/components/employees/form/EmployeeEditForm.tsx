import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Employee } from "@/types/employee";
import { useEmployeeForm } from "./hooks/useEmployeeForm";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";
import { PersonalInfoSectionEdit } from "./sections/PersonalInfoSectionEdit";
import { EmploymentSection } from "./sections/EmploymentSection";
import { AddressSectionEdit } from "./sections/AddressSectionEdit";
import { EmergencyContactSectionEdit } from "./sections/EmergencyContactSectionEdit";
import { FinancialSectionEdit } from "./sections/FinancialSectionEdit";
import { Separator } from "@/components/ui/separator";

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

  const onSubmit = (values: any) => {
    handleSubmit(values, onSuccess);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PersonalInfoSectionEdit control={form.control} />
        
        <Separator />
        
        <EmploymentSection control={form.control} />
        
        <Separator />
        
        <AddressSectionEdit control={form.control} />
        
        <Separator />
        
        <EmergencyContactSectionEdit control={form.control} />
        
        <Separator />
        
        <FinancialSectionEdit control={form.control} />

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
