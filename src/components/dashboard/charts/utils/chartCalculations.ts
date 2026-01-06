export interface TrendData {
  value: number;
  trend: number;
  change: 'up' | 'down' | 'neutral';
  previousValue: number;
  currentMonthValue?: number;
  currentMonthName?: string;
}

export interface FinancialSummary {
  totalRevenue: TrendData;
  totalExpense: TrendData;
  netProfit: TrendData;
  avgMargin: TrendData;
}

export interface SalesSummary {
  totalSales: TrendData;
  totalOrders: TrendData;
  totalCustomers: TrendData;
  avgOrderValue: TrendData;
}

/**
 * Hesaplar trend yüzdesini ve değişim yönünü
 */
export const calculateTrend = (current: number, previous: number): { trend: number; change: 'up' | 'down' | 'neutral' } => {
  if (previous === 0) {
    return { trend: 0, change: 'neutral' };
  }
  
  const trend = ((current - previous) / previous) * 100;
  const change = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  
  return { trend: Number(trend.toFixed(1)), change };
};

/**
 * Finansal analiz verilerinden özet istatistikleri hesaplar
 */
export const calculateFinancialSummary = (data: any[]): FinancialSummary => {
  if (!data || data.length === 0) {
    return {
      totalRevenue: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
      totalExpense: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
      netProfit: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
      avgMargin: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
    };
  }

  // Son periyot ve önceki periyot için veri ayır
  const midPoint = Math.floor(data.length / 2);
  const previousPeriod = data.slice(0, midPoint);
  const currentPeriod = data.slice(midPoint);

  // Son ayın verileri (bulunduğumuz ay)
  const lastMonthData = data[data.length - 1];
  const currentMonthRevenue = lastMonthData?.gelir || 0;
  const currentMonthExpense = lastMonthData?.gider || 0;
  const currentMonthProfit = lastMonthData?.kar || 0;
  const currentMonthName = lastMonthData?.month || '';

  // Toplam gelir
  const totalRevenue = currentPeriod.reduce((sum, item) => sum + item.gelir, 0);
  const prevTotalRevenue = previousPeriod.reduce((sum, item) => sum + item.gelir, 0);
  const revenueTrend = calculateTrend(totalRevenue, prevTotalRevenue);

  // Toplam gider
  const totalExpense = currentPeriod.reduce((sum, item) => sum + item.gider, 0);
  const prevTotalExpense = previousPeriod.reduce((sum, item) => sum + item.gider, 0);
  const expenseTrend = calculateTrend(totalExpense, prevTotalExpense);

  // Net kar
  const netProfit = currentPeriod.reduce((sum, item) => sum + item.kar, 0);
  const prevNetProfit = previousPeriod.reduce((sum, item) => sum + item.kar, 0);
  const profitTrend = calculateTrend(netProfit, prevNetProfit);

  // Ortalama kar marjı
  const avgMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const prevAvgMargin = prevTotalRevenue > 0 ? (prevNetProfit / prevTotalRevenue) * 100 : 0;
  const marginTrend = calculateTrend(avgMargin, prevAvgMargin);
  const currentMonthMargin = currentMonthRevenue > 0 ? (currentMonthProfit / currentMonthRevenue) * 100 : 0;

  return {
    totalRevenue: {
      value: Math.round(totalRevenue),
      trend: revenueTrend.trend,
      change: revenueTrend.change,
      previousValue: Math.round(prevTotalRevenue),
      currentMonthValue: Math.round(currentMonthRevenue),
      currentMonthName,
    },
    totalExpense: {
      value: Math.round(totalExpense),
      trend: expenseTrend.trend,
      change: expenseTrend.change,
      previousValue: Math.round(prevTotalExpense),
      currentMonthValue: Math.round(currentMonthExpense),
      currentMonthName,
    },
    netProfit: {
      value: Math.round(netProfit),
      trend: profitTrend.trend,
      change: profitTrend.change,
      previousValue: Math.round(prevNetProfit),
      currentMonthValue: Math.round(currentMonthProfit),
      currentMonthName,
    },
    avgMargin: {
      value: Number(avgMargin.toFixed(1)),
      trend: marginTrend.trend,
      change: marginTrend.change,
      previousValue: Number(prevAvgMargin.toFixed(1)),
      currentMonthValue: Number(currentMonthMargin.toFixed(1)),
      currentMonthName,
    },
  };
};

/**
 * Satış analizi verilerinden özet istatistikleri hesaplar
 */
export const calculateSalesSummary = (data: any[]): SalesSummary => {
  if (!data || data.length === 0) {
    return {
      totalSales: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
      totalOrders: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
      totalCustomers: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
      avgOrderValue: { value: 0, trend: 0, change: 'neutral', previousValue: 0 },
    };
  }

  const midPoint = Math.floor(data.length / 2);
  const previousPeriod = data.slice(0, midPoint);
  const currentPeriod = data.slice(midPoint);

  // Son ayın verileri (bulunduğumuz ay)
  const lastMonthData = data[data.length - 1];
  const currentMonthSales = lastMonthData?.sales || 0;
  const currentMonthOrders = lastMonthData?.siparis || 0;
  const currentMonthCustomers = lastMonthData?.musteri || 0;
  const currentMonthAvgOrder = currentMonthOrders > 0 ? currentMonthSales / currentMonthOrders : 0;
  const currentMonthName = lastMonthData?.month || '';

  // Toplam satış
  const totalSales = currentPeriod.reduce((sum, item) => sum + item.sales, 0);
  const prevTotalSales = previousPeriod.reduce((sum, item) => sum + item.sales, 0);
  const salesTrend = calculateTrend(totalSales, prevTotalSales);

  // Toplam sipariş
  const totalOrders = currentPeriod.reduce((sum, item) => sum + item.siparis, 0);
  const prevTotalOrders = previousPeriod.reduce((sum, item) => sum + item.siparis, 0);
  const ordersTrend = calculateTrend(totalOrders, prevTotalOrders);

  // Toplam müşteri
  const totalCustomers = currentPeriod.reduce((sum, item) => sum + item.musteri, 0);
  const prevTotalCustomers = previousPeriod.reduce((sum, item) => sum + item.musteri, 0);
  const customersTrend = calculateTrend(totalCustomers, prevTotalCustomers);

  // Ortalama sipariş değeri
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const prevAvgOrderValue = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
  const avgOrderTrend = calculateTrend(avgOrderValue, prevAvgOrderValue);

  return {
    totalSales: {
      value: Math.round(totalSales),
      trend: salesTrend.trend,
      change: salesTrend.change,
      previousValue: Math.round(prevTotalSales),
      currentMonthValue: Math.round(currentMonthSales),
      currentMonthName,
    },
    totalOrders: {
      value: totalOrders,
      trend: ordersTrend.trend,
      change: ordersTrend.change,
      previousValue: prevTotalOrders,
      currentMonthValue: currentMonthOrders,
      currentMonthName,
    },
    totalCustomers: {
      value: totalCustomers,
      trend: customersTrend.trend,
      change: customersTrend.change,
      previousValue: prevTotalCustomers,
      currentMonthValue: currentMonthCustomers,
      currentMonthName,
    },
    avgOrderValue: {
      value: Math.round(avgOrderValue),
      trend: avgOrderTrend.trend,
      change: avgOrderTrend.change,
      previousValue: Math.round(prevAvgOrderValue),
      currentMonthValue: Math.round(currentMonthAvgOrder),
      currentMonthName,
    },
  };
};

/**
 * Mini sparkline için veri hazırla
 */
export const prepareSparklineData = (data: any[], dataKey: string) => {
  return data.map((item) => ({
    value: item[dataKey] || 0,
  }));
};

