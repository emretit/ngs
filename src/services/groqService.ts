import { supabase } from '@/integrations/supabase/client';

export interface GroqChatResponse {
  content?: string;
  sql?: string;
  raw?: string;
  error?: string;
  configured?: boolean;
}

export interface GroqAnalyzeResponse {
  summary?: string;
  insights?: string[];
  recommendations?: string[];
  error?: string;
}

export interface GroqMappingResponse {
  mappings?: Array<{
    source: string;
    target: string;
    confidence: number;
  }>;
  error?: string;
}

export interface SQLGenerationResult {
  sql: string;
  explanation: string;
  chartType?: 'table' | 'bar' | 'line' | 'pie';
  error?: string;
}

/**
 * Check if Groq API is configured
 */
export const checkGroqStatus = async (): Promise<{ configured: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('groq-chat', {
      body: { type: 'status' }
    });
    
    if (error) {
      console.error('Groq status check error:', error);
      return { configured: false, message: 'Bağlantı hatası' };
    }
    
    return data;
  } catch (err) {
    console.error('Groq status check exception:', err);
    return { configured: false, message: 'Bağlantı hatası' };
  }
};

/**
 * Generate SQL query from natural language (legacy function name for compatibility)
 */
export const generateSQLFromQuery = async (
  userQuery: string
): Promise<SQLGenerationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('groq-chat', {
      body: { 
        type: 'sql', 
        query: userQuery,
        model: 'llama-3.3-70b-versatile'
      }
    });
    
    if (error) {
      console.error('SQL generation error:', error);
      return { 
        sql: '', 
        explanation: `Sorgu işlenirken hata oluştu: ${error.message}`,
        error: error.message 
      };
    }
    
    if (data.error) {
      return {
        sql: '',
        explanation: data.error,
        error: data.error
      };
    }
    
    return {
      sql: data.sql || '',
      explanation: data.raw || 'SQL sorgusu oluşturuldu',
      chartType: 'table'
    };
  } catch (err: any) {
    console.error('SQL generation exception:', err);
    return { 
      sql: '', 
      explanation: `Sorgu işlenirken hata oluştu: ${err.message}`,
      error: err.message 
    };
  }
};

/**
 * Generate SQL query from natural language
 */
export const generateSQLQuery = async (
  query: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<GroqChatResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('groq-chat', {
      body: { 
        type: 'sql', 
        query,
        model 
      }
    });
    
    if (error) {
      console.error('SQL generation error:', error);
      return { error: error.message };
    }
    
    return data;
  } catch (err: any) {
    console.error('SQL generation exception:', err);
    return { error: err.message };
  }
};

/**
 * Chat with AI
 */
export const chatWithAI = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = 'llama-3.3-70b-versatile'
): Promise<GroqChatResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('groq-chat', {
      body: { 
        type: 'chat', 
        messages,
        model 
      }
    });
    
    if (error) {
      console.error('Chat error:', error);
      return { error: error.message };
    }
    
    return data;
  } catch (err: any) {
    console.error('Chat exception:', err);
    return { error: err.message };
  }
};

/**
 * Analyze data with AI
 */
export const analyzeDataWithAI = async (
  tableName: string,
  data: any[],
  summary: Record<string, any>,
  model: string = 'llama-3.3-70b-versatile'
): Promise<GroqAnalyzeResponse> => {
  try {
    const { data: result, error } = await supabase.functions.invoke('groq-chat', {
      body: { 
        type: 'analyze', 
        tableName,
        data,
        summary,
        model 
      }
    });
    
    if (error) {
      console.error('Analyze error:', error);
      return { error: error.message };
    }
    
    return result;
  } catch (err: any) {
    console.error('Analyze exception:', err);
    return { error: err.message };
  }
};

/**
 * Map columns with AI
 */
export const mapColumnsWithAI = async (
  sourceColumns: string[],
  targetFields: Array<{ name: string; description: string }>,
  model: string = 'llama-3.1-8b-instant'
): Promise<GroqMappingResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('groq-chat', {
      body: { 
        type: 'map-columns', 
        sourceColumns,
        targetFields,
        model 
      }
    });
    
    if (error) {
      console.error('Column mapping error:', error);
      return { error: error.message };
    }
    
    return data;
  } catch (err: any) {
    console.error('Column mapping exception:', err);
    return { error: err.message };
  }
};

/**
 * Test Groq connection (now via edge function)
 */
export const testGroqConnection = async (): Promise<boolean> => {
  const status = await checkGroqStatus();
  return status.configured;
};

/**
 * Execute SQL Query against Supabase
 */
export const executeSQLQuery = async (sql: string): Promise<any[]> => {
  console.log('Executing SQL:', sql);

  try {
    // Security check - only allow SELECT queries
    const trimmedSql = sql.trim().toLowerCase();
    if (!trimmedSql.startsWith('select')) {
      throw new Error('Güvenlik: Sadece SELECT sorguları desteklenir');
    }

    // Parse table name
    const tableMatch = sql.match(/from\s+(\w+)(?:\s+\w+)?/i);
    if (!tableMatch) {
      throw new Error('Tablo adı bulunamadı');
    }

    const tableName = tableMatch[1].toLowerCase();
    
    // Allowed tables
    const allowedTables = [
      'proposals', 'customers', 'products', 'employees',
      'opportunities', 'service_requests', 'bank_accounts',
      'tasks', 'service_slips', 'activities'
    ];

    if (!allowedTables.includes(tableName)) {
      throw new Error(`Tablo '${tableName}' erişime kapalı`);
    }

    // Check for aggregate functions
    const isCountQuery = /count\s*\(\s*\*|count\s*\(/i.test(sql);
    const isSumQuery = /sum\s*\(/i.test(sql);
    const isAvgQuery = /avg\s*\(/i.test(sql);
    const isAggregateQuery = isCountQuery || isSumQuery || isAvgQuery;

    let query = supabase.from(tableName).select('*', isAggregateQuery ? { count: 'exact', head: false } : undefined);

    // Parse WHERE clause
    const whereMatch = sql.match(/where\s+(.+?)(?:\s+group|\s+order|\s+limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      
      // Simple equality check
      const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
      if (eqMatch) {
        query = query.eq(eqMatch[1], eqMatch[2]);
      }
    }

    // ORDER BY
    const orderMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (orderMatch) {
      const orderColumn = orderMatch[1];
      const orderDirection = (orderMatch[2] || 'asc').toLowerCase() as 'asc' | 'desc';
      query = query.order(orderColumn, { ascending: orderDirection === 'asc' });
    }

    // LIMIT
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    } else {
      query = query.limit(100);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('SQL execution error:', error);
      throw new Error(`SQL Error: ${error.message}`);
    }

    // Return count for aggregate queries
    if (isCountQuery) {
      return [{ count: count || (data ? data.length : 0) }];
    }

    if (isSumQuery || isAvgQuery) {
      const columnMatch = sql.match(/(?:sum|avg)\s*\(\s*(\w+)\s*\)/i);
      if (columnMatch && data) {
        const column = columnMatch[1];
        const values = data.map((row: any) => parseFloat(row[column]) || 0).filter((v: number) => !isNaN(v));
        if (isSumQuery) {
          return [{ sum: values.reduce((a: number, b: number) => a + b, 0) }];
        } else {
          return [{ avg: values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0 }];
        }
      }
    }

    return data || [];
  } catch (error: any) {
    console.error('Database query failed:', error);
    return [{
      error: true,
      message: `Veritabanı sorgusu başarısız: ${error.message}`,
      sql: sql
    }];
  }
};

/**
 * Test database tables availability
 */
export const testDatabaseTables = async (): Promise<string[]> => {
  const testTables = ['proposals', 'customers', 'employees', 'opportunities', 'products', 'bank_accounts', 'service_requests', 'tasks', 'service_slips', 'activities'];
  const availableTables: string[] = [];

  for (const table of testTables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (!error) {
        availableTables.push(table);
      }
    } catch (err) {
      // Table not available
    }
  }

  return availableTables;
};

// Export available models
export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'En güçlü model - SQL ve analiz için ideal' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Hızlı model - Basit görevler için' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Uzun context - Detaylı analiz için' },
] as const;
