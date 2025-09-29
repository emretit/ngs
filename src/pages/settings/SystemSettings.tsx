import React from "react";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { Settings2, Wrench } from "lucide-react";
interface SystemSettingsPageProps {
  
  
}
const SystemSettingsPage = ({ isCollapsed, setIsCollapsed }: SystemSettingsPageProps) => {
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg text-white shadow-lg">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Sistem Ayarları
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Genel sistem ayarlarını yönetin.
              </p>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <SystemSettings />
          </div>
        </div>
      </div>
  );
};
export default SystemSettingsPage;
