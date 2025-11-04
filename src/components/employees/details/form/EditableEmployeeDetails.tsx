
import { useState, useEffect } from "react";
import { Employee } from "@/types/employee";
import { useEditableEmployeeForm } from "@/hooks/useEditableEmployeeForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FormFields } from "./FormFields";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface EditableEmployeeDetailsProps {
  employee: Employee;
  onCancel: () => void;
  onSuccess: () => void;
}

export const EditableEmployeeDetails = ({
  employee,
  onCancel,
  onSuccess
}: EditableEmployeeDetailsProps) => {
  const { isEditing, isSaving, handleEdit, handleCancel, handleSave } = useEditableEmployeeForm({
    employee,
    onSuccess: () => {
      useToast().toast({
        title: "Başarılı",
        description: "Çalışan bilgileri başarıyla güncellendi"
      });
      onSuccess();
    }
  });

  const [formData, setFormData] = useState<Partial<Employee>>(employee);
  const [departments, setDepartments] = useState<{ name: string }[]>([]);
  const { userData } = useCurrentUser();

  // Fetch departments
  useEffect(() => {
    if (!userData?.company_id) return;
    
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('name')
        .eq('company_id', userData.company_id)
        .order('name');
      
      setDepartments(data || []);
    };

    fetchDepartments();
  }, [userData?.company_id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Çalışan Bilgilerini Düzenle</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button
              onClick={() => handleSave(formData)}
              disabled={isSaving}
            >
              {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </div>
        <FormFields 
          formData={formData}
          departments={departments}
          handleInputChange={handleInputChange}
          isEditing={true}
        />
      </div>
    </Card>
  );
};
