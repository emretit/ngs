import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface MonthlyFinancial {
  id: string;
  user_id: string;
  year: number;
  month: number;
  category: string;
  subcategory: string | null;
  amount: number;
  target_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMonthlyFinancialData {
  year: number;
  month: number;
  category: string;
  subcategory?: string;
  amount: number;
  target_amount?: number;
  notes?: string;
}

export const useMonthlyFinancials = () => {
  const [financials, setFinancials] = useState<MonthlyFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFinancials = async (year?: number, month?: number) => {
    try {
      logger.debug('fetchFinancials called with year:', year, 'month:', month);
      setLoading(true);
      setError(null);
      
      // For now, create mock data without authentication
      const mockData: MonthlyFinancial[] = [];
      
      // Generate some sample data for demonstration
      const categories = ['revenue', 'cogs', 'opex', 'net_profit'];
      const subcategories = {
        revenue: ['Product Sales', 'Service Revenue'],
        cogs: ['Direct Materials', 'Direct Labor'],
        opex: ['Salaries', 'Rent', 'Utilities'],
        net_profit: ['']
      };
      
      if (year) {
        categories.forEach(category => {
          const subs = subcategories[category as keyof typeof subcategories] || [''];
          subs.forEach(subcategory => {
            for (let month = 1; month <= 12; month++) {
              mockData.push({
                id: `${category}-${subcategory}-${year}-${month}`,
                user_id: 'mock-user',
                year: year,
                month: month,
                category: category,
                subcategory: subcategory || null,
                amount: Math.floor(Math.random() * 10000),
                target_amount: null,
                notes: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          });
        });
      }
      
      logger.debug('Setting mock financials data:', mockData);
      setFinancials(mockData);
    } catch (err: any) {
      logger.error('fetchFinancials error:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch financial data: " + err.message,
      });
    } finally {
      logger.debug('fetchFinancials completed, setting loading to false');
      setLoading(false);
    }
  };

  const upsertFinancial = async (data: CreateMonthlyFinancialData) => {
    try {
      // For now, just update local state without database operation
      const mockResult: MonthlyFinancial = {
        id: `${data.category}-${data.subcategory || ''}-${data.year}-${data.month}`,
        user_id: 'mock-user',
        year: data.year,
        month: data.month,
        category: data.category,
        subcategory: data.subcategory || null,
        amount: data.amount,
        target_amount: data.target_amount || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update local state
      setFinancials(prev => {
        const index = prev.findIndex(f => 
          f.user_id === mockResult.user_id && 
          f.year === mockResult.year && 
          f.month === mockResult.month && 
          f.category === mockResult.category && 
          f.subcategory === mockResult.subcategory
        );
        
        if (index >= 0) {
          const newFinancials = [...prev];
          newFinancials[index] = mockResult;
          return newFinancials;
        } else {
          return [...prev, mockResult];
        }
      });

      toast({
        title: "Success",
        description: "Financial data updated successfully",
      });
      
      return mockResult;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update financial data: " + err.message,
      });
      throw err;
    }
  };

  const deleteFinancial = async (id: string) => {
    try {
      // For now, just update local state without database operation
      setFinancials(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Financial data deleted successfully",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete financial data: " + err.message,
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  return {
    financials,
    loading,
    error,
    upsertFinancial,
    deleteFinancial,
    refetch: fetchFinancials,
  };
};