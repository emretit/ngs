import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useNilveraCompanyInfo } from '../../hooks/useNilveraCompanyInfo';
import { NilveraCompanyService } from '../../services/nilveraCompanyService';

export const NilveraCompanyTest: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [vkn, setVkn] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const { companyInfo, mukellefInfo, isLoading, error, getCompanyInfo, searchMukellef } = useNilveraCompanyInfo();

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult('API anahtarı gerekli');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const isValid = await NilveraCompanyService.testApiKey(apiKey);
      setTestResult(isValid ? 'API anahtarı geçerli ✅' : 'API anahtarı geçersiz ❌');
    } catch (err) {
      setTestResult('Test sırasında hata oluştu');
    } finally {
      setTesting(false);
    }
  };

  const handleFetchCompanyInfo = () => {
    if (apiKey.trim()) {
      if (vkn.trim()) {
        searchMukellef(vkn);
      } else {
        getCompanyInfo();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nilvera Firma Bilgileri Test</CardTitle>
          <CardDescription>
            Nilvera API'sinden firma bilgilerini çekmek için test edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              API Anahtarı
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder="Nilvera API anahtarınızı girin"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="vkn" className="text-sm font-medium">
              VKN (Opsiyonel - Mükellefiyet Kontrolü İçin)
            </label>
            <Input
              id="vkn"
              placeholder="Vergi kimlik numarası girin"
              value={vkn}
              onChange={(e) => setVkn(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTestApiKey} 
              disabled={testing || !apiKey.trim()}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test Ediliyor...
                </>
              ) : (
                'API Key Test Et'
              )}
            </Button>

            <Button 
              onClick={handleFetchCompanyInfo} 
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                vkn ? 'VKN Mükellefiyet Kontrol Et' : 'Firma Bilgilerini Getir'
              )}
            </Button>
          </div>

          {testResult && (
            <Alert>
              <AlertDescription>{testResult}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(companyInfo || mukellefInfo) && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {vkn ? 'VKN mükellefiyet kontrolü' : 'Firma bilgileri'} başarıyla alındı!
              </AlertDescription>
            </Alert>
          )}

          {mukellefInfo && vkn && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>VKN: {vkn}</strong><br />
                Mükellefiyet Durumu: {mukellefInfo ? 
                  <span className="text-green-600 font-medium">E-Fatura Mükellfi ✓</span> : 
                  <span className="text-red-600 font-medium">E-Fatura Mükellfi Değil ✗</span>
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {(companyInfo || mukellefInfo) && (
        <Card>
          <CardHeader>
            <CardTitle>Firma Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(companyInfo || mukellefInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
