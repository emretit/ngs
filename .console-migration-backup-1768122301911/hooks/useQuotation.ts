/**
 * useQuotation Hook
 * 
 * Manages quotation CRUD operations and state management.
 * Handles quotation creation, updates, and PDF generation.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Quotation {
  id: string;
  project_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_company?: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useQuotation = (quotationId?: string) => {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    if (quotationId && quotations.length > 0) {
      const found = quotations.find(q => q.id === quotationId);
      setQuotation(found || null);
    }
  }, [quotationId, quotations]);

  const loadQuotations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('project_id', '00000000-0000-0000-0000-000000000001')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error: any) {
      console.error('Error loading quotations:', error);
      toast.error('Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  const createQuotation = async (quotationData: Partial<Quotation>) => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .insert({
          project_id: '00000000-0000-0000-0000-000000000001',
          ...quotationData,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Quotation created successfully');
      await loadQuotations();
      return data;
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      toast.error('Failed to create quotation');
      throw error;
    }
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Quotation updated successfully');
      await loadQuotations();
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      toast.error('Failed to update quotation');
      throw error;
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Quotation deleted successfully');
      await loadQuotations();
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      toast.error('Failed to delete quotation');
      throw error;
    }
  };

  const calculateTotals = (items: QuotationItem[], taxRate = 0.18) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  return {
    quotation,
    quotations,
    isLoading,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    calculateTotals,
    refreshQuotations: loadQuotations,
  };
};