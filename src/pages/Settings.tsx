
import { useState } from "react";
import Navbar from "@/components/Navbar";
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


interface SettingsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Settings = ({ isCollapsed, setIsCollapsed }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState("users");
  
  console.log("Settings page loaded successfully");

  return (
    <div className="min-h-screen bg-white">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'} p-8`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Ayarlar & Yönetim</h1>
          
          <CustomTabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <CustomTabsList className="w-full grid grid-cols-5">
              <CustomTabsTrigger value="users">Kullanıcılar</CustomTabsTrigger>
              <CustomTabsTrigger value="roles">Roller & İzinler</CustomTabsTrigger>
              <CustomTabsTrigger value="nilvera">Nilvera E-Fatura</CustomTabsTrigger>
              <CustomTabsTrigger value="system">Sistem Ayarları</CustomTabsTrigger>
              <CustomTabsTrigger value="pdf-templates">PDF Şablonları</CustomTabsTrigger>
            </CustomTabsList>

            <CustomTabsContent value="users">
              <UserManagement />
            </CustomTabsContent>

            <CustomTabsContent value="roles">
              <RoleManagement />
            </CustomTabsContent>

            <CustomTabsContent value="nilvera">
              <NilveraSettings />
            </CustomTabsContent>





            <CustomTabsContent value="system">
              <SystemSettings />
            </CustomTabsContent>

            <CustomTabsContent value="pdf-templates">
              <PdfTemplates />
            </CustomTabsContent>
          </CustomTabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
