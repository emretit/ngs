import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap, Building2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { NilveraSettings } from "@/components/settings/NilveraSettings";
import { ElogoSettings } from "@/components/settings/ElogoSettings";
import { VeribanSettings } from "@/components/settings/VeribanSettings";
import { IntegratorService, IntegratorType } from "@/services/integratorService";
import { useToast } from "@/hooks/use-toast";

interface IntegratorSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const IntegratorSettingsPage = ({ isCollapsed, setIsCollapsed }: IntegratorSettingsProps) => {
  const [selectedIntegrator, setSelectedIntegrator] = useState<IntegratorType>('nilvera');
  const [integratorStatus, setIntegratorStatus] = useState({
    nilvera: false,
    elogo: false,
    veriban: false,
    selected: 'nilvera' as IntegratorType
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegratorStatus();
  }, []);

  const loadIntegratorStatus = async () => {
    try {
      const status = await IntegratorService.checkIntegratorStatus();
      setIntegratorStatus(status);
      setSelectedIntegrator(status.selected);
    } catch (error) {
      logger.error('Error loading integrator status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegratorChange = async (value: string) => {
    const integrator = value as IntegratorType;
    
    try {
      const success = await IntegratorService.setSelectedIntegrator(integrator);
      
      if (success) {
        setSelectedIntegrator(integrator);
        const integratorNames: Record<IntegratorType, string> = {
          nilvera: 'Nilvera',
          elogo: 'e-Logo',
          veriban: 'Veriban'
        };
        toast({
          title: "Başarılı",
          description: `${integratorNames[integrator]} entegratörü seçildi`,
        });
        
        // Refresh status
        await loadIntegratorStatus();
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Entegratör seçimi kaydedilemedi",
        });
      }
    } catch (error) {
      logger.error('Error changing integrator:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bir hata oluştu",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-3 bg-white rounded-lg border border-gray-200">
        <div className="p-1.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
          <Zap className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          E-Fatura Entegratör Ayarları
        </h1>
      </div>

      {/* Integrator Selection */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">
            Entegratör Seçimi
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            E-fatura işlemleriniz için kullanmak istediğiniz entegratörü seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-4 pb-4">
          <div className="space-y-3">
            {/* Nilvera Option */}
            <div 
              onClick={() => handleIntegratorChange('nilvera')}
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedIntegrator === 'nilvera' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                selectedIntegrator === 'nilvera'
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300'
              }`}>
                {selectedIntegrator === 'nilvera' && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">Nilvera</span>
                  {integratorStatus.nilvera && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {!integratorStatus.nilvera && selectedIntegrator === 'nilvera' && (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  REST API tabanlı e-fatura entegrasyonu
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    integratorStatus.nilvera 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {integratorStatus.nilvera ? 'Yapılandırılmış' : 'Yapılandırılmamış'}
                  </span>
                </div>
              </div>
            </div>

            {/* e-Logo Option */}
            <div 
              onClick={() => handleIntegratorChange('elogo')}
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedIntegrator === 'elogo' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                selectedIntegrator === 'elogo'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedIntegrator === 'elogo' && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">e-Logo</span>
                  {integratorStatus.elogo && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {!integratorStatus.elogo && selectedIntegrator === 'elogo' && (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  SOAP Webservice tabanlı e-fatura entegrasyonu
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    integratorStatus.elogo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {integratorStatus.elogo ? 'Yapılandırılmış' : 'Yapılandırılmamış'}
                  </span>
                </div>
              </div>
            </div>

            {/* Veriban Option */}
            <div 
              onClick={() => handleIntegratorChange('veriban')}
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedIntegrator === 'veriban' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                selectedIntegrator === 'veriban'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedIntegrator === 'veriban' && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Veriban</span>
                  {integratorStatus.veriban && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {!integratorStatus.veriban && selectedIntegrator === 'veriban' && (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  SOAP/WCF tabanlı e-fatura entegrasyonu
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    integratorStatus.veriban 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {integratorStatus.veriban ? 'Yapılandırılmış' : 'Yapılandırılmamış'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for unconfigured integrator */}
          {!integratorStatus[selectedIntegrator] && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium">Entegratör yapılandırılmamış</p>
                  <p className="text-amber-700 mt-1">
                    Seçtiğiniz entegratörü kullanabilmek için aşağıdaki ayarlar bölümünden kimlik bilgilerinizi girmelisiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings based on selected integrator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Settings Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              {selectedIntegrator === 'nilvera' ? 'Nilvera' : selectedIntegrator === 'elogo' ? 'e-Logo' : 'Veriban'} Ayarları
            </h3>
          </div>
          <div className="p-4">
            {selectedIntegrator === 'nilvera' ? (
              <NilveraSettings />
            ) : selectedIntegrator === 'elogo' ? (
              <ElogoSettings />
            ) : (
              <VeribanSettings />
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border border-blue-200 bg-white shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-900">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
              {selectedIntegrator === 'nilvera' ? 'Nilvera' : selectedIntegrator === 'elogo' ? 'e-Logo' : 'Veriban'} Hakkında
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-4 pb-4">
            {selectedIntegrator === 'nilvera' ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong className="text-gray-900">Nilvera</strong>, GIB onaylı e-fatura ve e-arşiv entegratörüdür.
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>REST API ile kolay entegrasyon</li>
                  <li>API Key tabanlı kimlik doğrulama</li>
                  <li>e-Fatura gönderme ve alma</li>
                  <li>Mükellef sorgulama</li>
                  <li>Test ve production ortamları</li>
                </ul>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded mt-3">
                  <p className="text-xs text-orange-900">
                    <strong>API Key almak için:</strong><br/>
                    Nilvera portalından Entegrasyon → API bölümünden API key'inizi oluşturabilirsiniz.
                  </p>
                </div>
              </div>
            ) : selectedIntegrator === 'elogo' ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong className="text-gray-900">e-Logo</strong>, GIB onaylı e-fatura ve e-arşiv entegratörüdür.
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>SOAP Webservice ile entegrasyon</li>
                  <li>Session tabanlı kimlik doğrulama</li>
                  <li>e-Fatura gönderme ve alma</li>
                  <li>Mükellef sorgulama</li>
                  <li>Test ve production ortamları</li>
                </ul>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded mt-3">
                  <p className="text-xs text-blue-900">
                    <strong>Kimlik bilgileri:</strong><br/>
                    e-Logo hesabınızın kullanıcı adı ve şifresini kullanarak bağlanabilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong className="text-gray-900">Veriban</strong>, GIB onaylı e-fatura entegratörüdür.
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>SOAP/WCF Webservice ile entegrasyon</li>
                  <li>Session tabanlı kimlik doğrulama</li>
                  <li>e-Fatura gönderme ve alma</li>
                  <li>Mükellef sorgulama</li>
                  <li>Test ve production ortamları</li>
                </ul>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded mt-3">
                  <p className="text-xs text-blue-900">
                    <strong>Test Hesabı:</strong><br/>
                    Test ortamı için: TESTER@VRBN / Vtest*2020*
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegratorSettingsPage;
