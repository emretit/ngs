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

export const useEmployeeSubmit = (employeeId?: string, userId?: string | null) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (
    values: EmployeeFormValues & { _linkUserId?: string | null },
    documents: DocumentFile[] = [],
    onSuccess?: () => void
  ) => {
    console.log("🔵 [useEmployeeSubmit] handleSubmit başladı", {
      employeeId,
      userId,
      user_roles: values.user_roles,
      _linkUserId: values._linkUserId,
      valuesKeys: Object.keys(values)
    });

    try {
      setIsSaving(true);

      // Calculate total employer cost automatically
      const netSalary = parseFloat(values.net_salary?.toString() || '0') || 0;
      const sgkCost = parseFloat(values.manual_employer_sgk_cost?.toString() || '0') || 0;
      const mealAllowance = parseFloat(values.meal_allowance?.toString() || '0') || 0;
      const transportAllowance = parseFloat(values.transport_allowance?.toString() || '0') || 0;
      
      const totalEmployerCost = netSalary + sgkCost + mealAllowance + transportAllowance;

      // Extract link user id from values
      const linkUserId = values._linkUserId;
      console.log("🔵 [useEmployeeSubmit] linkUserId:", linkUserId);

      // Sanitize empty inputs and map field names
      // Remove fields that don't exist in the employees table
      const { user_roles, _linkUserId, ...restValues } = values;
      
      // Determine the user_id to save
      const userIdToSave = linkUserId || userId;
      console.log("🔵 [useEmployeeSubmit] userIdToSave:", userIdToSave, "user_roles:", user_roles);
      
      const dbValues = sanitizeEmployeeValues({
        ...restValues,
        salary_notes: values.notes, // Map notes to salary_notes
        notes: undefined, // Remove notes field
        total_employer_cost: totalEmployerCost, // Auto-calculate total cost
        user_id: userIdToSave, // Link to user if specified
      });

      console.log("🔵 [useEmployeeSubmit] Employee update başlıyor...", { employeeId, dbValuesKeys: Object.keys(dbValues) });
      const { error } = await supabase
        .from("employees")
        .update(dbValues)
        .eq("id", employeeId);

      if (error) {
        console.error("❌ [useEmployeeSubmit] Employee update hatası:", error);
        throw error;
      }
      console.log("✅ [useEmployeeSubmit] Employee update başarılı");

      // If linking to a new user, also update the profile's employee_id (bidirectional)
      if (linkUserId && employeeId) {
        try {
          await supabase
            .from("profiles")
            .update({ employee_id: employeeId })
            .eq("id", linkUserId);
        } catch (linkError) {
          console.error("Error linking profile to employee:", linkError);
        }
      }

      // Save user roles to user_roles table if userId exists
      const effectiveUserId = userIdToSave;
      console.log("🔵 [useEmployeeSubmit] Rol kaydetme kontrolü:", {
        effectiveUserId,
        user_roles,
        user_rolesLength: user_roles?.length,
        hasRoles: user_roles && user_roles.length > 0
      });

      if (effectiveUserId && user_roles && user_roles.length > 0) {
        try {
          console.log("🔵 [useEmployeeSubmit] Roller kaydediliyor...");
          // Get company_id
          const { data: companyData, error: companyError } = await supabase.rpc('current_company_id');
          
          if (companyError) {
            console.error("❌ [useEmployeeSubmit] Company ID alınamadı:", companyError);
            throw new Error(`Şirket bilgisi alınamadı: ${companyError.message}`);
          }

          const companyId = companyData;
          console.log("🔵 [useEmployeeSubmit] Company ID:", companyId);

          if (!companyId) {
            console.error("❌ [useEmployeeSubmit] Company ID boş!");
            showError("Şirket bilgisi bulunamadı. Roller kaydedilemedi.");
            throw new Error("Şirket bilgisi bulunamadı");
          }

          // First, delete existing role assignments for this user
          console.log("🔵 [useEmployeeSubmit] Eski roller siliniyor...", { effectiveUserId });
          const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', effectiveUserId);

          if (deleteError) {
            console.error("❌ [useEmployeeSubmit] Eski roller silinirken hata:", deleteError);
            throw deleteError;
          }
          console.log("✅ [useEmployeeSubmit] Eski roller silindi");

          // Insert new role assignments
          // user_roles contains role IDs
          console.log("🔵 [useEmployeeSubmit] Yeni roller ekleniyor...", { user_roles });
          for (const roleId of user_roles) {
            console.log("🔵 [useEmployeeSubmit] Rol ekleniyor:", { roleId, effectiveUserId, companyId });
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: effectiveUserId, // FIX: userId yerine effectiveUserId kullan
                role_id: roleId,
                company_id: companyId,
                role: 'member' // Default enum value
              });

            if (insertError) {
              console.error("❌ [useEmployeeSubmit] Rol eklenirken hata:", insertError, { roleId, effectiveUserId, companyId });
              throw insertError;
            }
            console.log("✅ [useEmployeeSubmit] Rol eklendi:", roleId);
          }
          console.log("✅ [useEmployeeSubmit] Tüm roller başarıyla kaydedildi");
        } catch (roleError: any) {
          console.error("❌ [useEmployeeSubmit] Rol kaydetme hatası:", roleError);
          showError(`Roller kaydedilirken hata oluştu: ${roleError?.message || roleError}`);
          throw roleError; // Hata fırlat ki kullanıcı görsün
        }
      } else {
        console.log("⚠️ [useEmployeeSubmit] Rol kaydedilmedi:", {
          reason: !effectiveUserId ? "userId yok" : !user_roles || user_roles.length === 0 ? "rol yok" : "bilinmeyen",
          effectiveUserId,
          user_roles
        });
      }

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

      console.log("✅ [useEmployeeSubmit] Tüm işlemler tamamlandı, onSuccess çağrılıyor");
      showSuccess("Çalışan bilgileri başarıyla güncellendi", { duration: 1000 });
      
      if (onSuccess) {
        console.log("🟢 [useEmployeeSubmit] onSuccess callback çağrılıyor");
        onSuccess();
      } else {
        console.warn("⚠️ [useEmployeeSubmit] onSuccess callback tanımlı değil!");
      }
    } catch (error: any) {
      console.error("❌ [useEmployeeSubmit] Çalışan güncellenirken hata:", error);
      showError(`Çalışan bilgileri güncellenirken bir hata oluştu: ${error?.message || error}`);
    } finally {
      console.log("🔵 [useEmployeeSubmit] finally bloğu - isSaving false yapılıyor");
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleSubmit,
  };
};
