import { useState, useEffect, useCallback } from "react";
import { Form } from "@/components/ui/form";
import { Employee } from "@/types/employee";
import { useEmployeeForm } from "./hooks/useEmployeeForm";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { AddressSection } from "./sections/AddressSection";
import { EmergencyContactSection } from "./sections/EmergencyContactSection";
import { SalarySection } from "./sections/SalarySection";
import { DocumentUploadSection, DocumentFile } from "./sections/DocumentUploadSection";
import { RoleSection } from "./sections/RoleSection";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  
  // State for user linking
  const [userLinkState, setUserLinkState] = useState<{
    userId: string | null;
    shouldLink: boolean;
  }>({
    userId: employee.user_id || null,
    shouldLink: !!employee.user_id,
  });

  // Get effective user_id (existing or newly linked)
  const effectiveUserId = userLinkState.shouldLink ? userLinkState.userId : employee.user_id;
  
  const { isSaving, handleSubmit } = useEmployeeSubmit(employee.id, effectiveUserId);

  // Fetch existing user roles
  const { data: existingRoles } = useQuery({
    queryKey: ['user-roles', employee.user_id],
    queryFn: async () => {
      if (!employee.user_id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', employee.user_id);
      
      if (error) throw error;
      return data?.map(r => r.role_id).filter(Boolean) || [];
    },
    enabled: !!employee.user_id,
  });

  // Set existing roles to form when loaded
  useEffect(() => {
    if (existingRoles && existingRoles.length > 0) {
      form.setValue('user_roles', existingRoles as string[]);
    }
  }, [existingRoles, form]);

  // Handle user link changes from RoleSection - memoized to prevent re-renders
  const handleUserLinkChange = useCallback((userId: string | null, shouldLink: boolean) => {
    setUserLinkState({ userId, shouldLink });
  }, []);

  const onSubmit = (values: any) => {
    console.log("🟢 [EmployeeEditForm] onSubmit çağrıldı", {
      values: {
        ...values,
        user_roles: values.user_roles,
      },
      userLinkState,
      documentsCount: documents.length
    });

    // Include linking info in submission
    const submitValues = {
      ...values,
      _linkUserId: userLinkState.shouldLink ? userLinkState.userId : null,
    };

    console.log("🟢 [EmployeeEditForm] submitValues:", {
      ...submitValues,
      user_roles: submitValues.user_roles,
      _linkUserId: submitValues._linkUserId
    });

    handleSubmit(submitValues, documents, onSuccess);
  };

  const onError = (errors: any) => {
    console.error("❌ [EmployeeEditForm] Form validation hataları:", errors);
    console.error("❌ [EmployeeEditForm] Form state:", form.getValues());
  };

  return (
    <Form {...form}>
      <form id="employee-edit-form" onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
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

        {/* Kullanıcı Yetkileri */}
        <RoleSection 
          control={form.control} 
          userId={employee.user_id}
          employeeId={employee.id}
          onUserLinkChange={handleUserLinkChange}
        />

        {/* Özlük Dosyaları */}
        <DocumentUploadSection 
          employeeId={employee.id}
          onDocumentsChange={setDocuments}
        />
      </form>
    </Form>
  );
};
