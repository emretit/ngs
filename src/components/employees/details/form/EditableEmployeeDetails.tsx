
import { useState, useEffect } from "react";
import { Employee } from "@/types/employee";
import { useEditableEmployeeForm } from "@/hooks/useEditableEmployeeForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FormFields } from "./FormFields";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('name')
        .order('name');
      
      setDepartments(data || [
        { name: "Mühendislik" },
        { name: "Satış" },
        { name: "Pazarlama" },
        { name: "Finans" },
        { name: "İnsan Kaynakları" },
        { name: "Operasyon" }
      ]);
    };

    fetchDepartments();
  }, []);

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
