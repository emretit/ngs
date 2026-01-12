import { PageContext } from '@/contexts/AIContext';
import { logger } from '@/utils/logger';

/**
 * Route to Business Context Mapping
 * Maps application routes to their corresponding business modules and data entities
 */
export const ROUTE_CONTEXT_MAP: Record<string, Omit<PageContext, 'route'>> = {
  // Dashboard
  '/dashboard': {
    module: 'Dashboard',
    entities: ['*'],
    pageData: { type: 'overview' }
  },
  '/dashboard-v2': {
    module: 'Dashboard',
    entities: ['*'],
    pageData: { type: 'overview_v2' }
  },

  // AI
  '/ai-assistant': {
    module: 'AI',
    entities: ['ai_conversations', 'ai_messages'],
    pageData: { type: 'dedicated_chat' }
  },

  // CRM - Customers
  '/customers': {
    module: 'CRM',
    entities: ['customers'],
    pageData: { type: 'list' }
  },
  '/customers/create': {
    module: 'CRM',
    entities: ['customers'],
    pageData: { type: 'create' }
  },

  // CRM - Suppliers
  '/suppliers': {
    module: 'Purchasing',
    entities: ['suppliers'],
    pageData: { type: 'list' }
  },

  // Sales - Proposals
  '/proposals': {
    module: 'Sales',
    entities: ['proposals', 'customers'],
    pageData: { type: 'list' }
  },
  '/proposals/create': {
    module: 'Sales',
    entities: ['proposals', 'customers', 'products'],
    pageData: { type: 'create' }
  },
  '/proposal/create': {
    module: 'Sales',
    entities: ['proposals', 'customers', 'products'],
    pageData: { type: 'create' }
  },

  // Sales - Orders
  '/orders': {
    module: 'Sales',
    entities: ['orders', 'customers'],
    pageData: { type: 'list' }
  },

  // Sales - Invoices
  '/sales-invoices': {
    module: 'Sales',
    entities: ['sales_invoices', 'customers'],
    pageData: { type: 'list' }
  },
  '/sales-invoices/create': {
    module: 'Sales',
    entities: ['sales_invoices', 'customers', 'products'],
    pageData: { type: 'create' }
  },

  // Purchasing
  '/purchase-requests': {
    module: 'Purchasing',
    entities: ['purchase_requests', 'products', 'suppliers'],
    pageData: { type: 'list' }
  },
  '/purchase-orders': {
    module: 'Purchasing',
    entities: ['purchase_orders', 'suppliers', 'products'],
    pageData: { type: 'list' }
  },
  '/purchase-invoices': {
    module: 'Purchasing',
    entities: ['purchase_invoices', 'suppliers'],
    pageData: { type: 'list' }
  },

  // E-Invoice Management
  '/e-invoice': {
    module: 'Finance',
    entities: ['einvoices', 'einvoices_sent', 'einvoices_received', 'outgoing_invoices'],
    pageData: { type: 'list' }
  },
  '/e-invoice/outgoing': {
    module: 'Finance',
    entities: ['outgoing_invoices', 'customers'],
    pageData: { type: 'list' }
  },
  '/e-invoice/incoming': {
    module: 'Finance',
    entities: ['einvoices_received', 'suppliers'],
    pageData: { type: 'list' }
  },

  // Inventory
  '/products': {
    module: 'Inventory',
    entities: ['products', 'categories'],
    pageData: { type: 'list' }
  },
  '/products/create': {
    module: 'Inventory',
    entities: ['products', 'categories', 'suppliers'],
    pageData: { type: 'create' }
  },
  '/warehouses': {
    module: 'Inventory',
    entities: ['warehouses', 'warehouse_items'],
    pageData: { type: 'list' }
  },
  '/inventory': {
    module: 'Inventory',
    entities: ['products', 'warehouses', 'warehouse_items', 'inventory_transactions'],
    pageData: { type: 'overview' }
  },

  // Finance
  '/bank-accounts': {
    module: 'Finance',
    entities: ['bank_accounts'],
    pageData: { type: 'list' }
  },
  '/cashflow': {
    module: 'Finance',
    entities: ['bank_accounts', 'sales_invoices', 'purchase_invoices', 'checks', 'notes'],
    pageData: { type: 'cashflow_overview' }
  },
  '/checks': {
    module: 'Finance',
    entities: ['checks', 'bank_accounts'],
    pageData: { type: 'list' }
  },
  '/notes': {
    module: 'Finance',
    entities: ['notes', 'bank_accounts'],
    pageData: { type: 'list' }
  },

  // HR
  '/employees': {
    module: 'HR',
    entities: ['employees', 'departments'],
    pageData: { type: 'list' }
  },
  '/employee-leaves': {
    module: 'HR',
    entities: ['employee_leaves', 'employees', 'leave_settings'],
    pageData: { type: 'list' }
  },
  '/departments': {
    module: 'HR',
    entities: ['departments', 'employees'],
    pageData: { type: 'list' }
  },

  // Service Management
  '/service-requests': {
    module: 'Service',
    entities: ['service_requests', 'customers'],
    pageData: { type: 'list' }
  },
  '/service-slips': {
    module: 'Service',
    entities: ['service_slips', 'customers', 'service_requests'],
    pageData: { type: 'list' }
  },

  // Settings
  '/settings': {
    module: 'Settings',
    entities: ['*'],
    pageData: { type: 'general_settings' }
  },
};

/**
 * Quick action prompts for each module
 */
export const MODULE_QUICK_PROMPTS: Record<string, string[]> = {
  CRM: [
    'Müşteri listesini Excel\'e aktar',
    'En çok alışveriş yapan müşterileri göster',
    'Yeni müşteri ekle',
    'Müşteri segmentasyonu yap'
  ],
  Sales: [
    'Bu ayki satışları raporla',
    'Bekleyen teklifleri listele',
    'Yeni teklif oluştur',
    'Vadesi geçmiş faturaları göster'
  ],
  Purchasing: [
    'Bekleyen satın alma taleplerini göster',
    'Tedarikçi performansını analiz et',
    'Yeni satın alma siparişi oluştur',
    'Tedarikçi karşılaştırma raporu'
  ],
  Inventory: [
    'Kritik stok seviyelerindeki ürünleri göster',
    'Stok raporunu oluştur',
    'En çok hareket eden ürünleri listele',
    'Depo bazlı stok durumu'
  ],
  Finance: [
    'Nakit akışı analizini göster',
    'Bekleyen ödemeleri listele',
    'Banka hesaplarının bakiyelerini göster',
    'Alacak-borç durumu raporu'
  ],
  HR: [
    'Bu ay izin alan çalışanları göster',
    'İzin bakiyelerini hesapla',
    'Departman bazlı çalışan sayısı',
    'Yaklaşan doğum günleri'
  ],
  Service: [
    'Bekleyen servis taleplerini göster',
    'Servis performans raporu',
    'Müşteri memnuniyet analizi',
    'Teknik personel iş yükü'
  ],
  Dashboard: [
    'Bugünün iş özeti',
    'KPI dashboard\'u göster',
    'Kritik uyarıları listele',
    'Tüm bildirimleri göster'
  ],
  AI: [
    'Yeni sohbet başlat',
    'Önceki sohbetleri göster',
    'AI yeteneklerini açıkla',
    'Hızlı raporlar'
  ],
};

/**
 * Detects the current page context from the route
 */
export function detectPageContext(pathname: string): PageContext {
  // Normalize pathname
  const normalizedPath = pathname.toLowerCase();

  // Try exact match first
  if (ROUTE_CONTEXT_MAP[normalizedPath]) {
    return {
      route: normalizedPath,
      ...ROUTE_CONTEXT_MAP[normalizedPath]
    };
  }

  // Try to match dynamic routes (e.g., /customers/123 -> /customers)
  const pathSegments = normalizedPath.split('/').filter(Boolean);

  // Try parent route
  if (pathSegments.length > 1) {
    const parentPath = `/${pathSegments[0]}`;
    if (ROUTE_CONTEXT_MAP[parentPath]) {
      const context = ROUTE_CONTEXT_MAP[parentPath];

      // If there's an ID in the path, extract it
      const potentialId = pathSegments[1];
      const entityIds = isUUID(potentialId) ? [potentialId] : undefined;

      return {
        route: normalizedPath,
        ...context,
        entityIds,
        pageData: {
          ...context.pageData,
          type: 'detail',
          id: potentialId
        }
      };
    }
  }

  // Default context for unknown routes
  // Don't warn for auth routes or common system routes
  const isAuthRoute = normalizedPath.startsWith('/signin') || 
                      normalizedPath.startsWith('/signup') || 
                      normalizedPath.startsWith('/auth') ||
                      normalizedPath === '/' ||
                      normalizedPath.startsWith('/reset-password');
  
  if (!isAuthRoute) {
    logger.warn('Unknown route for context detection', { pathname });
  }
  
  return {
    route: normalizedPath,
    module: 'General',
    entities: ['*'],
    pageData: { type: 'unknown' }
  };
}

/**
 * Gets quick action prompts for a specific module
 */
export function getQuickPromptsForModule(module?: string): string[] {
  if (!module || !MODULE_QUICK_PROMPTS[module]) {
    return MODULE_QUICK_PROMPTS.Dashboard;
  }
  return MODULE_QUICK_PROMPTS[module];
}

/**
 * Extracts entity IDs from URL pathname
 * Looks for UUID patterns in the path
 */
export function extractEntityIdsFromPath(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.filter(segment => isUUID(segment));
}

/**
 * Checks if a string is a valid UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Builds a context-aware system prompt for AI
 */
export function buildContextAwarePrompt(context: PageContext, companyId: string): string {
  const { route, module, entities, entityIds } = context;

  let prompt = `Sen PAFTA ERP AI Asistanısın.\n\n`;
  prompt += `KULLANICI BAĞLAMI:\n`;
  prompt += `- Şu anda: ${route} sayfasında\n`;

  if (module) {
    prompt += `- Modül: ${module}\n`;
  }

  if (entities && entities.length > 0) {
    const entitiesList = entities.includes('*') ? 'Tüm tablolar' : entities.join(', ');
    prompt += `- Erişilebilir veriler: ${entitiesList}\n`;
  }

  if (entityIds && entityIds.length > 0) {
    prompt += `- Görüntülenen kayıt ID: ${entityIds[0]}\n`;
  }

  prompt += `\nBU SAYFA İÇİN ÖZELLEŞTİRİLMİŞ YARDIM:\n`;
  prompt += `- Sayfadaki işlemler hakkında bilgi ver\n`;
  prompt += `- Görünen verileri analiz et\n`;
  prompt += `- Hızlı aksiyonlar öner\n`;

  if (entities && !entities.includes('*')) {
    prompt += `- SQL sorguları yazarken SADECE ${entities.join(', ')} tablolarını kullan\n`;
  }

  prompt += `\nÖNEMLİ GÜVENLİK KURALI:\n`;
  prompt += `- Her SQL sorgusuna WHERE company_id = '${companyId}' filtresi ekle (multi-tenant security)\n`;
  prompt += `- SADECE SELECT sorguları çalıştır, INSERT/UPDATE/DELETE/DROP yasak\n`;

  return prompt;
}

/**
 * Enriches page context with additional data if available
 */
export function enrichPageContext(
  baseContext: PageContext,
  additionalData?: Record<string, any>
): PageContext {
  if (!additionalData) {
    return baseContext;
  }

  return {
    ...baseContext,
    pageData: {
      ...baseContext.pageData,
      ...additionalData
    }
  };
}
