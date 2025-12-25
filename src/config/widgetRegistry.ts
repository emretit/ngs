import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  Bot,
  Wallet,
  Building2,
  Package,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { WidgetDefinition } from '@/components/dashboard/WidgetCatalog';

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // Financial Widgets
  {
    id: 'metrics-kpi',
    type: 'MetricsKPI',
    title: 'KPI Metrikleri',
    description: 'Aylık ciro, alacaklar ve borçlar özeti',
    icon: TrendingUp,
    category: 'financial',
    defaultSize: { w: 12, h: 2 },
    minSize: { w: 6, h: 2 },
  },
  {
    id: 'cash-flow',
    type: 'CashFlow',
    title: 'Nakit Akışı',
    description: 'Günlük gelir, tahsilat ve ödemeler',
    icon: DollarSign,
    category: 'financial',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'executive-summary',
    type: 'ExecutiveSummary',
    title: 'Yönetici Özeti',
    description: '6 ana KPI göstergesi',
    icon: TrendingUp,
    category: 'financial',
    defaultSize: { w: 12, h: 3 },
    minSize: { w: 8, h: 3 },
  },

  // CRM Widgets
  {
    id: 'crm-summary',
    type: 'CRMSummary',
    title: 'CRM Özeti',
    description: 'Fırsatlar, teklifler ve aktiviteler',
    icon: Users,
    category: 'crm',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
  },

  // HR Widgets
  {
    id: 'hr-summary',
    type: 'HRSummary',
    title: 'İK Özeti',
    description: 'Çalışan sayısı, izinler ve aktif personel',
    icon: UserCheck,
    category: 'hr',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
  },

  // Operations Widgets
  {
    id: 'recent-activities',
    type: 'RecentActivities',
    title: 'Son Aktiviteler',
    description: 'Timeline görünümü ile son işlemler',
    icon: Activity,
    category: 'operations',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'calendar-widget',
    type: 'CalendarWidget',
    title: 'Takvim',
    description: 'Hızlı takvim erişimi',
    icon: Calendar,
    category: 'operations',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
  },

  // AI Widgets
  {
    id: 'ai-panel',
    type: 'AIPanel',
    title: 'AI Asistan',
    description: 'Chat ve insight analizi',
    icon: Bot,
    category: 'ai',
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
  },
  {
    id: 'revenue-forecast',
    type: 'RevenueForecast',
    title: 'Gelir Tahmini',
    description: 'AI destekli 3 aylık gelir projeksiyonu',
    icon: BarChart3,
    category: 'ai',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'risk-score',
    type: 'RiskScore',
    title: 'Risk Analizi',
    description: 'Kapsamlı risk skorlama ve öneriler',
    icon: AlertTriangle,
    category: 'ai',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((widget) => widget.id === id);
}

export function getWidgetByType(type: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((widget) => widget.type === type);
}

export function getWidgetsByCategory(category: WidgetDefinition['category']): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter((widget) => widget.category === category);
}
