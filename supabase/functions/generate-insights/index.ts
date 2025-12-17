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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client for auth verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message || 'Auth session missing!' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Create service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'Company not found', details: profileError?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Company ID:', profile.company_id);

    const { period_days = 30 } = await req.json();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period_days);
    const periodEnd = new Date();

    // Check for today's cached insight - strict same-day check
    const today = periodEnd.toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`;
    
    const { data: existingInsight, error: cacheError } = await supabaseClient
      .from('ai_insights')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('period_end', today)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (existingInsight && !cacheError) {
      console.log('✅ Returning cached insight from today:', today);
      return new Response(
        JSON.stringify({ insight: existingInsight, cached: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('❌ No cached insight found for today, generating new one...');

    // Fetch data from last period - comprehensive analysis
    const [
      proposalsResult, 
      paymentsResult, 
      customersResult, 
      expensesResult,
      opportunitiesResult,
      activitiesResult,
      salesInvoicesResult,
      employeesResult,
      bankTransactionsResult,
      checksResult,
      suppliersResult,
      purchaseInvoicesResult
    ] = await Promise.all([
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
        .select('created_at, status')
        .eq('company_id', profile.company_id)
        .gte('created_at', periodStart.toISOString()),
      
      // Expenses (cash_transactions)
      supabaseClient
        .from('cash_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('company_id', profile.company_id)
        .eq('transaction_type', 'expense')
        .gte('transaction_date', periodStart.toISOString()),
      
      // Opportunities data
      supabaseClient
        .from('opportunities')
        .select('status, estimated_value, created_at, expected_close_date')
        .eq('company_id', profile.company_id)
        .gte('created_at', periodStart.toISOString()),
      
      // Activities data
      supabaseClient
        .from('activities')
        .select('status, priority, created_at, due_date')
        .eq('company_id', profile.company_id)
        .gte('created_at', periodStart.toISOString()),
      
      // Sales Invoices
      supabaseClient
        .from('sales_invoices')
        .select('total_amount, status, invoice_date')
        .eq('company_id', profile.company_id)
        .gte('invoice_date', periodStart.toISOString()),
      
      // Employees (active count)
      supabaseClient
        .from('employees')
        .select('id, is_active, created_at')
        .eq('company_id', profile.company_id),
      
      // Bank Transactions
      supabaseClient
        .from('bank_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('company_id', profile.company_id)
        .gte('transaction_date', periodStart.toISOString()),
      
      // Checks (with NULL safety for issue_date)
      supabaseClient
        .from('checks')
        .select('amount, status, due_date, check_type, issue_date')
        .eq('company_id', profile.company_id)
        .not('issue_date', 'is', null)
        .gte('issue_date', periodStart.toISOString()),
      
      // Suppliers
      supabaseClient
        .from('suppliers')
        .select('created_at')
        .eq('company_id', profile.company_id)
        .gte('created_at', periodStart.toISOString()),
      
      // Purchase Invoices
      supabaseClient
        .from('purchase_invoices')
        .select('total_amount, status, invoice_date')
        .eq('company_id', profile.company_id)
        .gte('invoice_date', periodStart.toISOString()),
    ]);

    // Calculate metrics
    const proposals = proposalsResult.data || [];
    const payments = paymentsResult.data || [];
    const customers = customersResult.data || [];
    const expenses = expensesResult.data || [];
    const opportunities = opportunitiesResult.data || [];
    const activities = activitiesResult.data || [];
    const salesInvoices = salesInvoicesResult.data || [];
    const employees = employeesResult.data || [];
    const bankTransactions = bankTransactionsResult.data || [];
    const checks = checksResult.data || [];
    const suppliers = suppliersResult.data || [];
    const purchaseInvoices = purchaseInvoicesResult.data || [];

    const now = new Date();

    // Proposal metrics
    const totalProposals = proposals.length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted' || p.status === 'won').length;
    const acceptanceRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;
    
    // Payment metrics
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const overduePayments = payments
      .filter(p => p.due_date && new Date(p.due_date) < now && p.amount > 0)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Customer metrics
    const newCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'aktif').length;
    
    // Expense metrics
    const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
    
    // Opportunity metrics
    const totalOpportunities = opportunities.length;
    const wonOpportunities = opportunities.filter(o => o.status === 'won').length;
    const opportunityValue = opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
    const conversionRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;
    
    // Activity metrics
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const overdueActivities = activities.filter(a => a.due_date && new Date(a.due_date) < now && a.status !== 'completed').length;
    
    // Invoice metrics
    const totalSalesInvoices = salesInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const paidInvoices = salesInvoices.filter(i => i.status === 'paid').length;
    const totalPurchaseInvoices = purchaseInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
    
    // Employee metrics
    const activeEmployees = employees.filter(e => e.is_active).length;
    const newEmployees = employees.filter(e => e.created_at && new Date(e.created_at) >= periodStart).length;
    
    // Bank transaction metrics
    const bankIncome = bankTransactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const bankExpense = bankTransactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Check metrics
    const receivableChecks = checks.filter(c => c.check_type === 'tahsil_edilecek').reduce((sum, c) => sum + (c.amount || 0), 0);
    const payableChecks = checks.filter(c => c.check_type === 'odenecek').reduce((sum, c) => sum + (c.amount || 0), 0);
    const overdueChecks = checks.filter(c => c.due_date && new Date(c.due_date) < now && c.status !== 'odendi').length;
    
    // Supplier metrics
    const newSuppliers = suppliers.length;

    // Get previous period for comparison
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - period_days);
    
    const [
      prevProposalsResult, 
      prevPaymentsResult, 
      prevCustomersResult,
      prevOpportunitiesResult,
      prevActivitiesResult
    ] = await Promise.all([
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
      
      supabaseClient
        .from('opportunities')
        .select('status')
        .eq('company_id', profile.company_id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString()),
      
      supabaseClient
        .from('activities')
        .select('status')
        .eq('company_id', profile.company_id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString()),
    ]);

    const prevProposals = prevProposalsResult.data || [];
    const prevPayments = prevPaymentsResult.data || [];
    const prevCustomers = prevCustomersResult.data || [];
    const prevOpportunities = prevOpportunitiesResult.data || [];
    const prevActivities = prevActivitiesResult.data || [];

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
    
    const opportunityChange = prevOpportunities.length > 0
      ? Math.round(((totalOpportunities - prevOpportunities.length) / prevOpportunities.length) * 100)
      : 0;
    
    const activityChange = prevActivities.length > 0
      ? Math.round(((totalActivities - prevActivities.length) / prevActivities.length) * 100)
      : 0;

    // Prepare data summary for AI
    const dataSummary = {
      // Proposals
      totalProposals,
      acceptedProposals,
      acceptanceRate,
      proposalChange,
      
      // Revenue & Payments
      totalRevenue: Math.round(totalRevenue),
      overduePayments: Math.round(overduePayments),
      revenueChange,
      
      // Customers
      newCustomers,
      activeCustomers,
      customerChange,
      
      // Expenses
      totalExpenses: Math.round(totalExpenses),
      
      // Opportunities (Sales Pipeline)
      totalOpportunities,
      wonOpportunities,
      opportunityValue: Math.round(opportunityValue),
      conversionRate,
      opportunityChange,
      
      // Activities (Operational)
      totalActivities,
      completedActivities,
      overdueActivities,
      activityChange,
      
      // Invoices
      totalSalesInvoices: Math.round(totalSalesInvoices),
      paidInvoices,
      totalPurchaseInvoices: Math.round(totalPurchaseInvoices),
      
      // Employees
      activeEmployees,
      newEmployees,
      
      // Bank Transactions
      bankIncome: Math.round(bankIncome),
      bankExpense: Math.round(bankExpense),
      
      // Checks
      receivableChecks: Math.round(receivableChecks),
      payableChecks: Math.round(payableChecks),
      overdueChecks,
      
      // Suppliers
      newSuppliers,
      
      period_days,
    };

    // Check if there's enough data
    if (totalProposals === 0 && payments.length === 0 && newCustomers === 0 && totalOpportunities === 0 && totalActivities === 0) {
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
SON ${period_days} GÜN İŞ VERİLERİ ÖZETİ:

📊 SATIŞ & TEKLİFLER:
- Toplam Teklif: ${dataSummary.totalProposals} (${dataSummary.proposalChange > 0 ? '+' : ''}${dataSummary.proposalChange}%)
- Kabul Edilen: ${dataSummary.acceptedProposals} (%${dataSummary.acceptanceRate} kabul oranı)
- Satış Faturaları: ₺${dataSummary.totalSalesInvoices.toLocaleString('tr-TR')} (${dataSummary.paidInvoices} ödendi)

💰 GELİR & ÖDEME:
- Toplam Gelir: ₺${dataSummary.totalRevenue.toLocaleString('tr-TR')} (${dataSummary.revenueChange > 0 ? '+' : ''}${dataSummary.revenueChange}%)
- Geciken Ödeme: ₺${dataSummary.overduePayments.toLocaleString('tr-TR')}
- Banka Giriş: ₺${dataSummary.bankIncome.toLocaleString('tr-TR')}
- Banka Çıkış: ₺${dataSummary.bankExpense.toLocaleString('tr-TR')}

🎯 FIRSAT & DÖNÜŞÜM:
- Fırsat Sayısı: ${dataSummary.totalOpportunities} (${dataSummary.opportunityChange > 0 ? '+' : ''}${dataSummary.opportunityChange}%)
- Kazanılan: ${dataSummary.wonOpportunities} (%${dataSummary.conversionRate} dönüşüm)
- Fırsat Değeri: ₺${dataSummary.opportunityValue.toLocaleString('tr-TR')}

✅ OPERASYONEL:
- Toplam Görev: ${dataSummary.totalActivities} (${dataSummary.activityChange > 0 ? '+' : ''}${dataSummary.activityChange}%)
- Tamamlanan: ${dataSummary.completedActivities}
- Geciken Görev: ${dataSummary.overdueActivities}

👥 MÜŞTERİ & ÇALIŞAN:
- Yeni Müşteri: ${dataSummary.newCustomers} (${dataSummary.customerChange > 0 ? '+' : ''}${dataSummary.customerChange}%)
- Aktif Müşteri: ${dataSummary.activeCustomers}
- Aktif Çalışan: ${dataSummary.activeEmployees}
- Yeni Çalışan: ${dataSummary.newEmployees}

💳 ÇEK & ALACAK:
- Tahsil Edilecek Çek: ₺${dataSummary.receivableChecks.toLocaleString('tr-TR')}
- Ödenecek Çek: ₺${dataSummary.payableChecks.toLocaleString('tr-TR')}
- Vadesi Geçmiş Çek: ${dataSummary.overdueChecks}

🛒 ALIŞ & GİDER:
- Toplam Alış Faturası: ₺${dataSummary.totalPurchaseInvoices.toLocaleString('tr-TR')}
- Toplam Gider: ₺${dataSummary.totalExpenses.toLocaleString('tr-TR')}
- Yeni Tedarikçi: ${dataSummary.newSuppliers}

Bu kapsamlı verilere göre işletmenin durumunu özetleyen 2-3 kritik içgörü ver. En önemli trendleri ve dikkat edilmesi gereken noktaları vurgula.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
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
