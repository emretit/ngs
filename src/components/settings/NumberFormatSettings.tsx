import React, { useState } from 'react';
import { useSystemParameters } from '@/hooks/useSystemParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, RefreshCw, Info, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { validateFormat, sanitizeFormat, resetSequence } from '@/utils/numberFormat';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

const NUMBER_FORMAT_TYPES = [
  {
    key: 'proposal_number_format',
    label: 'Teklif Numarası Formatı',
    defaultValue: 'TKF-{YYYY}-{0001}',
    description: 'Yeni teklifler için kullanılacak numara formatı'
  },
  {
    key: 'invoice_number_format',
    label: 'Fatura Numarası Formatı',
    defaultValue: 'FAT-{YYYY}-{0001}',
    description: 'Satış faturaları için kullanılacak numara formatı'
  },
  {
    key: 'service_number_format',
    label: 'Servis Numarası Formatı',
    defaultValue: 'SRV-{YYYY}-{0001}',
    description: 'Servis kayıtları için kullanılacak numara formatı'
  },
  {
    key: 'order_number_format',
    label: 'Sipariş Numarası Formatı',
    defaultValue: 'SIP-{YYYY}-{0001}',
    description: 'Müşteri siparişleri için kullanılacak numara formatı'
  },
  {
    key: 'customer_number_format',
    label: 'Müşteri Numarası Formatı',
    defaultValue: 'MUS-{0001}',
    description: 'Yeni müşteriler için kullanılacak numara formatı'
  },
  {
    key: 'supplier_number_format',
    label: 'Tedarikçi Numarası Formatı',
    defaultValue: 'TED-{0001}',
    description: 'Yeni tedarikçiler için kullanılacak numara formatı'
  },
];

export const NumberFormatSettings: React.FC = () => {
  const { getParameterValue, updateParameter, createParameter, parameters, loading: paramsLoading, error: paramsError } = useSystemParameters();
  const { companyId } = useCurrentCompany();
  
  const [formats, setFormats] = useState(() =>
    NUMBER_FORMAT_TYPES.map(type => ({
      ...type,
      currentValue: getParameterValue(type.key, type.defaultValue) as string,
      originalValue: getParameterValue(type.key, type.defaultValue) as string,
    }))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});

  // Loading state kontrolü
  if (paramsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Parametreler yükleniyor...</span>
      </div>
    );
  }

  // Error state kontrolü
  if (paramsError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Parametreler yüklenirken hata oluştu: {paramsError}
        </AlertDescription>
      </Alert>
    );
  }

  const handleFormatChange = (key: string, value: string) => {
    const sanitizedValue = sanitizeFormat(value);

    // Validasyon yap
    const validation = validateFormat(sanitizedValue);
    setValidationErrors(prev => ({
      ...prev,
      [key]: validation.errors
    }));

    setFormats(prev => prev.map(format =>
      format.key === key ? { ...format, currentValue: sanitizedValue } : format
    ));
  };

  const handleSave = async (key: string) => {
    const format = formats.find(f => f.key === key);
    if (!format) return;

    // Validasyon kontrolü
    const validation = validateFormat(format.currentValue);
    if (!validation.isValid) {
      toast.error(`Format geçerli değil: ${validation.errors.join(', ')}`);
      return;
    }

    // Key'den id'yi bul
    let parameter = parameters.find(p => p.parameter_key === key);
    
    setSaving(key);
    try {
      // Eğer parametre yoksa oluştur
      if (!parameter) {
        parameter = await createParameter({
          parameter_key: key,
          parameter_value: format.currentValue,
          parameter_type: 'string',
          category: 'formats',
          description: format.description,
        });
      } else {
        // Parametre varsa güncelle
        await updateParameter(parameter.id, {
          parameter_value: format.currentValue,
          parameter_type: 'string',
          category: 'formats',
          description: format.description,
        });
      }

      setFormats(prev => prev.map(f =>
        f.key === key ? { ...f, originalValue: f.currentValue } : f
      ));

      setLastSaved(prev => ({
        ...prev,
        [key]: new Date().toLocaleString('tr-TR')
      }));

      toast.success('Format başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving format:', error);
      toast.error('Format kaydedilirken hata oluştu');
    } finally {
      setSaving(null);
    }
  };

  const getValidationStatus = (key: string) => {
    const errors = validationErrors[key] || [];
    const format = formats.find(f => f.key === key);
    if (!format) return 'neutral';

    if (errors.length > 0) return 'error';
    if (format.currentValue !== format.originalValue) return 'warning';
    return 'success';
  };

  const handleResetSequence = async (sequenceKey: string) => {
    if (!confirm(`${sequenceKey} için sıralı numarayı sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;

    try {
      await resetSequence(sequenceKey, companyId, 1);
      toast.success('Sıralı numara başarıyla sıfırlandı');
    } catch (error) {
      console.error('Error resetting sequence:', error);
      toast.error('Sıralı numara sıfırlanırken hata oluştu');
    }
  };

  const generatePreview = (format: string) => {
    return format
      .replace('{YYYY}', '2025')
      .replace('{YY}', '25')
      .replace('{MM}', '01')
      .replace('{DD}', '15')
      .replace('{0001}', '0001')
      .replace('{001}', '001')
      .replace('{01}', '01');
  };

  const hasChanges = (format: typeof formats[0]) => {
    return format.currentValue !== format.originalValue;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {formats.map((format) => (
          <div key={format.key} className="p-2.5 border rounded-md bg-white">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{format.label}</span>
                    {getValidationStatus(format.key) === 'success' && lastSaved[format.key] && (
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                    )}
                    {getValidationStatus(format.key) === 'error' && (
                      <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{format.description}</p>
                </div>
                {hasChanges(format) && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-[9px] px-1.5 py-0 ml-1">
                    Değişiklik
                  </Badge>
                )}
              </div>
              <div>
                <Label htmlFor={format.key} className="text-[10px] mb-1 block">Format</Label>
                <Input
                  id={format.key}
                  value={format.currentValue}
                  onChange={(e) => handleFormatChange(format.key, e.target.value)}
                  placeholder={format.defaultValue}
                  className={`font-mono h-8 text-xs ${
                    validationErrors[format.key]?.length > 0
                      ? 'border-red-500 focus:border-red-500'
                      : hasChanges(format)
                      ? 'border-orange-500 focus:border-orange-500'
                      : ''
                  }`}
                />
                {validationErrors[format.key]?.length > 0 && (
                  <div className="mt-1">
                    {validationErrors[format.key].map((error, index) => (
                      <p key={index} className="text-[9px] text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-[10px] mb-1 block">Önizleme</Label>
                <div className="p-1.5 bg-muted rounded-md">
                  <div className="font-mono text-[10px]">
                    {generatePreview(format.currentValue)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetSequence(format.key)}
                  className="text-orange-600 hover:text-orange-700 h-7 text-[10px] px-2"
                >
                  <RotateCcw className="h-3 w-3 mr-0.5" />
                  Sıfırla
                </Button>

                <div className="flex gap-1.5">
                  {hasChanges(format) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFormatChange(format.key, format.originalValue)}
                      className="h-7 text-[10px] px-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-0.5" />
                      Geri Al
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleSave(format.key)}
                    disabled={saving === format.key || !hasChanges(format)}
                    className="h-7 text-[10px] px-2"
                  >
                    {saving === format.key ? (
                      <RefreshCw className="h-3 w-3 mr-0.5 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-0.5" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
        <div className="flex items-start gap-2">
          <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-[10px] text-blue-900 mb-1">Bilgilendirme</h4>
            <ul className="text-[9px] text-blue-800 space-y-0.5 leading-relaxed">
              <li>• Format değişiklikleri sadece yeni kayıtlar için geçerlidir.</li>
              <li>• Mevcut kayıtların numaraları değişmez.</li>
              <li>• Sıralı numaralar otomatik olarak artar.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
