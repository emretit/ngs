
import { useState } from "react";
import { logger } from '@/utils/logger';
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
      logger.error("Invalid date:", dateString);
      return "-";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h3 className="text-sm font-medium text-gray-900">Görev Bilgileri</h3>
      </div>

      {/* Başlık ve Açıklama */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Başlık *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Görev başlığını girin"
            className="h-8"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Açıklama
          </label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="resize-none h-20"
            placeholder="Görev detaylarını girin"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskMainInfo;

