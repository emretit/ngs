import { supabase } from '@/integrations/supabase/client';

export interface GeminiChatResponse {
  content?: string;
  sql?: string;
  raw?: string;
  error?: string;
  configured?: boolean;
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:57',message:'checkGeminiStatus entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:59',message:'invoking gemini-chat status',data:{functionName:'gemini-chat',bodyType:'status'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { type: 'status' }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:63',message:'status check response',data:{hasError:!!error,errorMessage:error?.message||'none',errorStatus:error?.status||'none',hasData:!!data,configured:data?.configured},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'S'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      console.error('Gemini status check error:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:65',message:'status check error detected',data:{errorMessage:error.message,errorStatus:error.status||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'T'})}).catch(()=>{});
      // #endregion
      return { configured: false, message: error.message || 'Bağlantı hatası' };
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:68',message:'status check success',data:{configured:data?.configured,message:data?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'U'})}).catch(()=>{});
    // #endregion
    return data || { configured: false, message: 'Yanıt alınamadı' };
  } catch (err: any) {
    console.error('Gemini status check exception:', err);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:70',message:'status check exception',data:{errorMessage:err.message,errorType:err.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'V'})}).catch(()=>{});
    // #endregion
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
  tableName?: string,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiChatResponse> => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:128',message:'generateSQLQuery entry',data:{query,tableName,model},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const companyId = await getCurrentCompanyId();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:134',message:'companyId retrieved',data:{companyId:companyId||'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:136',message:'invoking gemini-chat function',data:{functionName:'gemini-chat',bodyType:'sql'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { 
        type: 'sql', 
        query,
        tableName,
        model,
        companyId // Add company_id to request
      }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:145',message:'function invoke response',data:{hasError:!!error,errorMessage:error?.message||'none',hasData:!!data,dataKeys:data?Object.keys(data):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      console.error('SQL generation error:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:147',message:'error detected',data:{errorType:error.constructor?.name,errorMessage:error.message,errorStatus:error.status||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return { error: error.message };
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:151',message:'returning success data',data:{hasSql:!!data?.sql,hasError:!!data?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return data;
  } catch (err: any) {
    console.error('SQL generation exception:', err);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'geminiService.ts:153',message:'exception caught',data:{errorType:err.constructor?.name,errorMessage:err.message,errorStack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return { error: err.message };
  }
};

/**
 * Chat with AI
 */
export const chatWithAI = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiChatResponse> => {
  try {
    const companyId = await getCurrentCompanyId();
    
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { 
        type: 'chat', 
        messages,
        model,
        companyId // Add company_id to request
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
  model: string = 'gemini-2.5-flash'
): Promise<GeminiAnalyzeResponse> => {
  try {
    const companyId = await getCurrentCompanyId();
    
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
  model: string = 'gemini-2.5-flash-lite'
): Promise<GeminiMappingResponse> => {
  try {
    const companyId = await getCurrentCompanyId();
    
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
  console.log('Executing SQL:', sql);

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
    query = query.eq('company_id', companyId);

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
  const companyId = await getCurrentCompanyId();

  for (const table of testTables) {
    try {
      let query = supabase.from(table).select('id').limit(1);
      if (companyId) {
        query = query.eq('company_id', companyId);
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
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Hızlı ve dengeli - Günlük kullanım için ideal' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'En güçlü model - Karmaşık analiz için' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'En hızlı - Basit görevler için' },
] as const;

// Backward compatibility exports
export const checkGroqStatus = checkGeminiStatus;
export const GROQ_MODELS = GEMINI_MODELS;
