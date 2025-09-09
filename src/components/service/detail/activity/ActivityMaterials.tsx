
import React from "react";
import { Tag } from "lucide-react";

interface ServiceMaterial {
  name: string;
  quantity: number;
  unit: string;
}

interface ActivityMaterialsProps {
  materials: ServiceMaterial[];
}

export const ActivityMaterials: React.FC<ActivityMaterialsProps> = ({ materials }) => {
  if (!materials || materials.length === 0) return null;
  
  return (
    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-2 flex items-center text-gray-700">
        <Tag className="w-4 h-4 mr-2" />
        Kullanılan Malzemeler:
      </h4>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {materials.map((material, index) => (
          <li key={index} className="text-sm text-gray-600 flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            {material.name} - {material.quantity} {material.unit}
          </li>
        ))}
      </ul>
    </div>
  );
};
