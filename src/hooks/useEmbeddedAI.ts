import { useState, useCallback } from 'react';
import { analyzeSupabaseData, analyzeMultipleTables, getModelStatus, DataAnalysisResult } from '@/services/embeddedAIService';

export const useEmbeddedAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState(getModelStatus());

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
      setModelStatus(getModelStatus());
      
      const result = await analyzeSupabaseData(tableName, query);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
      setModelStatus(getModelStatus());
    }
  }, []);

  const analyzeTables = useCallback(async (
    tables: Array<{ name: string; query?: any }>
  ): Promise<Record<string, DataAnalysisResult>> => {
    try {
      setLoading(true);
      setError(null);
      setModelStatus(getModelStatus());
      
      const results = await analyzeMultipleTables(tables);
      return results;
    } catch (err: any) {
      setError(err.message);
      return {};
    } finally {
      setLoading(false);
      setModelStatus(getModelStatus());
    }
  }, []);

  return {
    analyzeTable,
    analyzeTables,
    loading,
    error,
    modelStatus
  };
};

