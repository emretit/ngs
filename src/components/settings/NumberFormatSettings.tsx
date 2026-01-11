import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useSystemParameters } from '@/hooks/useSystemParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, RefreshCw, Info, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { validateFormat, sanitizeFormat, resetSequence } from '@/utils/numberFormat';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { IntegratorService, IntegratorType } from '@/services/integratorService';

const NUMBER_FORMAT_TYPES = [
  {
    key: 'proposal_number_format',
    label: 'Teklif Numarası Formatı',
    defaultValue: 'TKF-{YYYY}-{0001}',
    description: 'Yeni teklifler için kullanılacak numara formatı'
  },
  {
    key: 'einvoice_number_format',
    label: 'E-Fatura Seri Kodu',
    defaultValue: 'FAT',
    description: 'E-fatura için seri kodu (3 karakter, sadece harf/rakam). Seçili entegratöre göre kullanılır. Veritabanından bir önceki numara çekilir.',
    isNilveraSeries: true,
    isDynamicIntegrator: true // Bu alan entegratör seçimine göre dinamik olarak değişir
  },
  {
    key: 'earchive_invoice_number_format',
    label: 'E-Arşiv Seri Kodu',
    defaultValue: 'EAR',
    description: 'E-arşiv için Nilvera seri kodu (3 karakter, sadece harf/rakam)',
    isNilveraSeries: true
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
  
  type FormatType = typeof NUMBER_FORMAT_TYPES[0] & { currentValue: string; originalValue: string };
  const [formats, setFormats] = useState<FormatType[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [selectedIntegrator, setSelectedIntegrator] = useState<IntegratorType>('nilvera');
  
  // Entegratör seçimini yükle
  React.useEffect(() => {
    const loadIntegrator = async () => {
      const integrator = await IntegratorService.getSelectedIntegrator();
      setSelectedIntegrator(integrator);
    };
    loadIntegrator();
  }, []);

  // Parametreler yüklendikten sonra format state'ini güncelle
  React.useEffect(() => {
    if (paramsLoading) return;
    
    // Dinamik entegratör formatı için doğru key'i belirle
    const einvoiceFormatKey = selectedIntegrator === 'veriban' 
      ? 'veriban_invoice_number_format' 
      : 'einvoice_number_format';
    
    const newFormats = NUMBER_FORMAT_TYPES.map(type => {
      // Eğer dinamik entegratör formatıysa, seçili entegratöre göre key'i değiştir
      let actualKey = type.key;
      if (type.isDynamicIntegrator) {
        actualKey = einvoiceFormatKey;
      }
      
      return {
        ...type,
        key: actualKey, // Gerçek key'i kullan
        currentValue: getParameterValue(actualKey, type.defaultValue) as string,
        originalValue: getParameterValue(actualKey, type.defaultValue) as string,
      };
    });
    
    // Sadece değişiklik varsa güncelle (sonsuz döngüyü önlemek için)
    setFormats(prevFormats => {
      // İlk yükleme veya format sayısı değiştiyse güncelle
      if (prevFormats.length === 0 || prevFormats.length !== newFormats.length) {
        return newFormats;
      }
      
      // Değerler değiştiyse güncelle
      const hasChanges = prevFormats.some((prev, index) => {
        const next = newFormats[index];
        return !next || 
          prev.currentValue !== next.currentValue || 
          prev.originalValue !== next.originalValue ||
          prev.key !== next.key; // Key değişikliğini de kontrol et
      });
      
      return hasChanges ? newFormats : prevFormats;
    });
  }, [parameters, paramsLoading, getParameterValue, selectedIntegrator]);

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

  const handleFormatChange = (key: string, value: string, cursorPosition?: number) => {
    const format = formats.find(f => f.key === key);
    const isNilveraSeries = format?.isNilveraSeries || false;
    
    // Cursor pozisyonunu kaydet
    const input = inputRefs.current[key];
    if (input && cursorPosition === undefined) {
      cursorPosition = input.selectionStart || 0;
    }
    
    let sanitizedValue: string;
    const oldValue = format?.currentValue || '';
    
    // E-fatura seri kodu için özel işlem
    if (isNilveraSeries) {
      // Sadece büyük harfe çevir, boşlukları kaldır, özel karakterleri temizle
      sanitizedValue = value
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 3); // Maksimum 3 karakter
    } else {
      sanitizedValue = sanitizeFormat(value);
    }

    // Validasyon yap
    const validation = isNilveraSeries 
      ? validateNilveraSeries(sanitizedValue)
      : validateFormat(sanitizedValue);
    
    setValidationErrors(prev => ({
      ...prev,
      [key]: validation.errors
    }));

    // Cursor pozisyonunu hesapla (değer değişikliğine göre ayarla)
    let newCursorPosition = cursorPosition;
    if (cursorPosition !== undefined && oldValue !== sanitizedValue) {
      // Eğer değer kısaldıysa, cursor pozisyonunu ayarla
      if (sanitizedValue.length < oldValue.length) {
        // Silinen karakter sayısını hesapla
        const deletedChars = oldValue.length - sanitizedValue.length;
        newCursorPosition = Math.max(0, cursorPosition - deletedChars);
      } else {
        // Eğer değer uzadıysa veya aynıysa, cursor pozisyonunu koru
        newCursorPosition = Math.min(cursorPosition, sanitizedValue.length);
      }
    }

    setFormats(prev => prev.map(format =>
      format.key === key ? { ...format, currentValue: sanitizedValue } : format
    ));

    // Cursor pozisyonunu geri yükle
    if (newCursorPosition !== undefined && input) {
      setTimeout(() => {
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };
  
  // Nilvera seri kodu validasyonu (3 karakter, sadece harf/rakam)
  const validateNilveraSeries = (value: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!value || value.trim().length === 0) {
      errors.push('Seri kodu boş olamaz');
    }
    
    if (value.length !== 3) {
      errors.push('Seri kodu tam olarak 3 karakter olmalıdır (Nilvera gereksinimi)');
    }
    
    if (!/^[A-Z0-9]{3}$/.test(value)) {
      errors.push('Seri kodu sadece büyük harf ve rakam içerebilir');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSave = async (key: string) => {
    const format = formats.find(f => f.key === key);
    if (!format) return;

    // Validasyon kontrolü
    const validation = format.isNilveraSeries
      ? validateNilveraSeries(format.currentValue)
      : validateFormat(format.currentValue);
    
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
      logger.error('Error saving format:', error);
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
      logger.error('Error resetting sequence:', error);
      toast.error('Sıralı numara sıfırlanırken hata oluştu');
    }
  };

  const generatePreview = (format: string, isNilveraSeries?: boolean, formatKey?: string) => {
    // E-fatura seri kodu için GİB formatı önizlemesi göster
    if (isNilveraSeries) {
      // Seri kodu (örn: 'FAT') -> GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
      const serie = format || 'FAT';
      const year = '2025';
      const sequence = '000000001';
      return `${serie}${year}${sequence}`;
    }
    
    // GİB formatı için özel işlem: invoice_number_format, einvoice_number_format ve veriban_invoice_number_format
    if (formatKey === 'invoice_number_format' || formatKey === 'einvoice_number_format' || formatKey === 'veriban_invoice_number_format') {
      // Format'tan seri kısmını çıkar
      let serie = format
        .replace(/\{YYYY\}/g, '')
        .replace(/\{YY\}/g, '')
        .replace(/\{MM\}/g, '')
        .replace(/\{DD\}/g, '')
        .replace(/\{0+\}/g, '')
        .replace(/[-_]/g, '')
        .trim();
      
      if (!serie || serie.length !== 3) {
        serie = 'FAT'; // Varsayılan seri
      }

      // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
      const year = '2025';
      const sequence = '000000001';
      
      return `${serie}${year}${sequence}`;
    }
    
    return format
      .replace('{YYYY}', '2025')
      .replace('{YY}', '25')
      .replace('{MM}', '01')
      .replace('{DD}', '15')
      .replace('{000000001}', '000000001')
      .replace('{0001}', '0001')
      .replace('{001}', '001')
      .replace('{01}', '01');
  };

  const hasChanges = (format: typeof formats[0]) => {
    return format.currentValue !== format.originalValue;
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[250px]">Format Adı</TableHead>
              <TableHead className="w-[300px]">Format Değeri</TableHead>
              <TableHead className="w-[200px]">Önizleme</TableHead>
              <TableHead className="w-[250px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formats.map((format) => (
              <TableRow key={format.key} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{format.label}</span>
                      {getValidationStatus(format.key) === 'success' && lastSaved[format.key] && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {getValidationStatus(format.key) === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {format.isNilveraSeries && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0">
                          {selectedIntegrator === 'veriban' ? 'Veriban Entegrasyonu' : selectedIntegrator === 'nilvera' ? 'Nilvera Entegrasyonu' : 'Entegrasyon'}
                        </Badge>
                      )}
                      {hasChanges(format) && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-0">
                          Değişiklik
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Input
                      ref={(el) => {
                        inputRefs.current[format.key] = el;
                      }}
                      id={format.key}
                      value={format.currentValue}
                      onChange={(e) => {
                        const input = e.target as HTMLInputElement;
                        handleFormatChange(format.key, input.value, input.selectionStart || 0);
                      }}
                      placeholder={format.defaultValue}
                      className={`font-mono ${
                        validationErrors[format.key]?.length > 0
                          ? 'border-red-500 focus:border-red-500'
                          : hasChanges(format)
                          ? 'border-orange-500 focus:border-orange-500'
                          : ''
                      }`}
                      maxLength={format.isNilveraSeries ? 3 : undefined}
                    />
                    {validationErrors[format.key]?.length > 0 && (
                      <div className="space-y-0.5">
                        {validationErrors[format.key].map((error, index) => (
                          <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="p-2 bg-muted rounded-md border">
                    <div className="font-mono text-sm">
                      {generatePreview(format.currentValue, format.isNilveraSeries, format.key)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasChanges(format) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFormatChange(format.key, format.originalValue)}
                        className="h-8"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Geri Al
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSave(format.key)}
                      disabled={saving === format.key || !hasChanges(format)}
                      className="h-8"
                    >
                      {saving === format.key ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Kaydet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetSequence(format.key)}
                      className="text-orange-600 hover:text-orange-700 h-8"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Sıfırla
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              <li>• <strong>E-Fatura Seri Kodu:</strong> Seçili entegratöre göre kullanılır (Nilvera veya Veriban). Sadece 3 karakter seri belirlenir (harfleri değiştirebilirsiniz). Veritabanından bir önceki numara çekilir ve GİB formatına uygun olarak üretilir (SERI(3) + YIL(4) + SIRA(9) = 16 karakter).</li>
              <li>• <strong>E-Arşiv Seri Kodu:</strong> Nilvera ile entegre olduğu için sadece 3 karakter seri belirlenir. Numara Nilvera tarafından otomatik üretilir.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
