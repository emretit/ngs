
import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Task } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TaskMainInfoProps {
  formData: Task;
  handleInputChange: (key: keyof Task, value: any) => void;
}

const TaskMainInfo = ({ formData, handleInputChange }: TaskMainInfoProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      console.error("Invalid date:", dateString);
      return "-";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold">{formData.title}</h2>
        
        <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
          <span>Oluşturulma: {formatDate(formData.created_at)}</span>
          {formData.updated_at && formData.updated_at !== formData.created_at && (
            <span>Güncelleme: {formatDate(formData.updated_at)}</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Başlık
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Açıklama
        </label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full min-h-[100px]"
          placeholder="Aktivite açıklaması"
        />
      </div>
    </div>
  );
};

export default TaskMainInfo;

