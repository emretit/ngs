import { useCallback } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import type { ModuleReportOptions, ModuleType } from './config';
import { moduleConfig } from './config';

/**
 * Module Report - Data Fetching
 * Modül verilerini çekme işlemleri
 */

export const useModuleReportData = () => {
  const fetchModuleData = useCallback(async (options: ModuleReportOptions) => {
    const { module, startDate, endDate } = options;
    const config = moduleConfig[module];

    let query = supabase
      .from(config.tableName)
      .select(config.relations || "*");

    // Date filter için uygun alanı belirle
    const dateFields = ["created_at", "invoice_date", "service_date", "hire_date"];
    const hasDateFilter = startDate && endDate;
    
    if (hasDateFilter) {
      // Tabloda hangi tarih alanı varsa ona göre filtrele
      for (const field of dateFields) {
        if (Object.keys(config.columns).includes(field) || field === "created_at") {
          query = query
            .gte(field, startDate)
            .lte(field, endDate);
          break;
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`Error fetching ${module} data:`, error);
      return [];
    }

    return data || [];
  }, []);

  const getRecordCount = useCallback(async (module: ModuleType): Promise<number> => {
    const config = moduleConfig[module];
    const { count, error } = await supabase
      .from(config.tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.error(`Error getting count for ${module}:`, error);
      return 0;
    }

    return count || 0;
  }, []);

  return {
    fetchModuleData,
    getRecordCount
  };
};
