import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user's company_id
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { period_days = 30 } = await req.json();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period_days);
    const periodEnd = new Date();

    // Fetch data from last period
    const [proposalsResult, paymentsResult, customersResult, expensesResult] = await Promise.all([
      // Proposals data
      supabaseClient
        .from('proposals')
        .select('status, total_amount, created_at')
        .eq('company_id', profile.company_id)
        .gte('created_at', periodStart.toISOString()),
      
      // Payments data
      supabaseClient
        .from('payments')
        .select('amount, payment_date, due_date')
        .eq('company_id', profile.company_id)
        .gte('payment_date', periodStart.toISOString()),
      
      // Customers data
      supabaseClient
        .from('customers')
        .select('created_at')
        .eq('company_id', profile.company_id)
        .gte('created_at', periodStart.toISOString()),
      
      // Expenses (cash_transactions)
      supabaseClient
        .from('cash_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('company_id', profile.company_id)
        .eq('transaction_type', 'expense')
        .gte('transaction_date', periodStart.toISOString()),
    ]);

    // Calculate metrics
    const proposals = proposalsResult.data || [];
    const payments = paymentsResult.data || [];
    const customers = customersResult.data || [];
    const expenses = expensesResult.data || [];

    const totalProposals = proposals.length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted' || p.status === 'won').length;
    const acceptanceRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const newCustomers = customers.length;
    
    const now = new Date();
    const overduePayments = payments
      .filter(p => p.due_date && new Date(p.due_date) < now && p.amount > 0)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);

    // Get previous period for comparison
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - period_days);
    
    const [prevProposalsResult, prevPaymentsResult, prevCustomersResult] = await Promise.all([
      supabaseClient
        .from('proposals')
        .select('status, total_amount')
        .eq('company_id', profile.company_id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString()),
      
      supabaseClient
        .from('payments')
        .select('amount')
        .eq('company_id', profile.company_id)
        .gte('payment_date', previousPeriodStart.toISOString())
        .lt('payment_date', periodStart.toISOString()),
      
      supabaseClient
        .from('customers')
        .select('id')
        .eq('company_id', profile.company_id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString()),
    ]);

    const prevProposals = prevProposalsResult.data || [];
    const prevPayments = prevPaymentsResult.data || [];
    const prevCustomers = prevCustomersResult.data || [];

    const proposalChange = prevProposals.length > 0 
      ? Math.round(((totalProposals - prevProposals.length) / prevProposals.length) * 100) 
      : 0;
    
    const prevRevenue = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const revenueChange = prevRevenue > 0 
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) 
      : 0;
    
    const customerChange = prevCustomers.length > 0 
      ? Math.round(((newCustomers - prevCustomers.length) / prevCustomers.length) * 100) 
      : 0;

    // Prepare data summary for AI
    const dataSummary = {
      totalProposals,
      acceptedProposals,
      acceptanceRate,
      totalRevenue: Math.round(totalRevenue),
      newCustomers,
      overduePayments: Math.round(overduePayments),
      totalExpenses: Math.round(totalExpenses),
      proposalChange,
      revenueChange,
      customerChange,
      period_days,
    };

    // Check if there's enough data
    if (totalProposals === 0 && payments.length === 0 && newCustomers === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'no_data',
          message: 'Henüz yeterli veri yok. Sistem kullanımınız arttıkça içgörüler oluşturulacak.' 
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Sen bir iş analisti asistanısın. Verilen iş verilerini analiz ederek Türkçe, kısa ve eyleme geçirilebilir içgörüler üretiyorsun.

KURALLAR:
1. 1-3 cümle ile özetle
2. Sayısal verileri vurgula (₺ sembolü kullan)
3. Trend yönünü belirt (artış/azalış/değişim)
4. Dikkat gerektiren noktaları işaretle
5. İş odaklı ve samimi ol
6. Türkçe yaz
7. Emoji kullan (📊 💰 👥 ⚠️ ✅)

FORMAT:
[Emoji] [Başlık] - [Trend açıklaması]. [Eylem önerisi veya dikkat noktası].`;

    const userPrompt = `
SON ${period_days} GÜN VERİ ÖZETİ:
- Toplam Teklif: ${dataSummary.totalProposals}
- Kabul Edilen: ${dataSummary.acceptedProposals} (%${dataSummary.acceptanceRate})
- Toplam Gelir: ₺${dataSummary.totalRevenue.toLocaleString('tr-TR')}
- Yeni Müşteri: ${dataSummary.newCustomers}
- Geciken Ödeme: ₺${dataSummary.overduePayments.toLocaleString('tr-TR')}
- Toplam Gider: ₺${dataSummary.totalExpenses.toLocaleString('tr-TR')}

Önceki dönem ile karşılaştırma:
- Teklif sayısı değişimi: ${dataSummary.proposalChange > 0 ? '+' : ''}${dataSummary.proposalChange}%
- Gelir değişimi: ${dataSummary.revenueChange > 0 ? '+' : ''}${dataSummary.revenueChange}%
- Müşteri değişimi: ${dataSummary.customerChange > 0 ? '+' : ''}${dataSummary.customerChange}%

Bu verilere göre en önemli 2-3 içgörüyü ver.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit', message: 'AI kullanım limiti aşıldı. Lütfen biraz bekleyin.' }), 
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'payment_required', message: 'Lovable AI kredisi tükendi. Lütfen kredi yükleyin.' }), 
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insightText = aiData.choices[0].message.content;

    // Save to database
    const { data: savedInsight, error: saveError } = await supabaseClient
      .from('ai_insights')
      .insert({
        company_id: profile.company_id,
        insight_text: insightText,
        insight_type: 'general',
        data_summary: dataSummary,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving insight:', saveError);
      throw saveError;
    }

    return new Response(
      JSON.stringify({ insight: savedInsight }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
