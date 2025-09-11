
import React from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ServiceStatus } from "@/hooks/service/types";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-blue-600" />;
    case 'new':
      return <AlertCircle className="w-4 h-4 text-purple-600" />;
    default:
      return null;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'new':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'assigned':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'on_hold':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Tamamlandı';
    case 'in_progress':
      return 'Devam Ediyor';
    case 'new':
      return 'Yeni';
    case 'cancelled':
      return 'İptal Edildi';
    case 'assigned':
      return 'Atandı';
    case 'on_hold':
      return 'Beklemede';
    default:
      return status;
  }
};

export const getStatusBadge = (status: ServiceStatus) => {
  switch (status) {
    case "new":
      return <Badge className="bg-purple-500">Yeni</Badge>;
    case "assigned":
      return <Badge className="bg-blue-500">Atandı</Badge>;
    case "in_progress":
      return <Badge className="bg-orange-500">Devam Ediyor</Badge>;
    case "completed":
      return <Badge className="bg-green-500">Tamamlandı</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500">İptal</Badge>;
    case "on_hold":
      return <Badge className="bg-yellow-500">Beklemede</Badge>;
    default:
      return <Badge>Bilinmiyor</Badge>;
  }
};
