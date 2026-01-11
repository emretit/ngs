import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface CashflowMainItem {
  id: string;
  user_id: string;
  year: number;
  month: number;
  main_category: string;
  subcategory: string;
  value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useCashflowMain = () => {
  const [data, setData] = useState<CashflowMainItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCashflowMain = async (year?: number) => {
    try {
      setLoading(true);
      setError(null);

      // For now, create mock data without authentication
      const mockData: CashflowMainItem[] = [];
      
      // Create sample data for demonstration
      const mainCategories = [
        'opening_balance',
        'operating_inflows', 
        'operating_outflows',
        'investing_activities',
        'financing_activities'
      ];
      
      const subcategories = {
        opening_balance: ['Nakit ve Nakit Benzerleri'],
        operating_inflows: ['Ürün Satışları', 'Hizmet Gelirleri'],
        operating_outflows: ['Operasyonel Giderler (OPEX)', 'Personel Giderleri'],
        investing_activities: ['Demirbaş/Makine Alımları'],
        financing_activities: ['Kredi Ödemeleri', 'Sermaye Artırımları']
      };

      if (year) {
        mainCategories.forEach((category, categoryIndex) => {
          const subs = subcategories[category as keyof typeof subcategories] || [''];
          subs.forEach((subcategory, subIndex) => {
            for (let month = 1; month <= 12; month++) {
              // Create deterministic values based on category, subcategory, and month
              const baseValue = (categoryIndex + 1) * 10000 + (subIndex + 1) * 1000 + month * 100;
              const value = category === 'operating_outflows' ? baseValue * 0.8 : baseValue;
              
              mockData.push({
                id: `${category}-${subcategory}-${year}-${month}`,
                user_id: 'mock-user',
                year: year,
                month: month,
                main_category: category,
                subcategory: subcategory,
                value: Math.floor(value),
                description: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          });
        });
      }

      setData(mockData);
    } catch (err: any) {
      logger.error('fetchCashflowMain error:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Nakit akış verileri alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const upsertCashflowMain = async (
    year: number,
    month: number,
    main_category: string,
    subcategory: string,
    value: number,
    description?: string
  ) => {
    try {
      // For now, just update local state without database operation
      const mockData: CashflowMainItem = {
        id: `${main_category}-${subcategory}-${year}-${month}`,
        user_id: 'mock-user',
        year,
        month,
        main_category,
        subcategory,
        value,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update local state
      setData(prev => {
        const exists = prev.find(item => 
          item.year === year && 
          item.month === month && 
          item.main_category === main_category &&
          item.subcategory === subcategory
        );

        if (exists) {
          return prev.map(item => 
            item.id === exists.id ? mockData : item
          );
        } else {
          return [...prev, mockData];
        }
      });

      toast({
        title: "Başarılı",
        description: "Nakit akış verisi güncellendi.",
      });

      return mockData;
    } catch (err: any) {
      logger.error('upsertCashflowMain error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Nakit akış verisi güncellenirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  const deleteCashflowMain = async (id: string) => {
    try {
      // For now, just update local state without database operation
      setData(prev => prev.filter(item => item.id !== id));

      toast({
        title: "Başarılı",
        description: "Nakit akış verisi silindi.",
      });
    } catch (err: any) {
      logger.error('deleteCashflowMain error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Nakit akış verisi silinirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  const refetch = (year?: number) => {
    return fetchCashflowMain(year);
  };

  useEffect(() => {
    fetchCashflowMain(new Date().getFullYear());
  }, []);

  return {
    data,
    loading,
    error,
    upsertCashflowMain,
    deleteCashflowMain,
    refetch,
  };
};