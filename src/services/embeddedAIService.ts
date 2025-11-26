import Groq from 'groq-sdk';
import { supabase } from '@/integrations/supabase/client';

// Groq API Key - .env dosyasında olmalı: VITE_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groq: Groq | null = null;

if (GROQ_API_KEY) {
  groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });
}

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
    
    // 3. AI ile analiz et
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
 * AI ile veriyi analiz et (Groq kullanarak)
 */
const analyzeWithAI = async (
  tableName: string,
  data: any[],
  summary: Record<string, any>
): Promise<DataAnalysisResult> => {
  if (!GROQ_API_KEY || !groq) {
    // Groq API key yoksa fallback özet
    return {
      summary: `${tableName} tablosunda ${data.length} kayıt bulundu.`,
      insights: [
        `Toplam kayıt sayısı: ${data.length}`,
        ...Object.entries(summary)
          .filter(([key]) => key.includes('total'))
          .slice(0, 3)
          .map(([key, value]) => `${key.replace('_total', '')} toplamı: ${value}`)
      ],
      recommendations: ['Groq API key ayarlanmadı. Lütfen VITE_GROQ_API_KEY environment variable\'ını ayarlayın.'],
      error: 'GROQ_API_KEY_MISSING'
    };
  }

  try {
    // Veriyi JSON string'e çevir (ilk 10 kayıt)
    const sampleData = JSON.stringify(data.slice(0, 10), null, 2);
    const summaryText = JSON.stringify(summary, null, 2);
    
    // Prompt oluştur
    const systemPrompt = `Sen bir veri analiz uzmanısın. Supabase veritabanı verilerini analiz edip Türkçe olarak özetliyorsun. 
Verileri detaylı analiz edip, önemli bulguları ve önerileri sunuyorsun.`;

    const userPrompt = `Aşağıdaki Supabase verilerini analiz et ve Türkçe olarak özetle.

TABLO: ${tableName}
TOPLAM KAYIT SAYISI: ${data.length}

VERİ ÖZETİ:
${summaryText}

ÖRNEK VERİLER (ilk 10 kayıt):
${sampleData}

GÖREVİN:
1. Verilerin genel durumunu özetle (2-3 cümle)
2. Önemli bulguları listele (3-5 madde)
3. Öneriler sun (2-3 madde)

Yanıtını JSON formatında ver:
{
  "summary": "Genel özet",
  "insights": ["bulgu1", "bulgu2", ...],
  "recommendations": ["öneri1", "öneri2", ...]
}`;

    // Groq API'den yanıt al
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('Groq API\'den yanıt alınamadı');
    }

    // JSON'u parse et
    let parsedResult: DataAnalysisResult;
    try {
      const result = JSON.parse(response) as DataAnalysisResult;
      
      // Validasyon
      parsedResult = {
        summary: result.summary || `Toplam ${data.length} kayıt analiz edildi.`,
        insights: result.insights || [],
        recommendations: result.recommendations || [],
      };
    } catch (parseError) {
      // JSON parse hatası - metni direkt kullan
      parsedResult = {
        summary: response.split('\n')[0] || `Toplam ${data.length} kayıt analiz edildi.`,
        insights: response.split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .slice(0, 5)
          .map(line => line.replace(/^[-•\d+\.]\s*/, '').trim())
          .filter(line => line.length > 0),
        recommendations: []
      };
    }
    
    return parsedResult;
  } catch (error: any) {
    console.error('Groq AI analiz hatası:', error);
    
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
      recommendations: ['Groq API hatası nedeniyle basit özet gösteriliyor.'],
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
 * Groq API durumunu kontrol et
 */
export const getModelStatus = () => {
  return {
    loaded: !!GROQ_API_KEY && !!groq,
    loading: false // Groq API anında hazır (model yükleme yok)
  };
};

