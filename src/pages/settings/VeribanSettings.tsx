import React from "react";
import { VeribanSettings } from "@/components/settings/VeribanSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Key } from "lucide-react";

interface VeribanSettingsPageProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const VeribanSettingsPage = ({ isCollapsed, setIsCollapsed }: VeribanSettingsPageProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-3 bg-white rounded-lg border border-gray-200">
        <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
          <FileText className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Veriban E-Fatura Ayarları
        </h1>
      </div>

      {/* Content - İki kart yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ayarlar Kartı */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4">
            <VeribanSettings />
          </div>
        </div>

        {/* Bilgilendirme Kartı */}
        <Card className="border border-blue-200 bg-white shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-900">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Key className="h-4 w-4 text-white" />
              </div>
              Veriban Entegrasyonu
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-4 pb-4">
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1.5">SOAP/WCF Tabanlı Entegrasyon</h4>
                <p className="leading-relaxed">
                  Veriban e-fatura entegrasyonu SOAP/WCF web servisleri üzerinden çalışmaktadır.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1.5">Test Hesabı</h4>
                <p className="leading-relaxed">
                  Test ortamı için aşağıdaki bilgileri kullanabilirsiniz:
                </p>
                <ul className="mt-1.5 space-y-1 list-disc list-inside text-gray-600">
                  <li>Kullanıcı Adı: <code className="bg-gray-100 px-1 rounded">TESTER@VRBN</code></li>
                  <li>Şifre: <code className="bg-gray-100 px-1 rounded">Vtest*2020*</code></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1.5">Test/Production Ortamları</h4>
                <ul className="space-y-1.5 text-gray-600">
                  <li>
                    <strong>Test:</strong> https://efaturatransfertest.veriban.com.tr/IntegrationService.svc
                  </li>
                  <li>
                    <strong>Production:</strong> https://efaturatransfer.veriban.com.tr/IntegrationService.svc
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-1.5">İletişim</h4>
                <p className="leading-relaxed text-gray-600">
                  Veriban ile iletişim için resmi web sitesini ziyaret edebilir veya destek ekibi ile iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default VeribanSettingsPage;

