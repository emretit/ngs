// @ts-nocheck
// This component is temporarily disabled due to type migration

import React from 'react';

interface ServiceRequestDetailProps {
  serviceRequest: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceRequestDetailDisabled({ isOpen, onClose }: ServiceRequestDetailProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Servis Detayı Geçici Olarak Devre Dışı</h3>
        <p className="text-gray-500 mb-4">Bu özellik sistem güncellemesi nedeniyle geçici olarak kullanılamıyor.</p>
        <button 
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}