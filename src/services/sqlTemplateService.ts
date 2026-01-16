/**
 * SQL Template Service
 * Provides template-based SQL generation for common queries
 * Reduces Gemini API calls by handling simple queries locally
 */

import { logger } from '@/utils/logger';

interface SQLTemplate {
  pattern: RegExp;
  generator: (match: RegExpMatchArray, tableName?: string) => string;
  description: string;
}

// Common SQL templates
const SQL_TEMPLATES: SQLTemplate[] = [
  // "tüm müşteriler", "bütün müşteriler", "müşteri listesi"
  {
    pattern: /^(t[üu]m|b[üu]t[üu]n|hepsi|liste)\s+(m[üu][şs]teriler?|customers?)$/i,
    generator: () => `SELECT * FROM customers ORDER BY created_at DESC LIMIT 100`,
    description: 'List all customers'
  },

  // "son 30 gün satışları", "son 7 gün satış"
  {
    pattern: /^son\s+(\d+)\s+(g[üu]n|ay|hafta)\s+(sat[ıi][şs]lar[ıi]?|invoices?)$/i,
    generator: (match) => {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      let days = amount;
      if (unit.includes('ay')) days = amount * 30;
      if (unit.includes('hafta')) days = amount * 7;

      return `SELECT * FROM sales_invoices WHERE created_at >= NOW() - INTERVAL '${days} days' ORDER BY created_at DESC LIMIT 100`;
    },
    description: 'Recent sales/invoices'
  },

  // "toplam satış", "satış toplamı"
  {
    pattern: /^(toplam|genel)\s+(sat[ıi][şs]|revenue|gelir)$/i,
    generator: () => `SELECT SUM(total_amount) as total_sales FROM sales_invoices`,
    description: 'Total sales'
  },

  // "ürün sayısı", "kaç ürün"
  {
    pattern: /^([üu]r[üu]n|product)\s+(say[ıi]s[ıi]|count|adet|ka[çc]|ne\s+kadar)$/i,
    generator: () => `SELECT COUNT(*) as product_count FROM products`,
    description: 'Product count'
  },

  // "stokta olmayan ürünler", "stoksuz ürünler"
  {
    pattern: /^(stokta?\s+olmayan|stoksuz|stok\s+yok)\s+([üu]r[üu]nler?)$/i,
    generator: () => `SELECT * FROM products WHERE current_stock <= 0 OR current_stock IS NULL ORDER BY name LIMIT 100`,
    description: 'Out of stock products'
  },

  // "düşük stoklu ürünler", "kritik stok"
  {
    pattern: /^(d[üu][şs][üu]k\s+stok|kritik\s+stok|minimum\s+stok)\s*([üu]r[üu]nler?)?$/i,
    generator: () => `SELECT * FROM products WHERE current_stock <= reorder_point AND reorder_point > 0 ORDER BY current_stock ASC LIMIT 100`,
    description: 'Low stock products'
  },

  // "bekleyen siparişler", "pending orders"
  {
    pattern: /^(bekleyen|pending|a[çc][ıi]k)\s+(sipari[şs]ler?|orders?)$/i,
    generator: () => `SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100`,
    description: 'Pending orders'
  },

  // "vadesi geçmiş faturalar"
  {
    pattern: /^(vadesi\s+ge[çc]mi[şs]|overdue)\s+(faturalar?|invoices?)$/i,
    generator: () => `SELECT * FROM sales_invoices WHERE due_date < NOW() AND payment_status != 'paid' ORDER BY due_date ASC LIMIT 100`,
    description: 'Overdue invoices'
  },

  // "aktif çalışanlar", "personel listesi"
  {
    pattern: /^(aktif|active)?\s*([çc]al[ıi][şs]anlar?|personel|employees?)\s*(listesi)?$/i,
    generator: () => `SELECT * FROM employees WHERE status = 'active' ORDER BY full_name LIMIT 100`,
    description: 'Active employees'
  },

  // "açık servis talepleri"
  {
    pattern: /^(a[çc][ıi]k|bekleyen|pending)\s+(servis\s+talep|service\s+request)ler[iı]?$/i,
    generator: () => `SELECT * FROM service_requests WHERE service_status IN ('pending', 'in_progress') ORDER BY created_at DESC LIMIT 100`,
    description: 'Open service requests'
  },

  // "bu ay satışlar", "bu ay gelir"
  {
    pattern: /^(bu\s+ay|this\s+month)\s+(sat[ıi][şs]|gelir|revenue)lar[ıi]?$/i,
    generator: () => `SELECT * FROM sales_invoices WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) ORDER BY created_at DESC LIMIT 100`,
    description: 'This month sales'
  },

  // "bu yıl satışlar"
  {
    pattern: /^(bu\s+y[ıi]l|this\s+year)\s+(sat[ıi][şs]|gelir|revenue)lar[ıi]?$/i,
    generator: () => `SELECT * FROM sales_invoices WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) ORDER BY created_at DESC LIMIT 100`,
    description: 'This year sales'
  },

  // "en çok satılan ürünler" (needs order_items or sales data)
  {
    pattern: /^(en\s+[çc]ok|most)\s+(sat[ıi]lan|sold)\s+([üu]r[üu]nler?)$/i,
    generator: () => `SELECT product_id, product_name, SUM(quantity) as total_sold FROM order_items GROUP BY product_id, product_name ORDER BY total_sold DESC LIMIT 20`,
    description: 'Best selling products'
  }
];

/**
 * Try to generate SQL from template
 * Returns null if no template matches
 */
export const tryGenerateSQLFromTemplate = (
  query: string,
  tableName?: string
): { sql: string; explanation: string; fromTemplate: boolean } | null => {
  const normalizedQuery = query.trim().toLowerCase();

  for (const template of SQL_TEMPLATES) {
    const match = normalizedQuery.match(template.pattern);

    if (match) {
      try {
        const sql = template.generator(match, tableName);
        logger.info(`SQL generated from template: "${query}" → ${template.description}`);

        return {
          sql,
          explanation: `Şablon kullanılarak oluşturuldu: ${template.description}`,
          fromTemplate: true
        };
      } catch (error) {
        logger.error('Template SQL generation error:', error);
        // Fall through to return null
      }
    }
  }

  return null;
};

/**
 * Check if query can be handled by template
 */
export const canHandleWithTemplate = (query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  return SQL_TEMPLATES.some(template => template.pattern.test(normalizedQuery));
};

/**
 * Get all available template descriptions (for debugging/docs)
 */
export const getAvailableTemplates = (): string[] => {
  return SQL_TEMPLATES.map(t => t.description);
};
