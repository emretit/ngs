import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export type InsightType = 'anomaly' | 'prediction' | 'optimization' | 'risk';
export type InsightCategory = 'sales' | 'finance' | 'inventory' | 'hr' | 'operations' | 'general';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'opportunity';

export interface Insight {
  id: string;
  company_id: string;
  insight_type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  severity: InsightSeverity;
  impact_score: number; // 1-100
  data_summary: Record<string, any>;
  recommendations: string[];
  related_entities: Array<{ type: string; id: string }>;
  is_read: boolean;
  is_dismissed: boolean;
  actionable: boolean;
  action_url?: string;
  expires_at?: string;
  created_at: string;
}

/**
 * Generate insights for company
 */
export async function generateInsights(companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Run all insight generators in parallel
  const [
    salesAnomalies,
    financeRisks,
    inventoryPredictions,
    hrOptimizations
  ] = await Promise.all([
    detectSalesAnomalies(companyId),
    detectFinanceRisks(companyId),
    predictInventoryIssues(companyId),
    generateHROptimizations(companyId)
  ]);

  insights.push(...salesAnomalies, ...financeRisks, ...inventoryPredictions, ...hrOptimizations);

  return insights;
}

/**
 * Detect sales anomalies (drops, spikes, unusual patterns)
 */
async function detectSalesAnomalies(companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Get last 30 days sales data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSales, error } = await supabase
      .from('sales_invoices')
      .select('total_amount, created_at')
      
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !recentSales || recentSales.length === 0) return insights;

    // Calculate daily averages
    const last7Days = recentSales.filter(s => {
      const date = new Date(s.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= sevenDaysAgo;
    });

    const prev7Days = recentSales.filter(s => {
      const date = new Date(s.created_at);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });

    const last7Total = last7Days.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const prev7Total = prev7Days.reduce((sum, s) => sum + (s.total_amount || 0), 0);

    // Detect significant drop (>30%)
    if (prev7Total > 0) {
      const changePercent = ((last7Total - prev7Total) / prev7Total) * 100;

      if (changePercent < -30) {
        insights.push({
          id: `sales-drop-${Date.now()}`,
          company_id: companyId,
          insight_type: 'anomaly',
          category: 'sales',
          title: 'Satışlarda Olağandışı Düşüş Tespit Edildi',
          description: `Son 7 günde satışlar bir önceki haftaya göre %${Math.abs(changePercent).toFixed(1)} düştü. Normal trende göre beklenmeyen bir azalma.`,
          severity: 'critical',
          impact_score: Math.min(100, Math.abs(changePercent)),
          data_summary: {
            last_7_days: last7Total,
            previous_7_days: prev7Total,
            change_percent: changePercent.toFixed(1),
            transaction_count_last: last7Days.length,
            transaction_count_prev: prev7Days.length
          },
          recommendations: [
            'Müşteri geri bildirimlerini inceleyin',
            'Rakip faaliyetlerini kontrol edin',
            'Pazarlama kampanyası düşünün',
            'Satış ekibiyle durum değerlendirmesi yapın'
          ],
          related_entities: [],
          is_read: false,
          is_dismissed: false,
          actionable: true,
          action_url: '/reports?type=sales',
          created_at: new Date().toISOString()
        });
      }

      // Detect significant growth (opportunity)
      if (changePercent > 50) {
        insights.push({
          id: `sales-growth-${Date.now()}`,
          company_id: companyId,
          insight_type: 'anomaly',
          category: 'sales',
          title: 'Satışlarda Güçlü Büyüme',
          description: `Son 7 günde satışlar %${changePercent.toFixed(1)} arttı. Bu momentum sürdürülebilir.`,
          severity: 'opportunity',
          impact_score: Math.min(100, changePercent),
          data_summary: {
            last_7_days: last7Total,
            previous_7_days: prev7Total,
            change_percent: changePercent.toFixed(1)
          },
          recommendations: [
            'Stok seviyelerini artırın',
            'Başarılı ürün/hizmetleri analiz edin',
            'Benzer müşterilere ulaşın',
            'Satış ekibi kapasitesini değerlendirin'
          ],
          related_entities: [],
          is_read: false,
          is_dismissed: false,
          actionable: true,
          action_url: '/reports?type=sales',
          created_at: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    logger.error('Error detecting sales anomalies:', err);
  }

  return insights;
}

/**
 * Detect finance risks (cash flow, overdue payments)
 */
async function detectFinanceRisks(companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Check overdue invoices
    const { data: overdueInvoices, error } = await supabase
      .from('sales_invoices')
      .select('id, invoice_number, total_amount, due_date, customer_id')
      
      .eq('payment_status', 'unpaid')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (!error && overdueInvoices && overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // Calculate days overdue
      const avgDaysOverdue = overdueInvoices.reduce((sum, inv) => {
        const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / overdueInvoices.length;

      insights.push({
        id: `overdue-payments-${Date.now()}`,
        company_id: companyId,
        insight_type: 'risk',
        category: 'finance',
        title: `${overdueInvoices.length} Vadesi Geçmiş Fatura`,
        description: `Toplam ₺${totalOverdue.toLocaleString('tr-TR')} tutarında vadesi geçmiş alacak var. Ortalama ${Math.round(avgDaysOverdue)} gün gecikme.`,
        severity: overdueInvoices.length > 10 || totalOverdue > 50000 ? 'critical' : 'warning',
        impact_score: Math.min(100, (overdueInvoices.length * 5) + (avgDaysOverdue * 2)),
        data_summary: {
          count: overdueInvoices.length,
          total_amount: totalOverdue,
          avg_days_overdue: Math.round(avgDaysOverdue),
          oldest_invoice_days: Math.floor((Date.now() - new Date(overdueInvoices[0].due_date).getTime()) / (1000 * 60 * 60 * 24))
        },
        recommendations: [
          'Tahsilat ekibine öncelik verin',
          'Müşterilere ödeme hatırlatması gönderin',
          'Vade farkı veya indirim sunarak hızlı tahsilat sağlayın',
          'Ödeme planı oluşturun'
        ],
        related_entities: overdueInvoices.slice(0, 5).map(inv => ({ type: 'invoice', id: inv.id })),
        is_read: false,
        is_dismissed: false,
        actionable: true,
        action_url: '/sales-invoices?status=overdue',
        created_at: new Date().toISOString()
      });
    }

    // Predict cash flow issues (simple heuristic)
    const { data: upcomingExpenses } = await supabase
      .from('purchase_invoices')
      .select('total_amount, due_date')
      
      .eq('payment_status', 'unpaid')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString());

    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('balance')
      
      .eq('is_active', true);

    if (upcomingExpenses && bankAccounts) {
      const totalExpenses = upcomingExpenses.reduce((sum, exp) => sum + (exp.total_amount || 0), 0);
      const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

      if (totalExpenses > totalBalance * 0.9) {
        insights.push({
          id: `cashflow-risk-${Date.now()}`,
          company_id: companyId,
          insight_type: 'prediction',
          category: 'finance',
          title: 'Nakit Akışı Riski: 15 Gün İçinde Negatif Bakiye Olasılığı',
          description: `Önümüzdeki 15 günde ₺${totalExpenses.toLocaleString('tr-TR')} ödeme var, mevcut bakiye ₺${totalBalance.toLocaleString('tr-TR')}. Risk seviyesi yüksek.`,
          severity: 'critical',
          impact_score: 90,
          data_summary: {
            upcoming_expenses: totalExpenses,
            current_balance: totalBalance,
            deficit_risk: totalExpenses - totalBalance,
            days_until_critical: 15
          },
          recommendations: [
            'Vadesi geçmiş alacakları acilen tahsil edin',
            'Gereksiz ödemeleri erteleyin',
            'Kısa vadeli finansman seçeneklerini değerlendirin',
            'Nakit akışı planını güncelleyin'
          ],
          related_entities: [],
          is_read: false,
          is_dismissed: false,
          actionable: true,
          action_url: '/cashflow',
          created_at: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    logger.error('Error detecting finance risks:', err);
  }

  return insights;
}

/**
 * Predict inventory issues (stock-outs, slow-moving)
 */
async function predictInventoryIssues(companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Find low stock items
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, current_stock, reorder_point')
      
      .eq('track_stock', true)
      .order('current_stock', { ascending: true });

    if (!error && products) {
      const lowStockItems = products.filter(p =>
        p.current_stock <= (p.reorder_point || 10)
      );

      if (lowStockItems.length > 0) {
        insights.push({
          id: `low-stock-${Date.now()}`,
          company_id: companyId,
          insight_type: 'risk',
          category: 'inventory',
          title: `${lowStockItems.length} Ürün Kritik Stok Seviyesinde`,
          description: `${lowStockItems.length} ürün minimum stok seviyesinin altında. Stok tükenmesi riski var.`,
          severity: lowStockItems.length > 10 ? 'critical' : 'warning',
          impact_score: Math.min(100, lowStockItems.length * 10),
          data_summary: {
            count: lowStockItems.length,
            products: lowStockItems.slice(0, 5).map(p => ({
              id: p.id,
              name: p.name,
              current_stock: p.current_stock,
              reorder_point: p.reorder_point
            }))
          },
          recommendations: [
            'Acil sipariş verin',
            'Tedarikçilerle iletişime geçin',
            'Alternatif ürünler önerin',
            'Otomatik sipariş sistemi kurun'
          ],
          related_entities: lowStockItems.slice(0, 10).map(p => ({ type: 'product', id: p.id })),
          is_read: false,
          is_dismissed: false,
          actionable: true,
          action_url: '/products?filter=low_stock',
          created_at: new Date().toISOString()
        });
      }

      // Detect slow-moving inventory (simple heuristic - low stock turnover)
      // This would require transaction history analysis in production
    }
  } catch (err) {
    logger.error('Error predicting inventory issues:', err);
  }

  return insights;
}

/**
 * Generate HR optimizations (leave balance, headcount)
 */
async function generateHROptimizations(companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Check for employees with high leave balance (optimization opportunity)
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, full_name, annual_leave_balance, sick_leave_balance')
      
      .eq('status', 'active');

    if (!error && employees) {
      const highLeaveBalance = employees.filter(e =>
        (e.annual_leave_balance || 0) > 15
      );

      if (highLeaveBalance.length > 0) {
        insights.push({
          id: `high-leave-balance-${Date.now()}`,
          company_id: companyId,
          insight_type: 'optimization',
          category: 'hr',
          title: `${highLeaveBalance.length} Çalışan Yüksek İzin Bakiyesine Sahip`,
          description: `${highLeaveBalance.length} çalışanın 15 günden fazla kullanılmamış izni var. İzin planlaması optimize edilebilir.`,
          severity: 'info',
          impact_score: 30,
          data_summary: {
            count: highLeaveBalance.length,
            avg_balance: Math.round(highLeaveBalance.reduce((sum, e) => sum + (e.annual_leave_balance || 0), 0) / highLeaveBalance.length),
            total_days: highLeaveBalance.reduce((sum, e) => sum + (e.annual_leave_balance || 0), 0)
          },
          recommendations: [
            'Çalışanları izin kullanmaya teşvik edin',
            'İzin planlaması yapın',
            'Yıl sonu izin yoğunluğunu önleyin',
            'İş-yaşam dengesi politikalarını gözden geçirin'
          ],
          related_entities: highLeaveBalance.slice(0, 10).map(e => ({ type: 'employee', id: e.id })),
          is_read: false,
          is_dismissed: false,
          actionable: true,
          action_url: '/employees',
          created_at: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    logger.error('Error generating HR optimizations:', err);
  }

  return insights;
}

/**
 * Save insights to database
 */
export async function saveInsights(insights: Insight[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_insights')
      .insert(
        insights.map(insight => ({
          company_id: insight.company_id,
          insight_type: insight.insight_type,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          impact_score: insight.impact_score,
          data_summary: insight.data_summary,
          recommendations: insight.recommendations,
          related_entities: insight.related_entities,
          is_read: false,
          is_dismissed: false,
          actionable: insight.actionable,
          action_url: insight.action_url,
          expires_at: insight.expires_at
        }))
      );

    if (error) {
      logger.error('Error saving insights:', error);
      return false;
    }

    return true;
  } catch (err) {
    logger.error('Error in saveInsights:', err);
    return false;
  }
}

/**
 * Get insights for company
 */
export async function getInsights(
  companyId: string,
  filters?: {
    category?: InsightCategory;
    severity?: InsightSeverity;
    dismissed?: boolean;
  }
): Promise<Insight[]> {
  try {
    let query = supabase
      .from('ai_insights')
      .select('*')
      
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.dismissed !== undefined) {
      query = query.eq('is_dismissed', filters.dismissed);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error('Error getting insights:', err);
    return [];
  }
}

/**
 * Mark insight as read
 */
export async function markInsightAsRead(insightId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', insightId);

    return !error;
  } catch (err) {
    logger.error('Error marking insight as read:', err);
    return false;
  }
}

/**
 * Dismiss insight
 */
export async function dismissInsight(insightId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_dismissed: true })
      .eq('id', insightId);

    return !error;
  } catch (err) {
    logger.error('Error dismissing insight:', err);
    return false;
  }
}

/**
 * Log insight interaction
 */
export async function logInsightInteraction(
  insightId: string,
  action: 'viewed' | 'dismissed' | 'acted' | 'shared' | 'feedback',
  comment?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('ai_insight_interactions')
      .insert({
        insight_id: insightId,
        user_id: user.id,
        action,
        comment
      });

    return !error;
  } catch (err) {
    logger.error('Error logging interaction:', err);
    return false;
  }
}
