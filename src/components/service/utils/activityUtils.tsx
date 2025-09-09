
import React from "react";
import { CheckCircle2, WrenchIcon, AlertCircle } from "lucide-react";

export const getActivityStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'new':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getActivityStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'in_progress':
      return <WrenchIcon className="w-4 h-4" />;
    case 'new':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

export const getActivityStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Tamamlandı';
    case 'in_progress':
      return 'Devam Ediyor';
    case 'new':
      return 'Yeni';
    default:
      return status;
  }
};
