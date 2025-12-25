import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Users, Package, Wallet, RefreshCw, Sparkles } from 'lucide-react';
import { generateRiskAnalysis, RiskAnalysisResult, RiskFactor } from '@/services/riskAnalysisService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const RISK_COLORS = {
  low: '#10b981', // emerald-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444', // red-500
};

const RISK_ICONS = {
  'Nakit Akışı Riski': Wallet,
  'Alacak Riski': TrendingDown,
  'Müşteri Yoğunlaşma Riski': Users,
  'Stok Riski': Package,
};

export function RiskScoreWidget() {
  const {
    data: riskData,
    isLoading,
    error,
    refetch,
  } = useQuery<RiskAnalysisResult>({
    queryKey: ['risk-analysis'],
    queryFn: generateRiskAnalysis,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Risk analizi yüklenemedi</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Tekrar Dene
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading || !riskData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  const { overallScore, overallLevel, factors, aiRecommendations } = riskData;

  // Prepare data for pie chart
  const chartData = factors.map((factor) => ({
    name: factor.name.replace(' Riski', ''),
    value: factor.score,
    level: factor.level,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Risk Analizi
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Overall Risk Score */}
      <Card className="p-6">
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Genel Risk Skoru</p>
          <div className="relative inline-flex items-center justify-center">
            {/* Radial progress circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-200 dark:text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={RISK_COLORS[overallLevel]}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${(overallScore / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: RISK_COLORS[overallLevel] }}>
                {overallScore}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="mt-3">
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: RISK_COLORS[overallLevel] }}
            >
              {overallLevel === 'low' ? 'Düşük Risk' : overallLevel === 'medium' ? 'Orta Risk' : 'Yüksek Risk'}
            </span>
          </div>
        </div>
      </Card>

      {/* Risk Distribution Chart */}
      <Card className="p-6">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Risk Dağılımı
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.level]} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium">{data.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Skor: {data.value}/100
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Individual Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {factors.map((factor) => {
          const Icon = RISK_ICONS[factor.name] || AlertTriangle;
          return (
            <Card key={factor.name} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${RISK_COLORS[factor.level]}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: RISK_COLORS[factor.level] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {factor.name}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {factor.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: RISK_COLORS[factor.level] }}>
                      {factor.score}/100
                    </span>
                    {factor.recommendation && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {factor.recommendation}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* AI Recommendations */}
      {aiRecommendations && (
        <Card className="p-4 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                AI Önerileri
              </h5>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
                {aiRecommendations}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
