import { supabase } from '@/integrations/supabase/client';

/**
 * Embedded AI Service using Google Gemini via Edge Function
 */

export interface DataAnalysisResult {
  summary: string;
  insights: string[];
  recommendations?: string[];
  error?: string;
}

export interface SupabaseData {
  table: string;
  data: any[];
  summary?: {
    count?: number;
    total?: number;
    average?: number;
    [key: string]: any;
  };
}

/**
 * Supabase'den veri çek ve analiz et
 */
export const analyzeSupabaseData = async (
  tableName: string,
  query?: {
    select?: string;
    filters?: Record<string, any>;
    limit?: number;
  }
): Promise<DataAnalysisResult> => {
  try {
    // 1. Supabase'den veri çek
    let queryBuilder = supabase.from(tableName).select(query?.select || '*');
    
    // Filtreleri uygula
    if (query?.filters) {
      Object.entries(query.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
    }
    
    // Limit uygula
    if (query?.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      throw new Error(`Supabase hatası: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return {
        summary: `${tableName} tablosunda veri bulunamadı.`,
        insights: [],
        recommendations: ['Lütfen veri ekleyin veya farklı bir tablo seçin.']
      };
    }

    // 2. Veriyi özetle
    const dataSummary = summarizeData(data);
    
    // 3. AI ile analiz et (Edge function üzerinden)
    const analysis = await analyzeWithAI(tableName, data, dataSummary);
    
    return analysis;
  } catch (error: any) {
    console.error('Veri analizi hatası:', error);
    return {
      summary: 'Veri analizi sırasında bir hata oluştu.',
      insights: [],
      error: error.message
    };
  }
};

/**
 * Veriyi özetle (basit istatistikler)
 */
const summarizeData = (data: any[]): Record<string, any> => {
  const summary: Record<string, any> = {
    count: data.length,
  };
  
  // Sayısal alanları bul ve özetle
  if (data.length > 0) {
    const firstRow = data[0];
    Object.keys(firstRow).forEach(key => {
      const values = data.map(row => row[key]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        summary[`${key}_total`] = values.reduce((a, b) => a + b, 0);
        summary[`${key}_average`] = values.reduce((a, b) => a + b, 0) / values.length;
        summary[`${key}_min`] = Math.min(...values);
        summary[`${key}_max`] = Math.max(...values);
      }
    });
  }
  
  return summary;
};

/**
 * AI ile veriyi analiz et (Gemini Edge Function kullanarak)
 */
const analyzeWithAI = async (
  tableName: string,
  data: any[],
  summary: Record<string, any>
): Promise<DataAnalysisResult> => {
  try {
    // Edge function'ı çağır
    const { data: result, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'analyze',
        tableName,
        data: data.slice(0, 10), // İlk 10 kayıt
        summary,
        model: 'gemini-2.5-flash'
      }
    });

    if (error) {
      throw new Error(`Edge function hatası: ${error.message}`);
    }

    if (result.error) {
      // API yapılandırılmamış - fallback özet
      return {
        summary: `${tableName} tablosunda ${data.length} kayıt bulundu.`,
        insights: [
          `Toplam kayıt sayısı: ${data.length}`,
          ...Object.entries(summary)
            .filter(([key]) => key.includes('total'))
            .slice(0, 3)
            .map(([key, value]) => `${key.replace('_total', '')} toplamı: ${value}`)
        ],
        recommendations: ['Gemini API yapılandırılmadı. Lütfen GOOGLE_GEMINI_API_KEY ayarlayın.'],
        error: 'GEMINI_API_KEY_MISSING'
      };
    }

    // Validasyon
    return {
      summary: result.summary || `Toplam ${data.length} kayıt analiz edildi.`,
      insights: result.insights || [],
      recommendations: result.recommendations || [],
    };
  } catch (error: any) {
    console.error('Gemini AI analiz hatası:', error);
    
    // Fallback: Basit özet
    return {
      summary: `${tableName} tablosunda ${data.length} kayıt bulundu.`,
      insights: [
        `Toplam kayıt sayısı: ${data.length}`,
        ...Object.entries(summary)
          .filter(([key]) => key.includes('total'))
          .slice(0, 3)
          .map(([key, value]) => `${key.replace('_total', '')} toplamı: ${value}`)
      ],
      recommendations: ['Gemini API hatası nedeniyle basit özet gösteriliyor.'],
      error: error.message
    };
  }
};

/**
 * Çoklu tablo analizi
 */
export const analyzeMultipleTables = async (
  tables: Array<{ name: string; query?: any }>
): Promise<Record<string, DataAnalysisResult>> => {
  const results: Record<string, DataAnalysisResult> = {};
  
  for (const table of tables) {
    try {
      results[table.name] = await analyzeSupabaseData(table.name, table.query);
    } catch (error: any) {
      results[table.name] = {
        summary: `Analiz hatası: ${error.message}`,
        insights: [],
        error: error.message
      };
    }
  }
  
  return results;
};

/**
 * Gemini API durumunu kontrol et
 */
export const getModelStatus = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { type: 'status' }
    });
    
    if (error) {
      return { loaded: false, loading: false };
    }
    
    return {
      loaded: data?.configured || false,
      loading: false
    };
  } catch {
    return { loaded: false, loading: false };
  }
};
