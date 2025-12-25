import { supabase } from '@/integrations/supabase/client';
import { chatWithAI } from './geminiService';

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  date: Date;
}

export interface ForecastResult {
  historical: MonthlyRevenue[];
  forecast: MonthlyRevenue[];
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-100
  aiInsight?: string;
}

/**
 * Get company_id for current user
 */
async function getCurrentCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return profile?.company_id || null;
  } catch {
    return null;
  }
}

/**
 * Fetch historical revenue data from database
 */
export async function getHistoricalRevenue(
  months: number = 12
): Promise<MonthlyRevenue[]> {
  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) return [];

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get sales invoices
    const { data: invoices, error } = await supabase
      .from('sales_invoices')
      .select('invoice_date, total_amount')
      .eq('company_id', companyId)
      .gte('invoice_date', startDate.toISOString())
      .lte('invoice_date', endDate.toISOString())
      .order('invoice_date', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData: Record<string, number> = {};

    invoices?.forEach((invoice) => {
      const date = new Date(invoice.invoice_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += invoice.total_amount || 0;
    });

    // Convert to array
    const result: MonthlyRevenue[] = Object.entries(monthlyData).map(([key, revenue]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);

      return {
        month: date.toLocaleDateString('tr-TR', { month: 'long' }),
        year: parseInt(year),
        revenue,
        date,
      };
    });

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error fetching historical revenue:', error);
    return [];
  }
}

/**
 * Calculate simple moving average
 */
function calculateMovingAverage(data: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
      continue;
    }

    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }

  return result;
}

/**
 * Detect trend direction
 */
function detectTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 3) return 'stable';

  // Compare last 3 months vs previous 3 months
  const recent = data.slice(-3);
  const previous = data.slice(-6, -3);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

  const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

  if (changePercent > 5) return 'increasing';
  if (changePercent < -5) return 'decreasing';
  return 'stable';
}

/**
 * Calculate seasonal adjustment factor
 */
function calculateSeasonalFactor(data: MonthlyRevenue[]): number {
  if (data.length < 12) return 1;

  // Get same month from previous year if available
  const currentMonth = new Date().getMonth();
  const sameMonthData = data.filter(d => d.date.getMonth() === currentMonth);

  if (sameMonthData.length < 2) return 1;

  // Calculate average growth rate for this month
  const growthRates: number[] = [];
  for (let i = 1; i < sameMonthData.length; i++) {
    const rate = sameMonthData[i].revenue / sameMonthData[i - 1].revenue;
    growthRates.push(rate);
  }

  return growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
}

/**
 * Generate revenue forecast
 */
export async function generateRevenueForecast(
  historicalMonths: number = 12,
  forecastMonths: number = 3
): Promise<ForecastResult> {
  try {
    // Get historical data
    const historical = await getHistoricalRevenue(historicalMonths);

    if (historical.length < 3) {
      throw new Error('Yeterli geçmiş veri yok (en az 3 ay gerekli)');
    }

    const revenues = historical.map(h => h.revenue);

    // Calculate moving average (3-month period)
    const movingAvg = calculateMovingAverage(revenues, 3);
    const lastAvg = movingAvg[movingAvg.length - 1];

    // Detect trend
    const trend = detectTrend(revenues);

    // Calculate trend coefficient
    let trendCoefficient = 1;
    if (trend === 'increasing') {
      // Calculate average growth rate
      const growthRates: number[] = [];
      for (let i = 1; i < revenues.length; i++) {
        growthRates.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
      }
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      trendCoefficient = 1 + avgGrowth;
    } else if (trend === 'decreasing') {
      const declineRates: number[] = [];
      for (let i = 1; i < revenues.length; i++) {
        declineRates.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
      }
      const avgDecline = declineRates.reduce((a, b) => a + b, 0) / declineRates.length;
      trendCoefficient = 1 + avgDecline;
    }

    // Calculate seasonal factor
    const seasonalFactor = calculateSeasonalFactor(historical);

    // Generate forecast
    const forecast: MonthlyRevenue[] = [];
    let lastValue = lastAvg;

    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Apply trend and seasonal factors
      lastValue = lastValue * trendCoefficient * seasonalFactor;

      forecast.push({
        month: forecastDate.toLocaleDateString('tr-TR', { month: 'long' }),
        year: forecastDate.getFullYear(),
        revenue: Math.round(lastValue),
        date: forecastDate,
      });
    }

    // Calculate confidence based on data consistency
    const variance = calculateVariance(revenues);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation
    const confidence = Math.max(0, Math.min(100, 100 - (cv * 100)));

    // Get AI insight
    let aiInsight: string | undefined;
    try {
      const prompt = `Gelir verilerine bakarak kısa bir tahmin analizi yap.
Geçmiş 12 ay: ${revenues.map(r => '₺' + r.toLocaleString('tr-TR')).join(', ')}
Trend: ${trend === 'increasing' ? 'Artış' : trend === 'decreasing' ? 'Azalış' : 'Stabil'}
Tahmin edilen gelecek 3 ay: ${forecast.map(f => '₺' + f.revenue.toLocaleString('tr-TR')).join(', ')}

2-3 cümlelik Türkçe analiz ver.`;

      const response = await chatWithAI([{ role: 'user', content: prompt }]);
      if (response.content) {
        aiInsight = response.content;
      }
    } catch (error) {
      console.error('AI insight generation failed:', error);
    }

    return {
      historical,
      forecast,
      trend,
      confidence: Math.round(confidence),
      aiInsight,
    };
  } catch (error) {
    console.error('Error generating revenue forecast:', error);
    throw error;
  }
}

/**
 * Calculate variance
 */
function calculateVariance(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Get seasonal trends for specific months
 */
export async function getSeasonalTrends(): Promise<Record<number, number>> {
  const historical = await getHistoricalRevenue(24); // 2 years

  const monthlyAverages: Record<number, number[]> = {};

  historical.forEach(h => {
    const month = h.date.getMonth();
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = [];
    }
    monthlyAverages[month].push(h.revenue);
  });

  const trends: Record<number, number> = {};
  Object.entries(monthlyAverages).forEach(([month, values]) => {
    trends[parseInt(month)] = values.reduce((a, b) => a + b, 0) / values.length;
  });

  return trends;
}
