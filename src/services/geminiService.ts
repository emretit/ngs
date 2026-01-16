import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { geminiCache } from '@/services/geminiCacheService';
import { tryGenerateSQLFromTemplate } from '@/services/sqlTemplateService';

export interface GeminiChatResponse {
  content?: string;
  sql?: string;
  raw?: string;
  error?: string;
  configured?: boolean;
}

export interface GeminiReportResponse {
  sql?: string;
  explanation?: string;
  chartType?: 'table' | 'bar' | 'line' | 'pie' | 'area';
  chartConfig?: {
    xKey?: string;
    yKey?: string;
    title?: string;
  };
  error?: string;
}

export interface GeminiAnalyzeResponse {
  summary?: string;
  insights?: string[];
  recommendations?: string[];
  error?: string;
}

export interface GeminiMappingResponse {
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
 * Get current user's company_id
 */
export const getCurrentCompanyId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return profile?.company_id || null;
  } catch {
    return null;
  }
};

/**
 * Check if Gemini API is configured
 */
export const checkGeminiStatus = async (): Promise<{ configured: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { type: 'status' }
    });
    
    if (error) {
      logger.error('Gemini status check error:', error);
      return { configured: false, message: error.message || 'Bağlantı hatası' };
    }
    
    return data || { configured: false, message: 'Yanıt alınamadı' };
  } catch (err: any) {
    logger.error('Gemini status check exception:', err);
    return { configured: false, message: err.message || 'Bağlantı hatası' };
  }
};

/**
 * Generate SQL query from natural language (legacy function name for compatibility)
 */
export const generateSQLFromQuery = async (
  userQuery: string
): Promise<SQLGenerationResult> => {
  try {
    const companyId = await getCurrentCompanyId();
    
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'sql',
        query: userQuery,
        model: 'gemini-2.5-flash',
        companyId // Add company_id to request
      }
    });
    
    if (error) {
      logger.error('SQL generation error:', error);
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
    logger.error('SQL generation exception:', err);
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
  tableName?: string,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiChatResponse> => {
  try {
    const companyId = await getCurrentCompanyId();

    // Step 1: Try template-based SQL first (no API call, instant response)
    const templateResult = tryGenerateSQLFromTemplate(query, tableName);
    if (templateResult) {
      logger.info('SQL generated from template (no API call):', query);
      return {
        sql: templateResult.sql,
        raw: templateResult.explanation
      };
    }

    // Step 2: Check cache
    const cacheKey = { query, tableName, model };
    const cached = geminiCache.get<GeminiChatResponse>('sql', cacheKey, companyId || undefined);

    if (cached) {
      logger.debug('SQL query cache hit:', query);
      return cached;
    }

    // Step 3: Cache miss - call Gemini API
    logger.debug('SQL query requires Gemini API:', query);
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'sql',
        query,
        tableName,
        model,
        companyId // Add company_id to request
      }
    });

    if (error) {
      logger.error('SQL generation error:', error);
      return { error: error.message };
    }

    // Cache successful response
    if (data && !data.error && companyId) {
      geminiCache.set('sql', cacheKey, data, companyId);
      logger.debug('SQL query cached:', query);
    }

    return data;
  } catch (err: any) {
    logger.error('SQL generation exception:', err);
    return { error: err.message };
  }
};

/**
 * Chat with AI
 */
export const chatWithAI = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = 'gemini-2.5-flash',
  pageContext?: {
    route: string;
    module?: string;
    entities?: string[];
    entityIds?: string[];
    pageData?: Record<string, any>;
  },
  aiRole?: string
): Promise<GeminiChatResponse> => {
  try {
    const companyId = await getCurrentCompanyId();

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'chat',
        messages,
        model,
        companyId, // Add company_id to request
        pageContext, // Add page context for context-aware AI
        aiRole // Add AI role for role-based system prompts
      }
    });

    if (error) {
      logger.error('Chat error:', error);
      return { error: error.message };
    }

    return data;
  } catch (err: any) {
    logger.error('Chat exception:', err);
    return { error: err.message };
  }
};

/**
 * Send a message to Gemini AI (simplified wrapper for chat interface)
 */
export const sendMessageToGemini = async (
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  contextPrompt?: string,
  pageContext?: {
    route: string;
    module?: string;
    entities?: string[];
    entityIds?: string[];
    pageData?: Record<string, any>;
  },
  aiRole?: string
): Promise<string> => {
  try {
    // Convert conversation history to the format expected by chatWithAI
    const messages = conversationHistory.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }));

    // Add context prompt as system message if provided
    if (contextPrompt) {
      messages.unshift({
        role: 'system' as const,
        content: contextPrompt
      });
    }

    // Add the new user message
    messages.push({
      role: 'user' as const,
      content: userMessage
    });

    const response = await chatWithAI(messages, 'gemini-2.5-flash', pageContext, aiRole);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.content || 'Üzgünüm, yanıt oluşturulamadı.';
  } catch (err: any) {
    logger.error('sendMessageToGemini error:', err);
    throw new Error(err.message || 'AI yanıt verirken bir hata oluştu');
  }
};

/**
 * Generate report with data analysis and visualization
 */
export const generateReport = async (
  query: string,
  context?: {
    startDate?: string;
    endDate?: string;
    currency?: string;
  },
  model: string = 'gemini-2.5-flash'
): Promise<GeminiReportResponse> => {
  try {
    const companyId = await getCurrentCompanyId();

    // Check cache first
    const cacheKey = { query, context, model };
    const cached = geminiCache.get<GeminiReportResponse>('report', cacheKey, companyId || undefined);

    if (cached) {
      logger.debug('Report cache hit:', query);
      return cached;
    }

    // Cache miss - call API
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'report',
        query,
        context,
        model,
        companyId
      }
    });

    if (error) {
      logger.error('Report generation error:', error);
      return { error: error.message };
    }

    // Cache successful response
    if (data && !data.error && companyId) {
      geminiCache.set('report', cacheKey, data, companyId);
      logger.debug('Report cached:', query);
    }

    return data;
  } catch (err: any) {
    logger.error('Report generation exception:', err);
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
  model: string = 'gemini-2.5-flash'
): Promise<GeminiAnalyzeResponse> => {
  try {
    const companyId = await getCurrentCompanyId();

    // Check cache first (use summary for cache key, not full data)
    const cacheKey = { tableName, summary, model, dataLength: data.length };
    const cached = geminiCache.get<GeminiAnalyzeResponse>('analyze', cacheKey, companyId || undefined);

    if (cached) {
      logger.debug('Analyze cache hit:', tableName);
      return cached;
    }

    // Cache miss - call API
    const { data: result, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'analyze',
        tableName,
        data,
        summary,
        model,
        companyId // Add company_id to request
      }
    });

    if (error) {
      logger.error('Analyze error:', error);
      return { error: error.message };
    }

    // Cache successful response
    if (result && !result.error && companyId) {
      geminiCache.set('analyze', cacheKey, result, companyId);
      logger.debug('Analyze cached:', tableName);
    }

    return result;
  } catch (err: any) {
    logger.error('Analyze exception:', err);
    return { error: err.message };
  }
};

/**
 * Map columns with AI
 */
export const mapColumnsWithAI = async (
  sourceColumns: string[],
  targetFields: Array<{ name: string; description: string }>,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiMappingResponse> => {
  try {
    const companyId = await getCurrentCompanyId();

    // Check cache first
    const cacheKey = { sourceColumns, targetFields, model };
    const cached = geminiCache.get<GeminiMappingResponse>('mapping', cacheKey, companyId || undefined);

    if (cached) {
      logger.debug('Column mapping cache hit:', sourceColumns.join(', '));
      return cached;
    }

    // Cache miss - call API
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'map-columns',
        sourceColumns,
        targetFields,
        model,
        companyId // Add company_id to request
      }
    });

    if (error) {
      logger.error('Column mapping error:', error);
      return { error: error.message };
    }

    // Cache successful response (24 hour TTL for mappings)
    if (data && !data.error && companyId) {
      geminiCache.set('mapping', cacheKey, data, companyId);
      logger.debug('Column mapping cached:', sourceColumns.join(', '));
    }

    return data;
  } catch (err: any) {
    logger.error('Column mapping exception:', err);
    return { error: err.message };
  }
};

/**
 * Test Gemini connection (now via edge function)
 */
export const testGeminiConnection = async (): Promise<boolean> => {
  const status = await checkGeminiStatus();
  return status.configured;
};

/**
 * Execute SQL Query against Supabase with company_id filter
 */
export const executeSQLQuery = async (sql: string): Promise<any[]> => {
  logger.debug('Executing SQL:', sql);

  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Şirket bilgisi bulunamadı');
    }

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
      'tasks', 'service_slips', 'activities', 'sales_invoices',
      'purchase_invoices', 'suppliers', 'vehicles', 'service_records'
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

    // IMPORTANT: Always add company_id filter for data isolation
    // Check if company_id column exists in the table
    query = query;

    // Parse WHERE clause and merge with company_id filter
    const whereMatch = sql.match(/where\s+(.+?)(?:\s+group|\s+order|\s+limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      
      // Simple equality check (additional filters)
      const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
      if (eqMatch && eqMatch[1] !== 'company_id') {
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
      logger.error('SQL execution error:', error);
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
    logger.error('Database query failed:', error);
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
  const companyId = await getCurrentCompanyId();

  for (const table of testTables) {
    try {
      let query = supabase.from(table).select('id').limit(1);
      if (companyId) {
        query = query;
      }
      const { data, error } = await query;
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
export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'En iyi fiyat/performans - Önerilen' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Hızlı ve hafif' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Güçlü ve dengeli' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'En hızlı ve akıllı (preview)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'En güçlü model (preview)' },
] as const;

/**
 * Chat with AI using conversation history context
 * This enables multi-turn conversations with context awareness
 */
export async function chatWithContext(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: {
    model?: string;
    includeSystemPrompt?: boolean;
  } = {}
): Promise<GeminiChatResponse> {
  try {
    const companyId = await getCurrentCompanyId();

    // Build messages array with context
    const messages = [];

    // Add system prompt if requested
    if (options.includeSystemPrompt !== false) {
      messages.push({
        role: 'system',
        content: `Sen PAFTA ERP sisteminin AI asistanısın. Türkçe konuşuyorsun.
Kullanıcılara işletme yönetimi, finansal analiz, CRM ve operasyonel sorularında yardımcı oluyorsun.
Database'de şu tablolar var: customers, suppliers, products, sales_invoices, einvoices, opportunities, activities, proposals, employees, tasks, service_requests.
Her zaman company_id filtresi ile çalış: ${companyId}
Yanıtlarını kısa, net ve Türkçe ver.`
      });
    }

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })));

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Call edge function with context
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'chat',
        message: message,
        history: recentHistory,
        model: options.model || 'gemini-2.5-flash',
        companyId: companyId
      }
    });

    if (error) {
      logger.error('Chat with context error:', error);
      return {
        error: error.message || 'Bir hata oluştu',
        configured: false
      };
    }

    return {
      content: data.content || data.response || '',
      raw: data.raw,
      configured: true
    };
  } catch (err: any) {
    logger.error('Chat with context exception:', err);
    return {
      error: err.message || 'Beklenmeyen bir hata oluştu',
      configured: false
    };
  }
}

// Backward compatibility exports
export const checkGroqStatus = checkGeminiStatus;
export const GROQ_MODELS = GEMINI_MODELS;

/**
 * Chat with AI using Server-Sent Events (SSE) for streaming responses
 */
export const chatWithAIStreaming = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = 'gemini-2.5-flash',
  pageContext?: {
    route: string;
    module?: string;
    entities?: string[];
    entityIds?: string[];
    pageData?: Record<string, any>;
  },
  aiRole?: string,
  onChunk?: (chunk: string) => void
): Promise<void> => {
  try {
    const companyId = await getCurrentCompanyId();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Oturum bulunamadı');
    }

    // Get Supabase URL from client config (more reliable than env var)
    const SUPABASE_URL = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;

    if (!SUPABASE_URL) {
      throw new Error('Supabase URL yapılandırılmamış');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        type: 'chat',
        messages,
        model,
        companyId,
        pageContext,
        aiRole,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Stream okuyucu oluşturulamadı');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content && onChunk) {
              onChunk(content);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err: any) {
    logger.error('Streaming chat exception:', err);
    throw err;
  }
};
