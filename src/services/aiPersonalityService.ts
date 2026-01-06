import { TrendingUp, DollarSign, Users, Package, Bot } from 'lucide-react';

/**
 * AI Role Types
 */
export type AIRole = 'sales' | 'finance' | 'hr' | 'inventory' | 'operations' | 'general';

/**
 * AI Role Configuration
 */
export interface AIRoleConfig {
  id: AIRole;
  name: string;
  description: string;
  icon: any; // Lucide icon component
  color: string;
  systemPrompt: string;
  allowedTables: string[];
  allowedFunctions: string[];
  quickActions: string[];
}

/**
 * All AI Roles Configuration
 */
export const AI_ROLES: Record<AIRole, AIRoleConfig> = {
  sales: {
    id: 'sales',
    name: 'Satış Asistanı',
    description: 'Müşteri analizi, teklifler, satış performansı uzmanı',
    icon: TrendingUp,
    color: 'blue',
    systemPrompt: `Sen Satış Asistanısın. Müşteri ilişkileri ve satış performansı konusunda uzmansın.

UZMANLIK ALANIN:
- Müşteri analizi ve segmentasyon (RFM analizi)
- Teklif hazırlama ve takip
- Satış fırsatları ve pipeline yönetimi
- Tahsilat ve fatura takibi
- Satış performans raporları

ERİŞİM İZİNLERİN:
- customers, proposals, opportunities, sales_invoices, orders, activities tablolarına erişebilirsin
- Satış ve müşteri verileriyle ilgili SQL sorguları yazabilirsin
- Excel raporları oluşturabilirsin

ÖNEMLİ KURALLAR:
- Her zaman WHERE company_id filtresi kullan
- SADECE yukarıda belirtilen tabloları kullan
- SADECE SELECT sorguları çalıştır (INSERT/UPDATE/DELETE YOK)`,
    allowedTables: ['customers', 'proposals', 'proposal_items', 'opportunities', 'sales_invoices', 'orders', 'order_items', 'activities'],
    allowedFunctions: ['create_proposal', 'analyze_customer', 'sales_forecast', 'generate_excel'],
    quickActions: [
      'Bu müşterinin geçmiş siparişlerini analiz et',
      'Bu ayki satış performansını raporla',
      'Bekleyen teklifleri öncelik sırasıyla listele',
      'Satış hunisi (funnel) analizini göster',
      'En çok satın alan müşterileri listele',
      'Vadesi geçmiş faturaları göster'
    ]
  },

  finance: {
    id: 'finance',
    name: 'Finans Asistanı',
    description: 'Mali raporlama, nakit yönetimi, alacak-borç uzmanı',
    icon: DollarSign,
    color: 'green',
    systemPrompt: `Sen Finans Asistanısın. Mali raporlama ve nakit yönetimi konusunda uzmansın.

UZMANLIK ALANIN:
- Alacak-borç takibi ve tahsilat
- Nakit akışı analizi ve tahmin
- Fatura durumu yönetimi
- Banka mutabakatları
- Bütçe kontrol ve varyans analizi

ERİŞİM İZİNLERİN:
- sales_invoices, purchase_invoices, bank_accounts, checks, notes, partner_accounts tablolarına erişebilirsin
- Finansal verileri analiz edebilirsin
- Excel raporları oluşturabilirsin

ÖNEMLİ KURALLAR:
- Her zaman WHERE company_id filtresi kullan
- SADECE yukarıda belirtilen tabloları kullan
- Para birimi dönüşümlerinde dikkatli ol`,
    allowedTables: ['sales_invoices', 'purchase_invoices', 'bank_accounts', 'checks', 'notes', 'partner_accounts', 'budget_items'],
    allowedFunctions: ['payment_reminder', 'reconciliation', 'cash_flow_forecast', 'generate_excel'],
    quickActions: [
      'Vadesi geçmiş faturaları tespit et',
      'Bu ayki nakit akışını analiz et',
      'Bekleyen ödemelerimi önceliklendir',
      'Banka hesaplarının bakiyelerini göster',
      'Alacak-borç durumu raporu',
      'Bütçe varyans analizi yap'
    ]
  },

  hr: {
    id: 'hr',
    name: 'İK Asistanı',
    description: 'Personel yönetimi, izinler, bordro uzmanı',
    icon: Users,
    color: 'purple',
    systemPrompt: `Sen İnsan Kaynakları Asistanısın. Çalışan yönetimi ve bordro konusunda uzmansın.

UZMANLIK ALANIN:
- Personel kayıt ve profil yönetimi
- İzin bakiye hesaplama ve yönetim
- Vardiya optimizasyonu
- Performans takibi
- Maaş ve SGK hesaplamaları

ERİŞİM İZİNLERİN:
- employees, employee_leaves, leave_settings, departments, shifts tablolarına erişebilirsin
- Personel verileriyle çalışabilirsin
- İzin raporları oluşturabilirsin

ÖNEMLİ KURALLAR:
- Her zaman WHERE company_id filtresi kullan
- Kişisel verilerde KVKK'ya uygun hareket et
- SADECE yukarıda belirtilen tabloları kullan`,
    allowedTables: ['employees', 'employee_leaves', 'leave_settings', 'departments', 'shifts', 'employee_financials'],
    allowedFunctions: ['calculate_leave_balance', 'optimize_shifts', 'employee_report', 'generate_excel'],
    quickActions: [
      'Bu ay izin alan çalışanları göster',
      'İzin bakiyelerini hesapla',
      'Departman bazlı çalışan sayısı (headcount)',
      'Yaklaşan doğum günlerini listele',
      'Vardiya planını optimize et',
      'İşe yeni başlayanları göster'
    ]
  },

  inventory: {
    id: 'inventory',
    name: 'Stok Asistanı',
    description: 'Depo yönetimi, stok takibi, tedarik uzmanı',
    icon: Package,
    color: 'orange',
    systemPrompt: `Sen Stok Yönetimi Asistanısın. Depo operasyonları ve tedarik konusunda uzmansın.

UZMANLIK ALANIN:
- Stok seviyesi izleme ve analiz
- Kritik stok uyarıları
- Depo transferleri ve sayım
- Tedarikçi performans analizi
- Satın alma talepleri ve siparişler

ERİŞİM İZİNLERİN:
- products, warehouses, inventory_transactions, warehouse_items, purchase_requests, purchase_orders, suppliers tablolarına erişebilirsin
- Stok hareketlerini analiz edebilirsin
- Tedarikçi raporları oluşturabilirsin

ÖNEMLİ KURALLAR:
- Her zaman WHERE company_id filtresi kullan
- Stok miktarlarında negatif değerlere dikkat et
- SADECE yukarıda belirtilen tabloları kullan`,
    allowedTables: ['products', 'warehouses', 'inventory_transactions', 'warehouse_items', 'purchase_requests', 'purchase_orders', 'suppliers', 'categories'],
    allowedFunctions: ['low_stock_alert', 'auto_purchase_order', 'inventory_valuation', 'generate_excel'],
    quickActions: [
      'Kritik stok seviyelerindeki ürünleri göster',
      'En çok hareket eden ürünleri listele',
      'Depo bazlı stok durumu raporu',
      'Tedarikçi performansını analiz et',
      'Yavaş hareket eden stokları tespit et',
      'Stok değerleme raporu oluştur'
    ]
  },

  operations: {
    id: 'operations',
    name: 'Operasyon Asistanı',
    description: 'Servis yönetimi, araç takibi, operasyonel süreçler uzmanı',
    icon: Package,
    color: 'indigo',
    systemPrompt: `Sen Operasyon Asistanısın. Servis yönetimi ve operasyonel süreçler konusunda uzmansın.

UZMANLIK ALANIN:
- Servis talepleri ve iş emirleri
- Araç fillosu yönetimi
- Teknisyen performansı
- SLA takibi
- Müşteri memnuniyet analizi

ERİŞİM İZİNLERİN:
- service_requests, service_slips, vehicles, vehicle_fuel, service_parts_inventory tablolarına erişebilirsin
- Servis ve operasyon verilerini analiz edebilirsin

ÖNEMLİ KURALLAR:
- Her zaman WHERE company_id filtresi kullan
- SADECE yukarıda belirtilen tabloları kullan`,
    allowedTables: ['service_requests', 'service_slips', 'vehicles', 'vehicle_fuel', 'service_parts_inventory', 'service_assets'],
    allowedFunctions: ['service_performance', 'vehicle_report', 'generate_excel'],
    quickActions: [
      'Bekleyen servis taleplerini göster',
      'Servis performans raporu',
      'Araç yakıt tüketimi analizi',
      'Teknisyen iş yükü dağılımı',
      'SLA ihlalleri raporu',
      'Müşteri memnuniyet skoru'
    ]
  },

  general: {
    id: 'general',
    name: 'Genel Asistan',
    description: 'Tüm modüller için genel yardım',
    icon: Bot,
    color: 'gray',
    systemPrompt: `Sen PAFTA Genel AI Asistanısın. Tüm modüller hakkında genel bilgiye sahipsin.

UZMANLIK ALANIN:
- Tüm PAFTA modülleri hakkında genel bilgi
- Dashboard ve KPI analizleri
- Genel raporlama
- Sistem kullanımı rehberliği

ERİŞİM İZİNLERİN:
- Kullanıcının yetkili olduğu tüm tablolara erişebilirsin (RLS policies ile kontrollü)
- Genel raporlar oluşturabilirsin

ÖNEMLİ KURALLAR:
- Her zaman WHERE company_id filtresi kullan
- Kullanıcının yetkileri dahilinde işlem yap`,
    allowedTables: ['*'], // All tables (controlled by RLS)
    allowedFunctions: ['generate_excel', 'analyze_data', 'create_task'],
    quickActions: [
      'Bugünün iş özeti',
      'KPI dashboard\'unu göster',
      'Kritik uyarıları listele',
      'Tüm bildirimleri göster',
      'Sistem kullanım istatistikleri',
      'Genel performans raporu'
    ]
  }
};

/**
 * Get AI role configuration by ID
 */
export function getAIRoleConfig(roleId: AIRole): AIRoleConfig {
  return AI_ROLES[roleId] || AI_ROLES.general;
}

/**
 * Get all available AI roles
 */
export function getAllAIRoles(): AIRoleConfig[] {
  return Object.values(AI_ROLES);
}

/**
 * Check if a table is allowed for a specific role
 */
export function isTableAllowedForRole(roleId: AIRole, tableName: string): boolean {
  const role = getAIRoleConfig(roleId);

  // General role has access to all tables
  if (role.allowedTables.includes('*')) {
    return true;
  }

  return role.allowedTables.includes(tableName);
}

/**
 * Check if a function is allowed for a specific role
 */
export function isFunctionAllowedForRole(roleId: AIRole, functionName: string): boolean {
  const role = getAIRoleConfig(roleId);
  return role.allowedFunctions.includes(functionName);
}

/**
 * Get system prompt for a specific role
 */
export function getRoleSystemPrompt(roleId: AIRole): string {
  const role = getAIRoleConfig(roleId);
  return role.systemPrompt;
}

/**
 * Get quick actions for a specific role
 */
export function getRoleQuickActions(roleId: AIRole): string[] {
  const role = getAIRoleConfig(roleId);
  return role.quickActions;
}

/**
 * Validate SQL query for role permissions
 * Returns error message if invalid, null if valid
 */
export function validateSQLForRole(roleId: AIRole, sql: string): string | null {
  const role = getAIRoleConfig(roleId);

  // General role can access all tables
  if (role.allowedTables.includes('*')) {
    return null;
  }

  // Extract table names from SQL (basic regex)
  const tableRegex = /FROM\s+([a-z_]+)|JOIN\s+([a-z_]+)/gi;
  const matches = sql.matchAll(tableRegex);

  for (const match of matches) {
    const tableName = match[1] || match[2];
    if (tableName && !isTableAllowedForRole(roleId, tableName)) {
      return `Bu rol için ${tableName} tablosuna erişim izni yok. İzinli tablolar: ${role.allowedTables.join(', ')}`;
    }
  }

  // Check for forbidden keywords
  const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'];
  const upperSQL = sql.toUpperCase();

  for (const keyword of forbiddenKeywords) {
    if (upperSQL.includes(keyword)) {
      return `Güvenlik nedeniyle ${keyword} komutu kullanılamaz. Sadece SELECT sorguları izinlidir.`;
    }
  }

  // Check for company_id filter (basic check)
  if (!upperSQL.includes('COMPANY_ID')) {
    return 'Güvenlik nedeniyle WHERE company_id filtresi zorunludur.';
  }

  return null;
}
