
import { useState } from "react";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import {
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger
} from "@/components/ui/custom-tabs";
import { UserManagement } from "@/components/settings/UserManagement";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { NilveraSettings } from "@/components/settings/NilveraSettings";
import PdfTemplates from "@/pages/PdfTemplates";
import { Settings2, Users, Shield, Plug, Wrench, FileText } from "lucide-react";


interface SettingsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Settings = ({ isCollapsed, setIsCollapsed }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState("users");
  
  console.log("Settings page loaded successfully");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <TopBar />
        <div className="p-8">
          <div className="w-full">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white shadow-lg">
                  <Settings2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Ayarlar & Yönetim</h1>
                  <p className="text-gray-600 mt-1">Sistem ayarlarını yönetin ve kullanıcı izinlerini düzenleyin</p>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
              <CustomTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200/80 bg-gray-50/50 px-6 py-4">
                  <CustomTabsList className="bg-white shadow-sm border border-gray-200/60 rounded-xl p-1 grid grid-cols-5 w-full">
                    <CustomTabsTrigger
                      value="users"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Users className="h-4 w-4" />
                      Kullanıcılar
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="roles"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Shield className="h-4 w-4" />
                      Roller & İzinler
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="nilvera"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Plug className="h-4 w-4" />
                      Nilvera E-Fatura
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="system"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Wrench className="h-4 w-4" />
                      Sistem Ayarları
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="pdf-templates"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4" />
                      PDF Şablonları
                    </CustomTabsTrigger>
                  </CustomTabsList>
                </div>

                <div className="p-6">
                  <CustomTabsContent value="users" className="mt-0">
                    <div className="space-y-6">
                      <UserManagement />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="roles" className="mt-0">
                    <div className="space-y-6">
                      <RoleManagement />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="nilvera" className="mt-0">
                    <div className="space-y-6">
                      <NilveraSettings />
                    </div>
                  </CustomTabsContent>





                  <CustomTabsContent value="system" className="mt-0">
                    <div className="space-y-6">
                      <SystemSettings />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="pdf-templates" className="mt-0">
                    <div className="space-y-6">
                      <PdfTemplates />
                    </div>
                  </CustomTabsContent>
                </div>
              </CustomTabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
