import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ParameterCategory {
  key: string;
  label: string;
  description: string;
  icon?: string;
  color?: string;
}

// Sistem parametre kategorileri
export const PARAMETER_CATEGORIES: ParameterCategory[] = [
  {
    key: 'formats',
    label: 'Numara Formatları',
    description: 'Teklif, fatura, servis gibi kayıtların numara formatları',
    icon: '📄',
    color: 'blue'
  },
  {
    key: 'general',
    label: 'Genel Ayarlar',
    description: 'Sistem genel ayarları ve tercihleri',
    icon: '⚙️',
    color: 'gray'
  },
  {
    key: 'financial',
    label: 'Finansal Ayarlar',
    description: 'Vergi oranları, döviz ayarları, finansal parametreler',
    icon: '💰',
    color: 'green'
  },
  {
    key: 'workflow',
    label: 'İş Akışı',
    description: 'Onay süreçleri, otomatik işlemler',
    icon: '🔄',
    color: 'purple'
  },
  {
    key: 'sequences',
    label: 'Sıralı Numaralar',
    description: 'Otomatik üretilen sıralı numaralar',
    icon: '🔢',
    color: 'orange'
  }
];

export interface SystemParameter {
  id: string;
  company_id: string;
  parameter_key: string;
  parameter_value: string | null;
  parameter_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description: string | null;
  is_system_parameter: boolean;
  is_editable: boolean;
  validation_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ParameterValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  customValidator?: (value: any) => boolean;
}

export interface CreateParameterData {
  parameter_key: string;
  parameter_value?: string;
  parameter_type?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category?: string;
  description?: string;
}

export interface UpdateParameterData {
  parameter_value?: string;
  parameter_type?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category?: string;
  description?: string;
}

export const useSystemParameters = () => {
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchParameters = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);

      const companyId = user?.user_metadata?.company_id;
      if (!companyId) {
        setParameters([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('system_parameters')
        .select('*')
        .eq('company_id', companyId)
        .order('category', { ascending: true })
        .order('parameter_key', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setParameters(data || []);
    } catch (err) {
      console.error('Error fetching system parameters:', err);
      setError(err instanceof Error ? err.message : 'Parametreler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createParameter = async (data: CreateParameterData) => {
    try {
      const { data: result, error: createError } = await supabase
        .from('system_parameters')
        .insert({
          ...data,
          company_id: user?.user_metadata?.company_id,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setParameters(prev => [...prev, result]);
      return result;
    } catch (err) {
      console.error('Error creating parameter:', err);
      throw err;
    }
  };

  const updateParameter = async (id: string, data: UpdateParameterData) => {
    try {
      const { data: result, error: updateError } = await supabase
        .from('system_parameters')
        .update({
          ...data,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setParameters(prev => prev.map(param =>
        param.id === id ? result : param
      ));
      return result;
    } catch (err) {
      console.error('Error updating parameter:', err);
      throw err;
    }
  };

  const deleteParameter = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('system_parameters')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setParameters(prev => prev.filter(param => param.id !== id));
    } catch (err) {
      console.error('Error deleting parameter:', err);
      throw err;
    }
  };

  const getParameterValue = (key: string, defaultValue?: any) => {
    const parameter = parameters.find(p => p.parameter_key === key);
    if (!parameter || parameter.parameter_value === null) {
      return defaultValue;
    }

    // Type conversion based on parameter_type
    switch (parameter.parameter_type) {
      case 'number':
        return Number(parameter.parameter_value);
      case 'boolean':
        return parameter.parameter_value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(parameter.parameter_value);
        } catch {
          return parameter.parameter_value;
        }
      case 'array':
        try {
          return JSON.parse(parameter.parameter_value);
        } catch {
          return parameter.parameter_value.split(',');
        }
      default:
        return parameter.parameter_value;
    }
  };

  const getParametersByCategory = (category: string) => {
    return parameters.filter(p => p.category === category);
  };

  useEffect(() => {
    if (user) {
      fetchParameters();
    }
  }, [user, fetchParameters]);

  // Parametreleri JSON olarak export etme
  const exportParameters = (selectedCategories?: string[]): string => {
    const paramsToExport = selectedCategories
      ? parameters.filter(p => selectedCategories.includes(p.category))
      : parameters;

    const exportData = paramsToExport.map(param => ({
      parameter_key: param.parameter_key,
      parameter_value: param.parameter_value,
      parameter_type: param.parameter_type,
      category: param.category,
      description: param.description,
      is_editable: param.is_editable,
      validation_rules: param.validation_rules,
    }));

    return JSON.stringify(exportData, null, 2);
  };

  // Parametreleri JSON'dan import etme
  const importParameters = async (jsonData: string): Promise<void> => {
    try {
      const importData = JSON.parse(jsonData);

      if (!Array.isArray(importData)) {
        throw new Error('Geçersiz JSON formatı');
      }

      for (const param of importData) {
        if (!param.parameter_key || param.parameter_value === undefined) {
          continue; // Geçersiz parametre atla
        }

        await supabase
          .from('system_parameters')
          .upsert({
            parameter_key: param.parameter_key,
            parameter_value: param.parameter_value,
            parameter_type: param.parameter_type || 'string',
            category: param.category || 'general',
            description: param.description,
            is_editable: param.is_editable !== false,
            validation_rules: param.validation_rules || {},
            company_id: user?.user_metadata?.company_id,
            updated_by: user?.id,
          }, {
            onConflict: 'company_id,parameter_key'
          });
      }

      await fetchParameters(); // Listeyi yenile
    } catch (error) {
      console.error('Import error:', error);
      throw new Error('Parametreler içe aktarılırken hata oluştu');
    }
  };

  // Parametreleri varsayılan değerlere sıfırlama
  const resetToDefaults = async (): Promise<void> => {
    try {
      // Önce mevcut tüm editable parametreleri sil
      const { error: deleteError } = await supabase
        .from('system_parameters')
        .delete()
        .eq('company_id', user?.user_metadata?.company_id)
        .eq('is_editable', true);

      if (deleteError) throw deleteError;

      // Varsayılan parametreleri yeniden oluştur
      await supabase.rpc('initialize_default_parameters', {
        target_company_id: user?.user_metadata?.company_id
      });

      await fetchParameters(); // Listeyi yenile
    } catch (error) {
      console.error('Reset error:', error);
      throw new Error('Parametreler varsayılana sıfırlanırken hata oluştu');
    }
  };

  return {
    parameters,
    loading,
    error,
    fetchParameters,
    createParameter,
    updateParameter,
    deleteParameter,
    getParameterValue,
    getParametersByCategory,
    exportParameters,
    importParameters,
    resetToDefaults,
    refetch: () => fetchParameters(),
  };
};
