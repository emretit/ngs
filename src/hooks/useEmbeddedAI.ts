import { useState, useCallback } from 'react';
import { analyzeSupabaseData, analyzeMultipleTables, DataAnalysisResult } from '@/services/embeddedAIService';
import { checkGroqStatus } from '@/services/groqService';

export const useEmbeddedAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState({ loaded: false, loading: true });

  // Check model status on mount
  const checkStatus = useCallback(async () => {
    const status = await checkGroqStatus();
    setModelStatus({ loaded: status.configured, loading: false });
    return { loaded: status.configured, loading: false, message: status.message };
  }, []);

  const analyzeTable = useCallback(async (
    tableName: string,
    query?: {
      select?: string;
      filters?: Record<string, any>;
      limit?: number;
    }
  ): Promise<DataAnalysisResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await analyzeSupabaseData(tableName, query);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeTables = useCallback(async (
    tables: Array<{ name: string; query?: any }>
  ): Promise<Record<string, DataAnalysisResult>> => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await analyzeMultipleTables(tables);
      return results;
    } catch (err: any) {
      setError(err.message);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzeTable,
    analyzeTables,
    checkStatus,
    loading,
    error,
    modelStatus
  };
};
