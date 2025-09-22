// @ts-nocheck
// This component is temporarily disabled due to type migration

import React from 'react';

interface ServiceRequestFormProps {
  onClose?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = () => {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-600 mb-2">Servis Formu Geçici Olarak Devre Dışı</h3>
      <p className="text-gray-500">Bu özellik sistem güncellemesi nedeniyle geçici olarak kullanılamıyor.</p>
    </div>
  );
}

export default ServiceRequestForm;