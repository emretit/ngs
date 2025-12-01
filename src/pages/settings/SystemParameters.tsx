import React from "react";
import { SystemParameters } from "@/components/settings/SystemParameters";
import { Cog } from "lucide-react";

interface SystemParametersPageProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const SystemParametersPage = ({ isCollapsed, setIsCollapsed }: SystemParametersPageProps) => {
  return (
    <div className="space-y-4">
      {/* Header - Kompakt */}
      <div className="flex items-center gap-2 px-2 py-3 bg-white rounded-lg border border-gray-200">
        <div className="p-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
          <Cog className="h-4 w-4" />
          </div>
        <h1 className="text-lg font-semibold text-gray-900">
              Sistem Parametreleri
            </h1>
      </div>

      {/* Content */}
      <SystemParameters />
    </div>
  );
};

export default SystemParametersPage;
