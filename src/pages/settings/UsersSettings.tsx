import React from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { UserManagement } from "@/components/settings/UserManagement";
import { Settings2, Users } from "lucide-react";

interface UsersSettingsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const UsersSettings = ({ isCollapsed, setIsCollapsed }: UsersSettingsProps) => {
  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Kullanıcı Yönetimi"
      subtitle="Sistem kullanıcılarını yönetin ve yetkilendirin"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Kullanıcı Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Sistem kullanıcılarını yönetin ve yetkilendirin.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <UserManagement />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default UsersSettings;
