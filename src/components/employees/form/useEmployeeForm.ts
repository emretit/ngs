
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toastUtils";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { useQueryClient } from "@tanstack/react-query";

export const useEmployeeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (data: Partial<Employee>) => {
    setIsSubmitting(true);
    try {
      const employeeData = {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        position: data.position || "",
        department: data.department || "",
        hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        status: data.status || "aktif",
        phone: data.phone || null,
        avatar_url: data.avatar_url || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        marital_status: data.marital_status || null,
        address: data.address || null,
        country: data.country || null,
        city: data.city || null,
        district: data.district || null,
        postal_code: data.postal_code || null,
        id_ssn: data.id_ssn || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relation: data.emergency_contact_relation || null
      };

      const { error, data: newEmployee } = await supabase
        .from("employees")
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;

      showSuccess("Çalışan başarıyla oluşturuldu");

      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: ['employees'] });

      if (newEmployee?.id) {
        navigate(`/employees/${newEmployee.id}`);
      } else {
        navigate("/employees");
      }
    } catch (error) {
      console.error("Error submitting employee form:", error);
      showError("Çalışan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Employee>) => {
    setIsSubmitting(true);
    try {
      // Create a properly typed object for update
      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        position: data.position,
        department: data.department,
        hire_date: data.hire_date,
        // Fix the status type comparison
        status: String(data.status) === 'active' ? 'aktif' : 
                String(data.status) === 'inactive' ? 'pasif' : 
                data.status,
        phone: data.phone,
        avatar_url: data.avatar_url,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        marital_status: data.marital_status,
        address: data.address,
        country: data.country,
        city: data.city,
        district: data.district,
        postal_code: data.postal_code,
        id_ssn: data.id_ssn,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        emergency_contact_relation: data.emergency_contact_relation
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      const { error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      showSuccess("Çalışan bilgileri güncellendi");

      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      navigate(`/employees/${id}`);
    } catch (error) {
      console.error("Error updating employee:", error);
      showError("Çalışan güncellenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
    handleUpdate
  };
};
