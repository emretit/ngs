
import React from "react";
import { WrenchIcon } from "lucide-react";

export const ActivityListLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export const ActivityListError: React.FC = () => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
      <p>Aktiviteler yüklenirken bir hata oluştu.</p>
    </div>
  );
};

export const ActivityListEmpty: React.FC = () => {
  return (
    <div className="text-center py-8 text-gray-500">
      <WrenchIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
      <p>Henüz servis aktivitesi kaydedilmemiş.</p>
    </div>
  );
};
