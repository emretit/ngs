import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useServiceCostAnalysis, useCostBreakdown, useMonthlyCostTrends } from '@/hooks/service/useServiceCostAnalysis';
import { 
  DollarSign, 
  Wrench, 
  Package, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const ServiceCostAnalysis: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: costMetrics, isLoading: metricsLoading } = useServiceCostAnalysis(startDate, endDate);
  const breakdown = useCostBreakdown(startDate, endDate);
  const { data: monthlyTrends, isLoading: trendsLoading } = useMonthlyCostTrends(6);

  if (metricsLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!costMetrics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Maliyet verisi bulunamadı</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Başlangıç Tarihi</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Bitiş Tarihi</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                setEndDate(new Date());
              }}
            >
              Bu Ay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Toplam Gelir
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(costMetrics.totalRevenue)}
            </div>
            <p className="text-xs text-green-700 mt-1">
              {costMetrics.servicesWithCosts} servis
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              İşçilik Maliyeti
            </CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(costMetrics.totalLaborCost)}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Ort: {formatCurrency(costMetrics.averageLaborCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">
              Parça Maliyeti
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(costMetrics.totalPartsCost)}
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Ort: {formatCurrency(costMetrics.averagePartsCost)}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          costMetrics.profitMargin >= 0
            ? 'from-green-50 to-green-100 border-green-200'
            : 'from-red-50 to-red-100 border-red-200'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${
              costMetrics.profitMargin >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              Kar Marjı
            </CardTitle>
            {costMetrics.profitMargin >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              costMetrics.profitMargin >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {costMetrics.profitMargin.toFixed(1)}%
            </div>
            <p className={`text-xs mt-1 ${
              costMetrics.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {formatCurrency(costMetrics.profitAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                <span>Maliyet Dağılımı</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">İşçilik</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{breakdown.laborPercentage.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(costMetrics.totalLaborCost)}
                      </span>
                    </div>
                  </div>
                  <Progress value={breakdown.laborPercentage} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Parça</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{breakdown.partsPercentage.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(costMetrics.totalPartsCost)}
                      </span>
                    </div>
                  </div>
                  <Progress value={breakdown.partsPercentage} className="h-2" />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Toplam Maliyet</span>
                    <span className="text-lg font-bold">{formatCurrency(costMetrics.totalCost)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span>Ortalama Servis Maliyeti</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Ortalama İşçilik</span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatCurrency(costMetrics.averageLaborCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium">Ortalama Parça</span>
                  <span className="text-lg font-bold text-orange-700">
                    {formatCurrency(costMetrics.averagePartsCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-sm font-medium">Ortalama Toplam</span>
                  <span className="text-xl font-bold text-green-700">
                    {formatCurrency(costMetrics.averageServiceCost)}
                  </span>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground text-center">
                  {costMetrics.servicesWithCosts} servis için maliyet bilgisi mevcut
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Trends */}
      {monthlyTrends && monthlyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Aylık Maliyet Trendleri</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyTrends.map((trend, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{trend.month}</span>
                    <Badge variant="outline">{trend.serviceCount} servis</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gelir:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(trend.revenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">İşçilik:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {formatCurrency(trend.laborCost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parça:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        {formatCurrency(trend.partsCost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kar:</span>
                      <span className={`ml-2 font-medium ${
                        trend.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(trend.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


