import { supabase } from '@/integrations/supabase/client';

export interface SmartSuggestion {
  id: string;
  type: 'action' | 'insight' | 'warning' | 'tip';
  title: string;
  description: string;
  action?: {
    label: string;
    functionName: string;
    parameters: any;
  };
  priority: 'low' | 'medium' | 'high';
}

/**
 * Get current user's company_id
 */
const getCurrentCompanyId = async (): Promise<string | null> => {
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
};

/**
 * Generate smart suggestions based on business data
 */
export const generateSmartSuggestions = async (): Promise<SmartSuggestion[]> => {
  const suggestions: SmartSuggestion[] = [];
  const companyId = await getCurrentCompanyId();
  if (!companyId) return suggestions;

  try {
    // 1. Check for low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, name, stock_quantity')
      .eq('company_id', companyId)
      .lt('stock_quantity', 10)
      .limit(5);

    if (lowStockProducts && lowStockProducts.length > 0) {
      suggestions.push({
        id: 'low-stock-warning',
        type: 'warning',
        title: 'Düşük Stok Uyarısı',
        description: `${lowStockProducts.length} ürünün stoğu 10'un altında`,
        action: {
          label: 'Raporu Görüntüle',
          functionName: 'generate_excel',
          parameters: {
            reportType: 'inventory',
            filters: {}
          }
        },
        priority: 'high'
      });
    }

    // 2. Check for overdue tasks
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('company_id', companyId)
      .neq('status', 'completed')
      .lt('due_date', new Date().toISOString())
      .limit(5);

    if (overdueTasks && overdueTasks.length > 0) {
      suggestions.push({
        id: 'overdue-tasks',
        type: 'warning',
        title: 'Vadesi Geçen Görevler',
        description: `${overdueTasks.length} görevin vadesi geçmiş`,
        action: {
          label: 'Görevleri Görüntüle',
          functionName: 'manage_tasks',
          parameters: {
            action: 'list',
            filters: {}
          }
        },
        priority: 'high'
      });
    }

    // 3. Check for pending invoices
    const { data: pendingInvoices } = await supabase
      .from('sales_invoices')
      .select('id, invoice_number, grand_total')
      .eq('company_id', companyId)
      .eq('status', 'draft')
      .limit(10);

    if (pendingInvoices && pendingInvoices.length > 5) {
      suggestions.push({
        id: 'pending-invoices',
        type: 'tip',
        title: 'Bekleyen Faturalar',
        description: `${pendingInvoices.length} taslak fatura var`,
        action: {
          label: 'Fatura Listesi',
          functionName: 'generate_excel',
          parameters: {
            reportType: 'invoices',
            filters: {
              status: ['draft']
            }
          }
        },
        priority: 'medium'
      });
    }

    // 4. Monthly report suggestion
    const today = new Date();
    const isEndOfMonth = today.getDate() >= 25;
    
    if (isEndOfMonth) {
      suggestions.push({
        id: 'monthly-report',
        type: 'action',
        title: 'Aylık Rapor Zamanı',
        description: 'Bu ayın raporu için şimdi hazırlık yapabilirsiniz',
        action: {
          label: 'Rapor Oluştur',
          functionName: 'generate_excel',
          parameters: {
            reportType: 'sales',
            filters: {
              dateRange: {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
              }
            }
          }
        },
        priority: 'medium'
      });
    }

    // 5. Productivity insight
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (completedTasks && completedTasks.length > 10) {
      suggestions.push({
        id: 'productivity-insight',
        type: 'insight',
        title: '🎉 Harika İlerleme!',
        description: `Bu hafta ${completedTasks.length} görev tamamlandı`,
        priority: 'low'
      });
    }

  } catch (error) {
    console.error('Error generating suggestions:', error);
  }

  // Sort by priority
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Get quick actions for user
 */
export const getQuickActions = (): Array<{
  label: string;
  icon: string;
  prompt: string;
}> => {
  return [
    {
      label: 'Müşteri Listesi',
      icon: '👥',
      prompt: 'Müşteri listesini Excel\'e aktar'
    },
    {
      label: 'Satış Raporu',
      icon: '📊',
      prompt: 'Bu ayki satışları Excel\'e aktar'
    },
    {
      label: 'Stok Durumu',
      icon: '📦',
      prompt: 'Stok raporunu oluştur'
    },
    {
      label: 'Görevlerim',
      icon: '✅',
      prompt: 'Bekleyen görevlerimi göster'
    },
    {
      label: 'Fatura Listesi',
      icon: '🧾',
      prompt: 'Bu ayki faturaları listele'
    },
    {
      label: 'Yeni Görev',
      icon: '➕',
      prompt: 'Yeni görev oluştur'
    }
  ];
};

