
import React from "react";
import { AlertCircle } from "lucide-react";

export function EmptyState() {
  return (
    <div className="text-center my-12 py-12 border border-dashed border-gray-300 rounded-lg">
      <div className="text-gray-400 mb-4">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Henüz servis talebi bulunmuyor</h3>
        <p className="mt-2">İlk servis talebinizi oluşturmak için "Yeni Servis Talebi" butonuna tıklayın.</p>
      </div>
    </div>
  );
}
