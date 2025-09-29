import React from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { NilveraSettings } from "@/components/settings/NilveraSettings";
import { Settings2, Zap } from "lucide-react";

interface NilveraSettingsPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NilveraSettingsPage = ({ isCollapsed, setIsCollapsed }: NilveraSettingsPageProps) => {
  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Nilvera E-Fatura Ayarları"
      subtitle="E-fatura entegrasyonu ve ayarlarını yönetin"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Nilvera E-Fatura Ayarları
              </h1>
              <p className="text-xs text-muted-foreground/70">
                E-fatura entegrasyonu ve ayarlarını yönetin.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <NilveraSettings />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default NilveraSettingsPage;
