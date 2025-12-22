/**
 * Sales Reports Service
 * Supabase sorguları ve veri işleme fonksiyonları
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  GlobalFilters,
  SalesPerformanceData,
  SalesFunnelData,
  SalesRepPerformanceData,
  ProposalAnalysisData,
  ForecastData,
  LostSalesData,
  CustomerSalesReportData,
} from "@/types/salesReports";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

/**
 * Get current user's company ID
 */
async function getCompanyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  return profile?.company_id || null;
}

/**
 * Build base query with company filter
 */
async function buildBaseQuery(table: string) {
  const companyId = await getCompanyId();
  let query = supabase.from(table).select('*');
  
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  
  return query;
}

/**
 * Apply date filters to query
 */
function applyDateFilters(query: any, filters: GlobalFilters) {
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  return query;
}

/**
 * Apply employee filter
 */
function applyEmployeeFilter(query: any, employeeId?: string) {
  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }
  return query;
}

/**
 * Apply customer filter
 */
function applyCustomerFilter(query: any, customerId?: string) {
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  return query;
}

/**
 * Apply stage filter (uses status field in database)
 */
function applyStageFilter(query: any, stage?: string) {
  if (stage) {
    // Map funnel stage names to database status values
    const statusMap: Record<string, string> = {
      'open': 'new',
      'qualified': 'meeting_visit',
      'proposal': 'proposal',
      'negotiation': 'negotiation',
      'won': 'won',
      'lost': 'lost',
    };
    const status = statusMap[stage] || stage;
    query = query.eq('status', status);
  }
  return query;
}

/**
 * Apply currency filter
 */
function applyCurrencyFilter(query: any, currency?: string) {
  if (currency) {
    query = query.eq('currency', currency);
  }
  return query;
}

/**
 * Fetch Sales Performance Data
 */
export async function fetchSalesPerformanceData(
  filters: GlobalFilters
): Promise<SalesPerformanceData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return {
      totalSales: 0,
      dealCount: 0,
      winRate: 0,
      avgDealSize: 0,
      avgClosingTime: 0,
      salesOverTime: [],
      trends: {
        totalSales: { current: 0, previous: 0, change: 0 },
        dealCount: { current: 0, previous: 0, change: 0 },
        winRate: { current: 0, previous: 0, change: 0 },
      },
    };
  }

  // Get current period data
  let currentQuery = supabase
    .from('opportunities')
    .select('*, sales_invoices(total_amount, currency)')
    .eq('company_id', companyId)
    .in('status', ['won', 'closed']);

  currentQuery = applyDateFilters(currentQuery, filters);
  currentQuery = applyEmployeeFilter(currentQuery, filters.salesRepId);
  currentQuery = applyCustomerFilter(currentQuery, filters.customerId);
  currentQuery = applyStageFilter(currentQuery, filters.salesStage);
  currentQuery = applyCurrencyFilter(currentQuery, filters.currency);

  const { data: currentData } = await currentQuery;

  // Calculate previous period for comparison
  const startDate = filters.startDate ? new Date(filters.startDate) : subDays(new Date(), 30);
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - periodDays);
  const prevEndDate = new Date(startDate);

  let prevQuery = supabase
    .from('opportunities')
    .select('*, sales_invoices(total_amount, currency)')
    .eq('company_id', companyId)
    .in('status', ['won', 'closed'])
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString());

  prevQuery = applyEmployeeFilter(prevQuery, filters.salesRepId);
  prevQuery = applyCustomerFilter(prevQuery, filters.customerId);
  prevQuery = applyStageFilter(prevQuery, filters.salesStage);
  prevQuery = applyCurrencyFilter(prevQuery, filters.currency);

  const { data: prevData } = await prevQuery;

  // Process current period
  const currentDeals = currentData || [];
  const totalSales = currentDeals.reduce((sum, opp) => {
    const invoiceAmount = opp.sales_invoices?.reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0) || 0;
    return sum + (opp.value || invoiceAmount || 0);
  }, 0);
  const dealCount = currentDeals.length;
  const avgDealSize = dealCount > 0 ? totalSales / dealCount : 0;

  // Calculate win rate (won / (won + lost))
  const { data: allCurrentOpps } = await supabase
    .from('opportunities')
    .select('status')
    .eq('company_id', companyId);
  
  const allCurrent = allCurrentOpps || [];
  const won = allCurrent.filter((o: any) => o.status === 'won').length;
  const lost = allCurrent.filter((o: any) => o.status === 'lost').length;
  const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;

  // Calculate average closing time (simplified - using created_at to updated_at)
  const closedDeals = currentDeals.filter((o: any) => o.updated_at && o.created_at);
  const avgClosingTime = closedDeals.length > 0
    ? closedDeals.reduce((sum, opp) => {
        const days = Math.ceil(
          (new Date(opp.updated_at).getTime() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / closedDeals.length
    : 0;

  // Sales over time (group by day)
  const salesOverTimeMap = new Map<string, { amount: number; count: number }>();
  currentDeals.forEach((opp: any) => {
    const date = format(new Date(opp.created_at), 'yyyy-MM-dd');
    const amount = opp.value || 0;
    const existing = salesOverTimeMap.get(date) || { amount: 0, count: 0 };
    salesOverTimeMap.set(date, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  });

  const salesOverTime = Array.from(salesOverTimeMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Process previous period
  const prevDeals = prevData || [];
  const prevTotalSales = prevDeals.reduce((sum, opp) => {
    const invoiceAmount = opp.sales_invoices?.reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0) || 0;
    return sum + (opp.value || invoiceAmount || 0);
  }, 0);
  const prevDealCount = prevDeals.length;

  const { data: allPrevOpps } = await supabase
    .from('opportunities')
    .select('status')
    .eq('company_id', companyId)
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString());
  
  const allPrev = allPrevOpps || [];
  const prevWon = allPrev.filter((o: any) => o.status === 'won').length;
  const prevLost = allPrev.filter((o: any) => o.status === 'lost').length;
  const prevWinRate = (prevWon + prevLost) > 0 ? (prevWon / (prevWon + prevLost)) * 100 : 0;

  return {
    totalSales,
    dealCount,
    winRate,
    avgDealSize,
    avgClosingTime,
    salesOverTime,
    trends: {
      totalSales: {
        current: totalSales,
        previous: prevTotalSales,
        change: prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0,
      },
      dealCount: {
        current: dealCount,
        previous: prevDealCount,
        change: prevDealCount > 0 ? ((dealCount - prevDealCount) / prevDealCount) * 100 : 0,
      },
      winRate: {
        current: winRate,
        previous: prevWinRate,
        change: prevWinRate > 0 ? ((winRate - prevWinRate) / prevWinRate) * 100 : 0,
      },
    },
  };
}

/**
 * Fetch Sales Funnel Data
 */
export async function fetchSalesFunnelData(
  filters: GlobalFilters
): Promise<SalesFunnelData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return {
      stages: [],
      totalPipelineValue: 0,
      totalDeals: 0,
      lostDealsCount: 0,
      lostDealsValue: 0,
    };
  }

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('company_id', companyId);

  query = applyDateFilters(query, filters);
  query = applyEmployeeFilter(query, filters.salesRepId);
  query = applyCustomerFilter(query, filters.customerId);
  query = applyCurrencyFilter(query, filters.currency);

  const { data } = await query;

  const opportunities = data || [];
  
  // Map database status to funnel stage names
  const statusToStageMap: Record<string, string> = {
    'new': 'open',
    'meeting_visit': 'qualified',
    'proposal': 'proposal',
    'negotiation': 'negotiation',
    'won': 'won',
    'lost': 'lost',
  };
  
  const stageMap = new Map<string, { count: number; value: number }>();
  
  opportunities.forEach((opp: any) => {
    const status = opp.status || 'new';
    const stage = statusToStageMap[status] || 'open';
    const existing = stageMap.get(stage) || { count: 0, value: 0 };
    stageMap.set(stage, {
      count: existing.count + 1,
      value: existing.value + (opp.value || 0),
    });
  });

  const stageLabels: Record<string, string> = {
    open: 'Açık',
    qualified: 'Görüşme ve Ziyaret',
    proposal: 'Teklif',
    negotiation: 'Müzakere',
    won: 'Kazanıldı',
    lost: 'Kaybedildi',
  };

  // Huni sadece aktif satış aşamalarını içermeli - 'lost' ayrı analiz edilir
  const stageOrder = ['open', 'qualified', 'proposal', 'negotiation', 'won'];
  
  // Calculate average days in each stage
  const stageDurations = new Map<string, number[]>();
  const now = new Date();
  
  opportunities.forEach((opp: any) => {
    const status = opp.status || 'new';
    const stage = statusToStageMap[status] || 'open';
    
    // Calculate days in current stage (simplified: using updated_at as proxy)
    // For more accurate tracking, we'd need status change history
    const updatedAt = new Date(opp.updated_at || opp.created_at);
    const daysInStage = Math.ceil((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (!stageDurations.has(stage)) {
      stageDurations.set(stage, []);
    }
    stageDurations.get(stage)!.push(daysInStage);
  });
  
  // Calculate average days and identify bottlenecks
  const avgDaysByStage = new Map<string, number>();
  stageDurations.forEach((durations, stage) => {
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    avgDaysByStage.set(stage, avg);
  });
  
  // Identify bottlenecks: stages with low conversion rate (< 50%) or high avg days (> 30)
  const bottlenecks = new Set<string>();
  const avgDaysThreshold = 30;
  const conversionThreshold = 50;

  const stages = stageOrder
    .map((stage, index) => {
      const data = stageMap.get(stage) || { count: 0, value: 0 };
      const prevStage = index > 0 ? stageOrder[index - 1] : null;
      const prevData = prevStage ? stageMap.get(prevStage) : null;

      // Dönüşüm oranı: Bir önceki aşamadan bu aşamaya geçiş
      // Not: Mantıklı bir hunide bu oran %100'ü geçmemeli (fırsatlar kaybolur, çoğalmaz)
      // Ama veri tutarsızlığı durumunda %100 ile sınırlıyoruz
      let conversionRate = undefined;
      if (prevData && prevData.count > 0) {
        const rawRate = (data.count / prevData.count) * 100;
        // Eğer %100'ü aşıyorsa, veri tutarsızlığı var demektir
        conversionRate = Math.min(rawRate, 100);
      }
      
      const avgDays = avgDaysByStage.get(stage);
      const isBottleneck = (conversionRate !== undefined && conversionRate < conversionThreshold) ||
                           (avgDays !== undefined && avgDays > avgDaysThreshold);
      
      if (isBottleneck) {
        bottlenecks.add(stage);
      }

      return {
        stage,
        label: stageLabels[stage] || stage,
        count: data.count,
        value: data.value,
        conversionRate,
        avgDaysInStage: avgDays,
        bottleneck: isBottleneck,
      };
    })
    .filter(s => s.count > 0 || s.value > 0);

  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  const totalDeals = opportunities.length;

  // Kaybedilen fırsatları ayrı sorgula (huni dışında analiz için)
  let lostQuery = supabase
    .from('opportunities')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'lost');

  lostQuery = applyDateFilters(lostQuery, filters);
  lostQuery = applyEmployeeFilter(lostQuery, filters.salesRepId);
  lostQuery = applyCustomerFilter(lostQuery, filters.customerId);
  lostQuery = applyCurrencyFilter(lostQuery, filters.currency);

  const { data: lostData } = await lostQuery;
  const lostOpportunities = lostData || [];
  const lostDealsCount = lostOpportunities.length;
  const lostDealsValue = lostOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  // Calculate funnel over time (last 30 days or filtered period)
  const startDate = filters.startDate ? new Date(filters.startDate) : subDays(new Date(), 30);
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  
  const funnelOverTimeMap = new Map<string, Map<string, { count: number; value: number }>>();
  
  opportunities.forEach((opp: any) => {
    const oppDate = new Date(opp.created_at);
    if (oppDate >= startDate && oppDate <= endDate) {
      const dateKey = format(oppDate, 'yyyy-MM-dd');
      const status = opp.status || 'new';
      const stage = statusToStageMap[status] || 'open';
      
      if (!funnelOverTimeMap.has(dateKey)) {
        funnelOverTimeMap.set(dateKey, new Map());
      }
      
      const dayStages = funnelOverTimeMap.get(dateKey)!;
      const existing = dayStages.get(stage) || { count: 0, value: 0 };
      dayStages.set(stage, {
        count: existing.count + 1,
        value: existing.value + (opp.value || 0),
      });
    }
  });

  // Convert to array format
  const funnelOverTime = Array.from(funnelOverTimeMap.entries())
    .map(([date, dayStages]) => ({
      date,
      stages: Array.from(dayStages.entries()).map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value,
      })),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    stages,
    totalPipelineValue,
    totalDeals,
    lostDealsCount,
    lostDealsValue,
    funnelOverTime,
  };
}

/**
 * Fetch Sales Rep Performance Data
 */
export async function fetchSalesRepPerformanceData(
  filters: GlobalFilters
): Promise<SalesRepPerformanceData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return { reps: [], totalReps: 0 };
  }

  let query = supabase
    .from('opportunities')
    .select('*, employees(id, first_name, last_name)')
    .eq('company_id', companyId);

  query = applyDateFilters(query, filters);
  query = applyCustomerFilter(query, filters.customerId);
  query = applyStageFilter(query, filters.salesStage);
  query = applyCurrencyFilter(query, filters.currency);

  const { data } = await query;

  const opportunities = data || [];
  
  // Group by employee
  const repMap = new Map<string, {
    employeeId: string;
    employeeName: string;
    totalSales: number;
    wonDeals: number;
    lostDeals: number;
    deals: any[];
  }>();

  opportunities.forEach((opp: any) => {
    const empId = opp.employee_id || 'unknown';
    const emp = opp.employees;
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Bilinmeyen';
    
    const existing = repMap.get(empId) || {
      employeeId: empId,
      employeeName: empName,
      totalSales: 0,
      wonDeals: 0,
      lostDeals: 0,
      deals: [],
    };

    existing.totalSales += opp.value || 0;
    if (opp.status === 'won') existing.wonDeals++;
    if (opp.status === 'lost') existing.lostDeals++;
    existing.deals.push(opp);

    repMap.set(empId, existing);
  });

  const reps = Array.from(repMap.values()).map(rep => {
    const totalDeals = rep.wonDeals + rep.lostDeals;
    const winRate = totalDeals > 0 ? (rep.wonDeals / totalDeals) * 100 : 0;
    const avgDealSize = rep.deals.length > 0
      ? rep.totalSales / rep.deals.length
      : 0;

    // Calculate average closing duration
    const closedDeals = rep.deals.filter((d: any) => d.updated_at && d.created_at);
    const avgClosingDuration = closedDeals.length > 0
      ? closedDeals.reduce((sum: number, deal: any) => {
          const days = Math.ceil(
            (new Date(deal.updated_at).getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / closedDeals.length
      : 0;

    return {
      employeeId: rep.employeeId,
      employeeName: rep.employeeName,
      totalSales: rep.totalSales,
      wonDeals: rep.wonDeals,
      lostDeals: rep.lostDeals,
      avgDealSize,
      avgClosingDuration,
      winRate,
    };
  });

  return {
    reps: reps.sort((a, b) => b.totalSales - a.totalSales),
    totalReps: reps.length,
  };
}

/**
 * Fetch Proposal Analysis Data
 */
export async function fetchProposalAnalysisData(
  filters: GlobalFilters
): Promise<ProposalAnalysisData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return {
      totalProposals: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
      acceptanceRate: 0,
      revisionCount: 0,
      statusDistribution: [],
      volumeOverTime: [],
    };
  }

  let query = supabase
    .from('proposals')
    .select('*')
    .eq('company_id', companyId);

  query = applyDateFilters(query, filters);
  query = applyEmployeeFilter(query, filters.salesRepId);
  query = applyCustomerFilter(query, filters.customerId);
  query = applyCurrencyFilter(query, filters.currency);

  const { data } = await query;

  const proposals = data || [];
  
  const totalProposals = proposals.length;
  const accepted = proposals.filter((p: any) => p.status === 'accepted').length;
  const rejected = proposals.filter((p: any) => p.status === 'rejected').length;
  const pending = proposals.filter((p: any) => 
    ['draft', 'sent', 'pending'].includes(p.status)
  ).length;
  
  const acceptanceRate = (accepted + rejected) > 0
    ? (accepted / (accepted + rejected)) * 100
    : 0;

  // Revision count (simplified - could track in a separate table)
  const revisionCount = proposals.filter((p: any) => p.revision_number && p.revision_number > 1).length;

  const statusDistribution = [
    { status: 'accepted' as const, count: accepted, value: proposals.filter((p: any) => p.status === 'accepted').reduce((s, p) => s + (p.total_amount || 0), 0) },
    { status: 'rejected' as const, count: rejected, value: proposals.filter((p: any) => p.status === 'rejected').reduce((s, p) => s + (p.total_amount || 0), 0) },
    { status: 'pending' as const, count: pending, value: proposals.filter((p: any) => ['draft', 'sent', 'pending'].includes(p.status)).reduce((s, p) => s + (p.total_amount || 0), 0) },
  ];

  // Volume over time
  const volumeMap = new Map<string, { count: number; accepted: number; rejected: number }>();
  proposals.forEach((prop: any) => {
    const date = format(new Date(prop.created_at), 'yyyy-MM-dd');
    const existing = volumeMap.get(date) || { count: 0, accepted: 0, rejected: 0 };
    existing.count++;
    if (prop.status === 'accepted') existing.accepted++;
    if (prop.status === 'rejected') existing.rejected++;
    volumeMap.set(date, existing);
  });

  const volumeOverTime = Array.from(volumeMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalProposals,
    accepted,
    rejected,
    pending,
    acceptanceRate,
    revisionCount,
    statusDistribution,
    volumeOverTime,
  };
}

/**
 * Fetch Sales Forecast Data
 */
export async function fetchSalesForecastData(
  filters: GlobalFilters
): Promise<ForecastData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return {
      openDeals: 0,
      weightedForecastValue: 0,
      expectedRevenue: {
        monthly: [],
        quarterly: [],
      },
      pipelineValue: [],
    };
  }

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('company_id', companyId)
    .in('status', ['open', 'qualified', 'proposal', 'negotiation']);

  query = applyDateFilters(query, filters);
  query = applyEmployeeFilter(query, filters.salesRepId);
  query = applyCustomerFilter(query, filters.customerId);
  query = applyCurrencyFilter(query, filters.currency);

  const { data } = await query;

  const opportunities = data || [];
  const openDeals = opportunities.length;

  // Weighted forecast (value * probability)
  const weightedForecastValue = opportunities.reduce((sum, opp) => {
    const probability = opp.probability || 50;
    return sum + ((opp.value || 0) * (probability / 100));
  }, 0);

  // Group by stage for pipeline value
  const statusToStageMap: Record<string, string> = {
    'new': 'open',
    'meeting_visit': 'qualified',
    'proposal': 'proposal',
    'negotiation': 'negotiation',
    'won': 'won',
    'lost': 'lost',
  };
  
  const stageMap = new Map<string, { value: number; count: number }>();
  opportunities.forEach((opp: any) => {
    const status = opp.status || 'new';
    const stage = statusToStageMap[status] || 'open';
    const existing = stageMap.get(stage) || { value: 0, count: 0 };
    stageMap.set(stage, {
      value: existing.value + (opp.value || 0),
      count: existing.count + 1,
    });
  });

  const pipelineValue = Array.from(stageMap.entries()).map(([stage, data]) => ({
    stage,
    value: data.value,
    count: data.count,
  }));

  // Monthly and quarterly forecasts (simplified - using expected_close_date)
  const monthlyMap = new Map<string, number>();
  const quarterlyMap = new Map<string, number>();

  opportunities.forEach((opp: any) => {
    if (opp.expected_close_date) {
      const date = new Date(opp.expected_close_date);
      const monthKey = format(date, 'yyyy-MM');
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `${date.getFullYear()}-Q${quarter}`;

      const probability = opp.probability || 50;
      const weightedValue = (opp.value || 0) * (probability / 100);

      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + weightedValue);
      quarterlyMap.set(quarterKey, (quarterlyMap.get(quarterKey) || 0) + weightedValue);
    }
  });

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, forecast]) => ({ month, forecast, actual: undefined }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const quarterly = Array.from(quarterlyMap.entries())
    .map(([quarter, forecast]) => ({ quarter, forecast, actual: undefined }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  return {
    openDeals,
    weightedForecastValue,
    expectedRevenue: {
      monthly,
      quarterly,
    },
    pipelineValue,
  };
}

/**
 * Fetch Lost Sales Data
 */
export async function fetchLostSalesData(
  filters: GlobalFilters
): Promise<LostSalesData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return {
      totalLostDeals: 0,
      totalLostValue: 0,
      reasons: [],
    };
  }

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'lost');

  query = applyDateFilters(query, filters);
  query = applyEmployeeFilter(query, filters.salesRepId);
  query = applyCustomerFilter(query, filters.customerId);
  query = applyCurrencyFilter(query, filters.currency);

  const { data } = await query;

  const lostOpportunities = data || [];
  
  const totalLostDeals = lostOpportunities.length;
  const totalLostValue = lostOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  // Extract loss reasons from notes or use default
  const reasonMap = new Map<string, { count: number; value: number }>();
  
  lostOpportunities.forEach((opp: any) => {
    let reason: string = 'other';
    const notes = (opp.notes || '').toLowerCase();
    
    if (notes.includes('fiyat') || notes.includes('price')) reason = 'price';
    else if (notes.includes('rakip') || notes.includes('competitor')) reason = 'competitor';
    else if (notes.includes('zaman') || notes.includes('timing')) reason = 'timing';
    else if (notes.includes('kapsam') || notes.includes('scope')) reason = 'scope';
    
    const existing = reasonMap.get(reason) || { count: 0, value: 0 };
    reasonMap.set(reason, {
      count: existing.count + 1,
      value: existing.value + (opp.value || 0),
    });
  });

  const reasonLabels: Record<string, string> = {
    price: 'Fiyat',
    competitor: 'Rakip',
    timing: 'Zamanlama',
    scope: 'Kapsam',
    other: 'Diğer',
  };

  const reasons = Array.from(reasonMap.entries()).map(([reason, data]) => ({
    reason: reason as any,
    label: reasonLabels[reason] || 'Diğer',
    count: data.count,
    value: data.value,
    percentage: totalLostDeals > 0 ? (data.count / totalLostDeals) * 100 : 0,
  }));

  return {
    totalLostDeals,
    totalLostValue,
    reasons,
  };
}

/**
 * Fetch Customer Sales Data
 */
export async function fetchCustomerSalesData(
  filters: GlobalFilters
): Promise<CustomerSalesReportData> {
  const companyId = await getCompanyId();
  if (!companyId) {
    return {
      customers: [],
      topCustomers: [],
      totalCustomers: 0,
    };
  }

  let query = supabase
    .from('opportunities')
    .select('*, customers(id, name), sales_invoices(total_amount, created_at)')
    .eq('company_id', companyId)
    .in('status', ['won', 'closed']);

  query = applyDateFilters(query, filters);
  query = applyEmployeeFilter(query, filters.salesRepId);
  query = applyCurrencyFilter(query, filters.currency);

  const { data } = await query;

  const opportunities = data || [];
  
  // Group by customer
  const customerMap = new Map<string, {
    customerId: string;
    customerName: string;
    totalRevenue: number;
    dealCount: number;
    deals: any[];
    lastTransactionDate: string;
  }>();

  opportunities.forEach((opp: any) => {
    const custId = opp.customer_id || 'unknown';
    const cust = opp.customers;
    const custName = cust?.name || 'Bilinmeyen Müşteri';
    
    const existing = customerMap.get(custId) || {
      customerId: custId,
      customerName: custName,
      totalRevenue: 0,
      dealCount: 0,
      deals: [],
      lastTransactionDate: opp.created_at,
    };

    const invoiceAmount = opp.sales_invoices?.reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0) || 0;
    existing.totalRevenue += opp.value || invoiceAmount || 0;
    existing.dealCount++;
    existing.deals.push(opp);

    // Update last transaction date
    const oppDate = opp.created_at;
    const invoiceDates = opp.sales_invoices?.map((inv: any) => inv.created_at) || [];
    const allDates = [oppDate, ...invoiceDates].filter(Boolean);
    if (allDates.length > 0) {
      const latestDate = allDates.sort().reverse()[0];
      if (new Date(latestDate) > new Date(existing.lastTransactionDate)) {
        existing.lastTransactionDate = latestDate;
      }
    }

    customerMap.set(custId, existing);
  });

  const customers = Array.from(customerMap.values()).map(cust => ({
    customerId: cust.customerId,
    customerName: cust.customerName,
    totalRevenue: cust.totalRevenue,
    dealCount: cust.dealCount,
    avgDealSize: cust.dealCount > 0 ? cust.totalRevenue / cust.dealCount : 0,
    lastTransactionDate: cust.lastTransactionDate,
  }));

  const sortedCustomers = customers.sort((a, b) => b.totalRevenue - a.totalRevenue);
  const topCustomers = sortedCustomers.slice(0, 10);

  return {
    customers: sortedCustomers,
    topCustomers,
    totalCustomers: customers.length,
  };
}

