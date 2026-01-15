// Generate AI Insights - Edge Function
// Runs periodically via cron or manually triggered
// Generates anomaly detections, predictions, optimizations, and risk alerts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Insight {
  company_id: string;
  insight_type: 'anomaly' | 'prediction' | 'optimization' | 'risk';
  category: 'sales' | 'finance' | 'inventory' | 'hr' | 'operations' | 'general';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'opportunity';
  impact_score: number;
  data_summary: Record<string, any>;
  recommendations: string[];
  related_entities: Array<{ type: string; id: string }>;
  actionable: boolean;
  action_url?: string;
  expires_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { company_id, job_type } = body;

    let companyIds: string[] = [];

    if (company_id) {
      companyIds = [company_id];
    } else {
      const { data: companies } = await supabaseAdmin
        .from('companies')
        .select('id')
        .limit(100);

      companyIds = companies?.map(c => c.id) || [];
    }

    let totalInsights = 0;

    for (const compId of companyIds) {
      const insights = await generateInsightsForCompany(supabaseAdmin, compId);

      if (insights.length > 0) {
        // period_start, period_end ve insight_text ekle
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const insightsWithDates = insights.map(insight => ({
          ...insight,
          period_start: thirtyDaysAgo.toISOString().split('T')[0],
          period_end: now.toISOString().split('T')[0],
          insight_text: insight.description // Eski sütun için de veri ekle
        }));

        const { error } = await supabaseAdmin
          .from('ai_insights')
          .insert(insightsWithDates);

        if (!error) {
          totalInsights += insights.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        companies_processed: companyIds.length,
        insights_generated: totalInsights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateInsightsForCompany(
  supabase: any,
  companyId: string
): Promise<Insight[]> {
  const insights: Insight[] = [];

  const [
    salesInsights,
    financeInsights,
    inventoryInsights,
    hrInsights
  ] = await Promise.all([
    generateSalesInsights(supabase, companyId),
    generateFinanceInsights(supabase, companyId),
    generateInventoryInsights(supabase, companyId),
    generateHRInsights(supabase, companyId)
  ]);

  insights.push(...salesInsights, ...financeInsights, ...inventoryInsights, ...hrInsights);

  return insights;
}

async function generateSalesInsights(supabase: any, companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSales } = await supabase
      .from('sales_invoices')
      .select('total_amount, created_at')
      .eq('company_id', companyId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!recentSales || recentSales.length === 0) return insights;

    const last7Days = recentSales.filter((s: any) => {
      const date = new Date(s.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= sevenDaysAgo;
    });

    const prev7Days = recentSales.filter((s: any) => {
      const date = new Date(s.created_at);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });

    const last7Total = last7Days.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
    const prev7Total = prev7Days.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);

    if (prev7Total > 0) {
      const changePercent = ((last7Total - prev7Total) / prev7Total) * 100;

      if (changePercent < -30) {
        insights.push({
          company_id: companyId,
          insight_type: 'anomaly',
          category: 'sales',
          title: 'Satışlarda Olağandışı Düşüş Tespit Edildi',
          description: `Son 7 günde satışlar %${Math.abs(changePercent).toFixed(1)} düştü.`,
          severity: 'critical',
          impact_score: Math.min(100, Math.abs(Math.round(changePercent))),
          data_summary: {
            last_7_days: last7Total,
            previous_7_days: prev7Total,
            change_percent: changePercent.toFixed(1)
          },
          recommendations: [
            'Müşteri geri bildirimlerini inceleyin',
            'Rakip faaliyetlerini kontrol edin',
            'Pazarlama kampanyası düşünün'
          ],
          related_entities: [],
          actionable: true,
          action_url: '/reports?type=sales'
        });
      }
    }
  } catch (err) {
    console.error('Error generating sales insights:', err);
  }

  return insights;
}

async function generateFinanceInsights(supabase: any, companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const { data: overdueInvoices } = await supabase
      .from('sales_invoices')
      .select('id, total_amount, due_date')
      .eq('company_id', companyId)
      .eq('payment_status', 'unpaid')
      .lt('due_date', new Date().toISOString());

    if (overdueInvoices && overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      insights.push({
        company_id: companyId,
        insight_type: 'risk',
        category: 'finance',
        title: `${overdueInvoices.length} Vadesi Geçmiş Fatura`,
        description: `Toplam ₺${totalOverdue.toLocaleString('tr-TR')} tutarında vadesi geçmiş alacak var.`,
        severity: overdueInvoices.length > 10 ? 'critical' : 'warning',
        impact_score: Math.min(100, overdueInvoices.length * 5),
        data_summary: {
          count: overdueInvoices.length,
          total_amount: totalOverdue
        },
        recommendations: [
          'Tahsilat ekibine öncelik verin',
          'Müşterilere ödeme hatırlatması gönderin',
          'Ödeme planı oluşturun'
        ],
        related_entities: overdueInvoices.slice(0, 5).map((inv: any) => ({ type: 'invoice', id: inv.id })),
        actionable: true,
        action_url: '/sales-invoices?status=overdue'
      });
    }
  } catch (err) {
    console.error('Error generating finance insights:', err);
  }

  return insights;
}

async function generateInventoryInsights(supabase: any, companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, current_stock, reorder_point')
      .eq('company_id', companyId)
      .eq('track_stock', true);

    if (products) {
      const lowStockItems = products.filter((p: any) =>
        p.current_stock <= (p.reorder_point || 10)
      );

      if (lowStockItems.length > 0) {
        insights.push({
          company_id: companyId,
          insight_type: 'risk',
          category: 'inventory',
          title: `${lowStockItems.length} Ürün Kritik Stok Seviyesinde`,
          description: `${lowStockItems.length} ürün minimum stok seviyesinin altında.`,
          severity: lowStockItems.length > 10 ? 'critical' : 'warning',
          impact_score: Math.min(100, lowStockItems.length * 10),
          data_summary: {
            count: lowStockItems.length
          },
          recommendations: [
            'Acil sipariş verin',
            'Tedarikçilerle iletişime geçin',
            'Alternatif ürünler önerin'
          ],
          related_entities: lowStockItems.slice(0, 10).map((p: any) => ({ type: 'product', id: p.id })),
          actionable: true,
          action_url: '/products?filter=low_stock'
        });
      }
    }
  } catch (err) {
    console.error('Error generating inventory insights:', err);
  }

  return insights;
}

async function generateHRInsights(supabase: any, companyId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name, annual_leave_balance')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (employees) {
      const highLeaveBalance = employees.filter((e: any) =>
        (e.annual_leave_balance || 0) > 15
      );

      if (highLeaveBalance.length > 0) {
        insights.push({
          company_id: companyId,
          insight_type: 'optimization',
          category: 'hr',
          title: `${highLeaveBalance.length} Çalışan Yüksek İzin Bakiyesine Sahip`,
          description: `${highLeaveBalance.length} çalışanın 15 günden fazla kullanılmamış izni var.`,
          severity: 'info',
          impact_score: 30,
          data_summary: {
            count: highLeaveBalance.length
          },
          recommendations: [
            'Çalışanları izin kullanmaya teşvik edin',
            'İzin planlaması yapın',
            'Yıl sonu izin yoğunluğunu önleyin'
          ],
          related_entities: highLeaveBalance.slice(0, 10).map((e: any) => ({ type: 'employee', id: e.id })),
          actionable: true,
          action_url: '/employees'
        });
      }
    }
  } catch (err) {
    console.error('Error generating HR insights:', err);
  }

  return insights;
}
