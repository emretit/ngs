import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { EmployeeFormValues } from "./useEmployeeForm";
import { DocumentFile } from "../sections/DocumentUploadSection";

const sanitizeEmployeeValues = (input: any) => {
  const dateFields = ['hire_date','date_of_birth','effective_date'];
  const sanitized: any = { ...input };

  // Normalize empty strings for known date fields to null
  dateFields.forEach((field) => {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  });

  // Also convert any other empty string values to null to avoid type errors
  Object.keys(sanitized).forEach((k) => {
    if (sanitized[k] === '') sanitized[k] = null;
  });

  return sanitized;
};

export const useEmployeeSubmit = (employeeId?: string) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (
    values: EmployeeFormValues,
    documents: DocumentFile[] = [],
    onSuccess?: () => void
  ) => {
    try {
      setIsSaving(true);

      // Calculate total employer cost automatically
      const netSalary = parseFloat(values.net_salary?.toString() || '0') || 0;
      const sgkCost = parseFloat(values.manual_employer_sgk_cost?.toString() || '0') || 0;
      const mealAllowance = parseFloat(values.meal_allowance?.toString() || '0') || 0;
      const transportAllowance = parseFloat(values.transport_allowance?.toString() || '0') || 0;
      
      const totalEmployerCost = netSalary + sgkCost + mealAllowance + transportAllowance;

      // Sanitize empty inputs and map field names
      const dbValues = sanitizeEmployeeValues({
        ...values,
        salary_notes: values.notes, // Map notes to salary_notes
        notes: undefined, // Remove notes field
        total_employer_cost: totalEmployerCost, // Auto-calculate total cost
      });

      const { error } = await supabase
        .from("employees")
        .update(dbValues)
        .eq("id", employeeId);

      if (error) throw error;

      // Upload documents if any
      if (documents.length > 0 && employeeId) {
        try {
          const documentPromises = documents.map(async (doc) => {
            if (doc.file) {
                  // Generate UUID for filename to avoid Turkish character issues
                  const { v4: uuidv4 } = await import('uuid');
                  const fileExtension = doc.name.split('.').pop();
                  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
                  
                  // Use UUID filename for storage, original for display
                  const fileName = `${employeeId}/${uniqueFileName}`;
              
              const { error: uploadError } = await supabase.storage
                .from('employee-documents')
                .upload(fileName, doc.file);

              if (uploadError) throw uploadError;

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('employee-documents')
                .getPublicUrl(fileName);

              // Save document record to database
              const { error: docError } = await supabase
                .from('employee_documents')
                .insert({
                  employee_id: employeeId,
                  document_type: doc.type, // Required field
                  file_name: doc.name, // Original filename for display
                  file_url: urlData.publicUrl, // Required field
                  name: doc.name, // Original filename for display
                  type: doc.type, // New field
                  size: doc.size, // New field
                  url: urlData.publicUrl, // New field
                  uploaded_at: new Date().toISOString(),
                  company_id: (await supabase.rpc('current_company_id')).data
                });

              if (docError) throw docError;
            }
          });

          await Promise.all(documentPromises);
        } catch (docError) {
          console.error("Error uploading documents:", docError);
          showError("Belgeler yüklenirken hata oluştu, ancak çalışan bilgileri güncellendi.");
        }
      }

      showSuccess("Çalışan bilgileri başarıyla güncellendi", { duration: 1000 });
      onSuccess?.();
    } catch (error) {
      console.error("Çalışan güncellenirken hata:", error);
      showError("Çalışan bilgileri güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleSubmit,
  };
};
