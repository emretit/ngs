// @ts-nocheck
// This page is temporarily disabled due to type migration

import React from 'react';
import DefaultLayout from '@/components/layouts/DefaultLayout';

interface ServiceRequestNewProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function ServiceRequestNewDisabled({ isCollapsed, setIsCollapsed }: ServiceRequestNewProps) {
  return (
    <DefaultLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Yeni Servis Talebi Geçici Olarak Devre Dışı</h3>
        <p className="text-gray-500">Bu özellik sistem güncellemesi nedeniyle geçici olarak kullanılamıyor.</p>
      </div>
    </DefaultLayout>
  );
}