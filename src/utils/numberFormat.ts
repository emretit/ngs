import { supabase } from '@/integrations/supabase/client';

/**
 * Sistem parametrelerinden numara formatını alır
 */
export const getNumberFormat = async (formatKey: string, companyId?: string): Promise<string> => {
  try {
    if (!companyId) {
      console.warn('Company ID gerekli, varsayılan format kullanılacak');
      return getDefaultFormat(formatKey);
    }

    const { data, error } = await supabase
      .from('system_parameters')
      .select('parameter_value')
      .eq('parameter_key', formatKey)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.warn(`Format ${formatKey} bulunamadı, varsayılan kullanılacak:`, error);
      return getDefaultFormat(formatKey);
    }

    return data?.parameter_value || getDefaultFormat(formatKey);
  } catch (error) {
    console.error('Numara formatı alınırken hata:', error);
    return getDefaultFormat(formatKey);
  }
};

/**
 * Varsayılan formatları döndürür
 */
const getDefaultFormat = (formatKey: string): string => {
  const defaults: Record<string, string> = {
    'proposal_number_format': 'TKF-{YYYY}-{0001}',
    'invoice_number_format': 'FAT-{YYYY}-{0001}',
    'einvoice_number_format': 'FAT', // E-fatura için sadece 3 karakter seri (Nilvera gereksinimi)
    'earchive_invoice_number_format': 'EAR', // E-arşiv için sadece 3 karakter seri (Nilvera gereksinimi)
    'service_number_format': 'SRV-{YYYY}-{0001}',
    'order_number_format': 'SIP-{YYYY}-{0001}',
    'customer_number_format': 'MUS-{0001}',
    'supplier_number_format': 'TED-{0001}',
  };

  return defaults[formatKey] || '{YYYY}-{0001}';
};

/**
 * Format string'ini gerçek değerlerle doldurur
 */
export const formatNumber = (
  format: string,
  sequentialNumber: number,
  date?: Date
): string => {
  const now = date || new Date();

  return format
    .replace('{YYYY}', now.getFullYear().toString())
    .replace('{YY}', (now.getFullYear() % 100).toString().padStart(2, '0'))
    .replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'))
    .replace('{DD}', now.getDate().toString().padStart(2, '0'))
    .replace('{0001}', sequentialNumber.toString().padStart(4, '0'))
    .replace('{001}', sequentialNumber.toString().padStart(3, '0'))
    .replace('{01}', sequentialNumber.toString().padStart(2, '0'));
};

/**
 * Son kullanılan numara için sequence tablosu kullanır
 * Race condition'ı önlemek için daha güvenli yaklaşım
 */
export const getNextSequentialNumber = async (
  sequenceKey: string,
  companyId?: string
): Promise<number> => {
  try {
    if (!companyId) {
      console.warn('Company ID gerekli, varsayılan sequence kullanılacak');
      return 1;
    }

    // Sequence parametresi için benzersiz key
    const sequenceParamKey = `${sequenceKey}_sequence`;

    // Atomic increment için RPC fonksiyonu kullan (daha güvenli)
    // Şimdilik upsert ile devam edelim ama daha iyi bir yaklaşım bulacağız
    const { data: current, error: selectError } = await supabase
      .from('system_parameters')
      .select('parameter_value')
      .eq('parameter_key', sequenceParamKey)
      .eq('company_id', companyId)
      .single();

    let nextNumber = 1;

    if (current?.parameter_value) {
      nextNumber = parseInt(current.parameter_value) + 1;
    }

    // Sequence'i güncelle - retry logic ile
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const { error: upsertError } = await supabase
          .from('system_parameters')
          .upsert({
            parameter_key: sequenceParamKey,
            parameter_value: nextNumber.toString(),
            parameter_type: 'number',
            category: 'sequences',
            description: `${sequenceKey} için son kullanılan numara`,
            company_id: companyId,
            is_system_parameter: true,
            is_editable: false,
          }, {
            onConflict: 'company_id,parameter_key'
          });

        if (!upsertError) {
          return nextNumber;
        }

        // Eğer conflict olduysa, tekrar dene
        if (upsertError.code === '23505') { // unique constraint violation
          retryCount++;
          // Kısa bir bekleme
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        throw upsertError;
      } catch (error) {
        if (retryCount === maxRetries - 1) {
          console.error('Sequence güncellenirken hata:', error);
          throw error;
        }
        retryCount++;
      }
    }

    return nextNumber;
  } catch (error) {
    console.error('Sequence alınırken hata:', error);
    // Fallback olarak timestamp tabanlı unique numara üret
    return Date.now() % 10000;
  }
};

/**
 * Sequence numarasını sıfırlar (admin kullanımı için)
 */
export const resetSequence = async (
  sequenceKey: string,
  companyId?: string,
  startValue: number = 1
): Promise<void> => {
  try {
    if (!companyId) {
      throw new Error('Company ID gerekli');
    }

    const { error } = await supabase
      .from('system_parameters')
      .upsert({
        parameter_key: `${sequenceKey}_sequence`,
        parameter_value: startValue.toString(),
        parameter_type: 'number',
        category: 'sequences',
        description: `${sequenceKey} için sıfırlanmış numara`,
        company_id: companyId,
        is_system_parameter: true,
        is_editable: false,
      }, {
        onConflict: 'company_id,parameter_key'
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Sequence sıfırlanırken hata:', error);
    throw error;
  }
};

/**
 * Format key'e göre tablo ve kolon bilgilerini döndürür
 */
const getTableInfo = (formatKey: string): { table: string; column: string } | null => {
  const tableMap: Record<string, { table: string; column: string }> = {
    'proposal_number_format': { table: 'proposals', column: 'number' },
    'invoice_number_format': { table: 'sales_invoices', column: 'fatura_no' },
    'service_number_format': { table: 'service_requests', column: 'service_number' },
    'order_number_format': { table: 'orders', column: 'order_number' },
    'customer_number_format': { table: 'customers', column: 'number' }, // customers tablosunda number kolonu yoksa null dönecek
    'supplier_number_format': { table: 'suppliers', column: 'number' }, // suppliers tablosunda number kolonu yoksa null dönecek
  };

  return tableMap[formatKey] || null;
};

/**
 * Veritabanında bu numarayla bir kayıt var mı kontrol eder
 */
const checkNumberExists = async (
  number: string,
  formatKey: string,
  companyId?: string
): Promise<boolean> => {
  try {
    if (!companyId) return false;

    const tableInfo = getTableInfo(formatKey);
    if (!tableInfo) return false;

    // Veritabanında bu numarayla bir kayıt var mı kontrol et
    const { data, error } = await supabase
      .from(tableInfo.table)
      .select('id')
      .eq(tableInfo.column, number)
      .eq('company_id', companyId)
      .limit(1)
      .single();

    // Eğer kayıt bulunduysa true döndür
    return !error && !!data;
  } catch (error) {
    // PGRST116 = not found, bu durumda numara yok demektir
    if ((error as any)?.code === 'PGRST116') {
      return false;
    }
    console.error('Numara kontrolü sırasında hata:', error);
    return false;
  }
};

/**
 * Veritabanındaki en yüksek numarayı bulur (aynı format pattern'i ile)
 */
const getMaxNumberFromDatabase = async (
  formatKey: string,
  companyId?: string,
  customDate?: Date
): Promise<number> => {
  try {
    if (!companyId) return 0;

    const tableInfo = getTableInfo(formatKey);
    if (!tableInfo) return 0;

    const format = await getNumberFormat(formatKey, companyId);
    const now = customDate || new Date();
    
    // Format pattern'inden prefix'i çıkar (örn: TKF-2025-)
    const year = now.getFullYear().toString();
    const yearShort = (now.getFullYear() % 100).toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Format'tan prefix'i oluştur (numara kısmı hariç)
    // Önce tarih placeholder'larını değiştir, sonra sıralı numara placeholder'ını kaldır
    let prefix = format
      .replace('{YYYY}', year)
      .replace('{YY}', yearShort)
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace(/\{0+\}/g, ''); // Sıralı numara placeholder'ını kaldır ({0001}, {001}, {01})
    
    // Eğer prefix'in sonunda - veya _ varsa, onu da kaldır
    prefix = prefix.replace(/[-_]+$/, '');

    // Veritabanından bu prefix ile başlayan tüm numaraları al
    const { data, error } = await supabase
      .from(tableInfo.table)
      .select(tableInfo.column)
      .eq('company_id', companyId)
      .like(tableInfo.column, `${prefix}%`)
      .order(tableInfo.column, { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      // Eğer hata varsa veya veri yoksa, 0 döndür
      return 0;
    }

    // En yüksek numarayı bul
    let maxNumber = 0;
    for (const record of data) {
      const number = record[tableInfo.column];
      if (!number) continue;

      // Numara formatından sıralı numarayı çıkar
      // Örn: TKF-2025-0001 -> 1
      const match = number.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    return maxNumber;
  } catch (error) {
    console.error('En yüksek numara bulunurken hata:', error);
    return 0;
  }
};

/**
 * Tam numara üretme fonksiyonu
 * Veritabanında kayıtlı numaralara bakarak, kullanılmayan bir numara üretir
 */
export const generateNumber = async (
  formatKey: string,
  companyId?: string,
  customDate?: Date
): Promise<string> => {
  try {
    const format = await getNumberFormat(formatKey, companyId);
    
    // Önce veritabanındaki en yüksek numarayı bul
    const maxNumber = await getMaxNumberFromDatabase(formatKey, companyId, customDate);
    
    // Bir sonraki numarayı dene
    let nextNumber = maxNumber + 1;
    let attempts = 0;
    const maxAttempts = 100; // Sonsuz döngüyü önlemek için

    while (attempts < maxAttempts) {
      const generatedNumber = formatNumber(format, nextNumber, customDate);
      
      // Bu numara veritabanında var mı kontrol et
      const exists = await checkNumberExists(generatedNumber, formatKey, companyId);
      
      if (!exists) {
        // Numara kullanılabilir, döndür
        return generatedNumber;
      }
      
      // Numara kullanılıyor, bir sonrakine geç
      nextNumber++;
      attempts++;
    }

    // Eğer 100 denemede uygun numara bulunamazsa, fallback
    console.warn('Uygun numara bulunamadı, fallback kullanılıyor');
    return formatNumber(format, nextNumber, customDate);
  } catch (error) {
    console.error('Numara üretilirken hata:', error);
    // Fallback olarak basit bir numara üret
    return `AUTO-${Date.now()}`;
  }
};

/**
 * Belirli bir format için örnek numara üretir
 */
export const generatePreviewNumber = (format: string, sampleNumber: number = 1): string => {
  return formatNumber(format, sampleNumber, new Date());
};

/**
 * Format string'inin geçerli olup olmadığını kontrol eder
 */
export const validateFormat = (format: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Temel validasyonlar
  if (!format || format.trim().length === 0) {
    errors.push('Format boş olamaz');
  }

  if (format.length > 100) {
    errors.push('Format çok uzun (maksimum 100 karakter)');
  }

  // Geçersiz karakter kontrolü
  const invalidChars = format.match(/[^a-zA-Z0-9\{\}\-\_\.]/g);
  if (invalidChars) {
    errors.push(`Geçersiz karakterler: ${invalidChars.join(', ')}`);
  }

  // Değişken syntax kontrolü
  const variables = format.match(/\{[^}]+\}/g) || [];
  const validVariables = ['{YYYY}', '{YY}', '{MM}', '{DD}', '{0001}', '{001}', '{01}'];

  for (const variable of variables) {
    if (!validVariables.includes(variable)) {
      errors.push(`Geçersiz değişken: ${variable}. Geçerli değişkenler: ${validVariables.join(', ')}`);
    }
  }

  // En az bir sıralı numara değişkeni olmalı
  const hasSequential = variables.some(v => ['{0001}', '{001}', '{01}'].includes(v));
  if (!hasSequential) {
    errors.push('Format en az bir sıralı numara değişkeni içermelidir ({0001}, {001} veya {01})');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format string'ini temizler ve standardize eder
 */
export const sanitizeFormat = (format: string): string => {
  return format
    .trim()
    .replace(/\s+/g, '') // Boşlukları kaldır
    .toUpperCase(); // Büyük harfe çevir
};
