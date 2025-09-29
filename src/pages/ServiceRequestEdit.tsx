// @ts-nocheck
// This page is temporarily disabled due to type migration
import React from 'react';
import ProtectedLayout from '@/components/layouts/ProtectedLayout';
interface ServiceRequestEditProps {
  
  
}
export default function ServiceRequestEditDisabled({ isCollapsed, setIsCollapsed }: ServiceRequestEditProps) {
  return (
    <div className="p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Servis Talebi Düzenleme Geçici Olarak Devre Dışı</h3>
        <p className="text-gray-500">Bu özellik sistem güncellemesi nedeniyle geçici olarak kullanılamıyor.</p>
      </div>
  );
}