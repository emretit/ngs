import { supabase } from '@/integrations/supabase/client';
import { chatWithAI } from './geminiService';

export interface RiskFactor {
  name: string;
  score: number; // 0-100 (0 = no risk, 100 = high risk)
  level: 'low' | 'medium' | 'high';
  description: string;
  recommendation?: string;
}

export interface RiskAnalysisResult {
  overallScore: number; // 0-100
  overallLevel: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  aiRecommendations?: string;
  lastUpdated: Date;
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
 * Determine risk level from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

/**
 * Calculate Cash Flow Risk
 * Based on cash flow trend and negative balance days
 */
export async function calculateCashFlowRisk(): Promise<RiskFactor> {
  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      return {
        name: 'Nakit Akışı Riski',
        score: 0,
        level: 'low',
        description: 'Veri yok',
      };
    }

    // Get recent cash movements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('company_id', companyId);

    const { data: cashAccounts } = await supabase
      .from('cash_accounts')
      .select('current_balance')
      .eq('company_id', companyId);

    const totalCash =
      (bankAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0) +
      (cashAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0);

    // Get payables due soon
    const { data: payables } = await supabase
      .from('einvoices')
      .select('remaining_amount')
      .eq('company_id', companyId)
      .gt('remaining_amount', 0);

    const totalPayables = payables?.reduce((sum, p) => sum + (p.remaining_amount || 0), 0) || 0;

    // Calculate risk score
    let score = 0;
    let description = '';

    if (totalCash <= 0) {
      score = 100;
      description = 'Kritik: Negatif nakit bakiyesi';
    } else if (totalPayables > totalCash * 1.5) {
      score = 80;
      description = 'Yüksek: Borçlar nakdi aşıyor';
    } else if (totalPayables > totalCash) {
      score = 60;
      description = 'Orta: Borçlar nakde yakın';
    } else if (totalPayables > totalCash * 0.7) {
      score = 40;
      description = 'Düşük-Orta: Nakit yönetimi gerekli';
    } else {
      score = 20;
      description = 'Düşük: Sağlıklı nakit pozisyonu';
    }

    return {
      name: 'Nakit Akışı Riski',
      score,
      level: getRiskLevel(score),
      description,
      recommendation:
        score > 60
          ? 'Acil nakit girişi sağlayın veya ödeme planı yapın'
          : score > 30
          ? 'Tahsilat takibini hızlandırın'
          : undefined,
    };
  } catch (error) {
    console.error('Cash flow risk calculation error:', error);
    return {
      name: 'Nakit Akışı Riski',
      score: 0,
      level: 'low',
      description: 'Hesaplama hatası',
    };
  }
}

/**
 * Calculate Receivables Risk
 * Based on overdue receivables
 */
export async function calculateReceivablesRisk(): Promise<RiskFactor> {
  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      return {
        name: 'Alacak Riski',
        score: 0,
        level: 'low',
        description: 'Veri yok',
      };
    }

    const { data: customers } = await supabase
      .from('customers')
      .select('balance')
      .eq('company_id', companyId);

    const totalReceivables = customers?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;

    // Get overdue invoices (simplified - checking all invoices)
    const { data: invoices } = await supabase
      .from('sales_invoices')
      .select('invoice_date, total_amount, paid_amount')
      .eq('company_id', companyId);

    let overdueAmount = 0;
    const now = new Date();

    invoices?.forEach((inv) => {
      const dueDate = new Date(inv.invoice_date);
      dueDate.setDate(dueDate.getDate() + 30); // Assume 30 day payment terms

      if (dueDate < now) {
        const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
        if (remaining > 0) {
          overdueAmount += remaining;
        }
      }
    });

    // Calculate risk score
    let score = 0;
    let description = '';

    if (totalReceivables === 0) {
      score = 0;
      description = 'Alacak yok';
    } else {
      const overduePercentage = (overdueAmount / totalReceivables) * 100;

      if (overduePercentage > 50) {
        score = 90;
        description = `Kritik: %${overduePercentage.toFixed(0)} gecikmiş alacak`;
      } else if (overduePercentage > 30) {
        score = 70;
        description = `Yüksek: %${overduePercentage.toFixed(0)} gecikmiş alacak`;
      } else if (overduePercentage > 15) {
        score = 50;
        description = `Orta: %${overduePercentage.toFixed(0)} gecikmiş alacak`;
      } else if (overduePercentage > 5) {
        score = 30;
        description = `Düşük-Orta: %${overduePercentage.toFixed(0)} gecikmiş alacak`;
      } else {
        score = 10;
        description = 'Düşük: Az gecikmiş alacak';
      }
    }

    return {
      name: 'Alacak Riski',
      score,
      level: getRiskLevel(score),
      description,
      recommendation:
        score > 60
          ? 'Acil tahsilat aksiyonu alın'
          : score > 30
          ? 'Müşteri hatırlatmaları yapın'
          : undefined,
    };
  } catch (error) {
    console.error('Receivables risk calculation error:', error);
    return {
      name: 'Alacak Riski',
      score: 0,
      level: 'low',
      description: 'Hesaplama hatası',
    };
  }
}

/**
 * Calculate Customer Concentration Risk
 * Risk of depending too much on few customers
 */
export async function calculateConcentrationRisk(): Promise<RiskFactor> {
  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      return {
        name: 'Müşteri Yoğunlaşma Riski',
        score: 0,
        level: 'low',
        description: 'Veri yok',
      };
    }

    // Get revenue by customer (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: invoices } = await supabase
      .from('sales_invoices')
      .select('customer_id, total_amount')
      .eq('company_id', companyId)
      .gte('invoice_date', oneYearAgo.toISOString());

    if (!invoices || invoices.length === 0) {
      return {
        name: 'Müşteri Yoğunlaşma Riski',
        score: 0,
        level: 'low',
        description: 'Yeterli veri yok',
      };
    }

    // Group by customer
    const customerRevenue: Record<string, number> = {};
    let totalRevenue = 0;

    invoices.forEach((inv) => {
      const customerId = inv.customer_id || 'unknown';
      customerRevenue[customerId] = (customerRevenue[customerId] || 0) + (inv.total_amount || 0);
      totalRevenue += inv.total_amount || 0;
    });

    // Sort customers by revenue
    const sortedCustomers = Object.entries(customerRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3 customers

    const top3Revenue = sortedCustomers.reduce((sum, [, revenue]) => sum + revenue, 0);
    const top3Percentage = (top3Revenue / totalRevenue) * 100;

    // Calculate risk score
    let score = 0;
    let description = '';

    if (top3Percentage > 70) {
      score = 90;
      description = `Kritik: İlk 3 müşteri %${top3Percentage.toFixed(0)} ciro`;
    } else if (top3Percentage > 50) {
      score = 70;
      description = `Yüksek: İlk 3 müşteri %${top3Percentage.toFixed(0)} ciro`;
    } else if (top3Percentage > 35) {
      score = 50;
      description = `Orta: İlk 3 müşteri %${top3Percentage.toFixed(0)} ciro`;
    } else if (top3Percentage > 20) {
      score = 30;
      description = `Düşük-Orta: İlk 3 müşteri %${top3Percentage.toFixed(0)} ciro`;
    } else {
      score = 10;
      description = `Düşük: Dengeli müşteri portföyü`;
    }

    return {
      name: 'Müşteri Yoğunlaşma Riski',
      score,
      level: getRiskLevel(score),
      description,
      recommendation:
        score > 60
          ? 'Yeni müşteri kazanımına odaklanın'
          : score > 30
          ? 'Müşteri portföyünü çeşitlendirin'
          : undefined,
    };
  } catch (error) {
    console.error('Concentration risk calculation error:', error);
    return {
      name: 'Müşteri Yoğunlaşma Riski',
      score: 0,
      level: 'low',
      description: 'Hesaplama hatası',
    };
  }
}

/**
 * Calculate Inventory Risk (if applicable)
 * Based on slow-moving or excess inventory
 */
export async function calculateInventoryRisk(): Promise<RiskFactor> {
  try {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      return {
        name: 'Stok Riski',
        score: 0,
        level: 'low',
        description: 'Veri yok',
      };
    }

    const { data: products } = await supabase
      .from('products')
      .select('current_stock, min_stock_level')
      .eq('company_id', companyId);

    if (!products || products.length === 0) {
      return {
        name: 'Stok Riski',
        score: 0,
        level: 'low',
        description: 'Stok verisi yok',
      };
    }

    // Calculate excess and shortage
    let excessItems = 0;
    let shortageItems = 0;
    let totalItems = products.length;

    products.forEach((p) => {
      const stock = p.current_stock || 0;
      const minLevel = p.min_stock_level || 0;

      if (stock < minLevel && minLevel > 0) {
        shortageItems++;
      } else if (stock > minLevel * 3 && minLevel > 0) {
        excessItems++;
      }
    });

    const problemPercentage = ((excessItems + shortageItems) / totalItems) * 100;

    // Calculate risk score
    let score = 0;
    let description = '';

    if (problemPercentage > 40) {
      score = 80;
      description = `Yüksek: %${problemPercentage.toFixed(0)} stok sorunu`;
    } else if (problemPercentage > 25) {
      score = 60;
      description = `Orta-Yüksek: %${problemPercentage.toFixed(0)} stok sorunu`;
    } else if (problemPercentage > 15) {
      score = 40;
      description = `Orta: %${problemPercentage.toFixed(0)} stok sorunu`;
    } else if (problemPercentage > 5) {
      score = 20;
      description = `Düşük: %${problemPercentage.toFixed(0)} stok sorunu`;
    } else {
      score = 5;
      description = 'Düşük: İyi stok yönetimi';
    }

    return {
      name: 'Stok Riski',
      score,
      level: getRiskLevel(score),
      description,
      recommendation:
        score > 50 ? 'Stok optimizasyonu yapın' : score > 30 ? 'Stok seviyelerini gözden geçirin' : undefined,
    };
  } catch (error) {
    console.error('Inventory risk calculation error:', error);
    return {
      name: 'Stok Riski',
      score: 0,
      level: 'low',
      description: 'Hesaplama hatası',
    };
  }
}

/**
 * Generate comprehensive risk analysis
 */
export async function generateRiskAnalysis(): Promise<RiskAnalysisResult> {
  try {
    // Calculate all risk factors in parallel
    const [cashFlowRisk, receivablesRisk, concentrationRisk, inventoryRisk] = await Promise.all([
      calculateCashFlowRisk(),
      calculateReceivablesRisk(),
      calculateConcentrationRisk(),
      calculateInventoryRisk(),
    ]);

    const factors = [cashFlowRisk, receivablesRisk, concentrationRisk, inventoryRisk];

    // Calculate weighted overall score
    // Cash flow and receivables are more critical
    const weights = [0.35, 0.35, 0.20, 0.10];
    const overallScore = Math.round(
      factors.reduce((sum, factor, idx) => sum + factor.score * weights[idx], 0)
    );

    // Get AI recommendations
    let aiRecommendations: string | undefined;
    try {
      const riskSummary = factors
        .map((f) => `${f.name}: ${f.score}/100 (${f.level}) - ${f.description}`)
        .join('\n');

      const prompt = `Risk analizi sonuçlarına bakarak 2-3 cümlelik Türkçe öneri ver:
${riskSummary}

Genel Risk Skoru: ${overallScore}/100

En kritik risklere odaklan ve öncelikli aksiyonları belirt.`;

      const response = await chatWithAI(prompt);
      if (response.content) {
        aiRecommendations = response.content;
      }
    } catch (error) {
      console.error('AI recommendations generation failed:', error);
    }

    return {
      overallScore,
      overallLevel: getRiskLevel(overallScore),
      factors,
      aiRecommendations,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error generating risk analysis:', error);
    throw error;
  }
}
