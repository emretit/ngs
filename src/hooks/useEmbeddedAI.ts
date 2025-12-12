import { useState, useEffect } from 'react';
import { analyzeSupabaseData, analyzeMultipleTables, DataAnalysisResult, getModelStatus } from '@/services/embeddedAIService';

export const useEmbeddedAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState({ loaded: false, loading: true });

  // Check model status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const status = await getModelStatus();
    setModelStatus({ loaded: status.loaded, loading: false });
    return { loaded: status.loaded, loading: false, message: status.loaded ? 'Gemini API hazır' : 'Gemini API yapılandırılmadı' };
  };

  const analyzeTable = async (
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
  };

  const analyzeTables = async (
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
  };

  return {
    analyzeTable,
    analyzeTables,
    checkStatus,
    loading,
    error,
    modelStatus
  };
};
