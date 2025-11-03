import React from "react";
import { NilveraSettings } from "@/components/settings/NilveraSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Key } from "lucide-react";

interface NilveraSettingsPageProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const NilveraSettingsPage = ({ isCollapsed, setIsCollapsed }: NilveraSettingsPageProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-3 bg-white rounded-lg border border-gray-200">
        <div className="p-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
          <Zap className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Nilvera E-Fatura Ayarları
        </h1>
      </div>

      {/* Content - İki kart yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ayarlar Kartı */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4">
            <NilveraSettings />
          </div>
        </div>

        {/* API Key Bilgilendirme Kartı */}
        <Card className="border border-blue-200 bg-white shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-900">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Key className="h-4 w-4 text-white" />
              </div>
              API Key Nasıl Alınır?
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-4 pb-4">
            <ol className="space-y-2.5 text-sm text-gray-700">
              {[
                "Nilvera paneline giriş yapın",
                "Sol menüden Entegrasyon sekmesine tıklayın",
                "API bölümüne gidin",
                "API Key kısmından key'inizi kopyalayın",
                "Yukarıdaki alana yapıştırıp Bağlan butonuna tıklayın"
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default NilveraSettingsPage;
