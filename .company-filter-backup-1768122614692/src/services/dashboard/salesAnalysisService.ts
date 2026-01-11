import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface MonthlySalesData {
  month: string;
  sales: number;
  opportunities: number;
  proposals: number;
  orders: number;
  customers: number;
}

export interface SalesAnalysisFilters {
  timePeriod: string; // '3', '6', '12', '24'
  startDate?: Date;
  endDate?: Date;
}

/**
 * Satış analizi verileri çeker
 * - Fırsatlar (opportunities)
 * - Teklifler (proposals) 
 * - Siparişler (orders)
 * - Müşteriler (unique customers)
 * - Satış tutarı (from orders)
 */
export async function fetchSalesAnalysisData(
  filters: SalesAnalysisFilters = { timePeriod: '6' }
): Promise<MonthlySalesData[]> {
  try {
    const monthCount = parseInt(filters.timePeriod);
    const today = new Date();
    const startDate = filters.startDate || subMonths(startOfMonth(today), monthCount - 1);
    const endDate = filters.endDate || endOfMonth(today);

    // Get current user's company_id from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company not found');

    const companyId = profile.company_id;

    // Fetch opportunities
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, created_at, value, customer_id')
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    if (oppError) throw oppError;

    // Fetch proposals
    const { data: proposals, error: propError } = await supabase
      .from('proposals')
      .select('id, created_at, total_amount, customer_id')
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    if (propError) throw propError;

    // Fetch orders
    const { data: orders, error: ordError } = await supabase
      .from('orders')
      .select('id, order_date, total_amount, customer_id')
      .eq('company_id', companyId)
      .gte('order_date', format(startDate, 'yyyy-MM-dd'))
      .lte('order_date', format(endDate, 'yyyy-MM-dd'))
      .order('order_date');

    if (ordError) throw ordError;

    // Generate monthly data
    const monthlyData: { [key: string]: MonthlySalesData } = {};
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Initialize months
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      const year = String(date.getFullYear()).slice(-2);
      const key = `${monthName}'${year}`;
      
      monthlyData[key] = {
        month: key,
        sales: 0,
        opportunities: 0,
        proposals: 0,
        orders: 0,
        customers: 0
      };
    }

    // Track unique customers per month
    const monthlyCustomers: { [key: string]: Set<string> } = {};

    // Process opportunities
    opportunities?.forEach(opp => {
      const date = new Date(opp.created_at);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      const year = String(date.getFullYear()).slice(-2);
      const key = `${monthName}'${year}`;
      
      if (monthlyData[key]) {
        monthlyData[key].opportunities++;
        if (opp.customer_id) {
          if (!monthlyCustomers[key]) monthlyCustomers[key] = new Set();
          monthlyCustomers[key].add(opp.customer_id);
        }
      }
    });

    // Process proposals
    proposals?.forEach(prop => {
      const date = new Date(prop.created_at);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      const year = String(date.getFullYear()).slice(-2);
      const key = `${monthName}'${year}`;
      
      if (monthlyData[key]) {
        monthlyData[key].proposals++;
        if (prop.customer_id) {
          if (!monthlyCustomers[key]) monthlyCustomers[key] = new Set();
          monthlyCustomers[key].add(prop.customer_id);
        }
      }
    });

    // Process orders
    orders?.forEach(order => {
      const date = new Date(order.order_date);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      const year = String(date.getFullYear()).slice(-2);
      const key = `${monthName}'${year}`;
      
      if (monthlyData[key]) {
        monthlyData[key].orders++;
        monthlyData[key].sales += Number(order.total_amount) || 0;
        if (order.customer_id) {
          if (!monthlyCustomers[key]) monthlyCustomers[key] = new Set();
          monthlyCustomers[key].add(order.customer_id);
        }
      }
    });

    // Add customer counts
    Object.keys(monthlyCustomers).forEach(key => {
      if (monthlyData[key]) {
        monthlyData[key].customers = monthlyCustomers[key].size;
      }
    });

    return Object.values(monthlyData);
  } catch (error) {
    logger.error('Error fetching sales analysis data:', error);
    throw error;
  }
}

