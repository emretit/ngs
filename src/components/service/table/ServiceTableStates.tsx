
import React from "react";
import { Clock } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "Arama kriterlerinize uygun servis talebi bulunmuyor" 
}) => {
  return (
    <div className="bg-white rounded-md border p-8 text-center">
      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">Servis talebi bulunamadı</h3>
      <p className="text-gray-500 mt-2">{message}</p>
    </div>
  );
};

export const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-gray-500">Servis talepleri yükleniyor...</div>
    </div>
  );
};
