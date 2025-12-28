import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '@/components/tabs/TabContext';
import { navItems } from '@/components/navbar/nav-config';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

// Build a flat map of path -> translation key from navItems
function buildPathTitleMap(): Record<string, string> {
  const map: Record<string, string> = {};
  
  function processItem(item: any) {
    if (item.translationKey) {
      map[item.path] = item.translationKey;
    } else {
      map[item.path] = item.label;
    }
    if (item.items) {
      item.items.forEach(processItem);
    }
  }
  
  navItems.forEach(processItem);
  
  return map;
}

const pathTitleMap = buildPathTitleMap();

// Get title for a path, including pattern matching for detail pages
function getTitleForPath(path: string, t: (key: string) => string): string {
  // Direct match - use translation key if available
  if (pathTitleMap[path]) {
    const translationKey = pathTitleMap[path];
    // If it's a translation key (starts with nav.), translate it
    if (translationKey.startsWith('nav.')) {
      return t(translationKey);
    }
    // Otherwise return as is (fallback for old labels)
    return translationKey;
  }
  
  // Pattern matching for detail pages and specific routes
  const patterns: Record<string, string> = {
    // Detail pages - employees pattern'i en son kontrol edilmeli (detay sayfaları önce kontrol edilsin)
    '/customers/': 'nav.customers',
    '/suppliers/': 'nav.suppliers',
    '/products/': 'nav.products',
    '/opportunities/': 'nav.opportunities',
    '/proposals/': 'nav.proposals',
    '/proposal/': 'nav.proposals',
    '/orders/': 'nav.orders',
    '/deliveries/': 'nav.deliveries',
    '/service/tickets/': 'nav.service',
    '/service/detail/': 'nav.service',
    '/service/edit/': 'nav.service',
    '/service/new': 'nav.service',
    '/contracts/': 'nav.contractManagement',
    '/vehicles/': 'nav.vehicleManagement',
    '/sales-invoices/': 'nav.salesInvoices',
    '/purchase-invoices/': 'nav.purchaseInvoices',
    '/purchasing/requests/': 'nav.purchaseRequests',
    '/purchasing/rfqs/': 'nav.purchaseRfqs',
    '/purchasing/orders/': 'nav.purchaseOrders',
    '/purchasing/grns/': 'nav.purchaseGrns',
    '/service/reports': 'nav.service',
    '/service/settings': 'nav.service',
    '/service/parts': 'nav.service',
    '/service/list': 'nav.service',
    '/service/kanban': 'nav.service',
    '/service/scheduling': 'nav.service',
    '/service/calendar': 'nav.service',
    '/service/contracts': 'nav.serviceContracts',
    '/service/assets': 'nav.service',
    '/service/warranties': 'nav.service',
    '/service/maintenance': 'nav.service',
    '/pdf-templates/new': 'nav.pdfTemplates',
    '/pdf-templates/edit/': 'nav.pdfTemplates',
    '/pdf-templates/service/new': 'nav.pdfTemplates',
    '/pdf-templates/service/edit/': 'nav.pdfTemplates',
    '/cashflow/cash-accounts/': 'nav.accounts',
    '/cashflow/credit-cards/': 'nav.accounts',
    '/cashflow/bank-accounts/': 'nav.accounts',
    '/cashflow/partner-accounts/': 'nav.accounts',
    '/e-invoice': 'nav.eInvoice',
    '/e-invoice/process/': 'nav.eInvoice',
    '/profile': 'settings.profile',
    '/notifications': 'settings.notifications',
    '/nilvera': 'nav.eInvoiceIntegrator',
    '/deliveries/new': 'nav.deliveries',
    '/financial-overview': 'nav.reports',
    '/sales-invoices/create': 'nav.salesInvoices',
    '/contracts/service': 'nav.serviceContracts',
    '/contracts/vehicle': 'nav.vehicleContracts',
    '/contracts/customer': 'nav.customerContracts',
    '/employees/': 'nav.employees', // Bu en son kontrol edilmeli, detay sayfaları önce kontrol edilsin
    '/organization-chart': 'nav.organizationChart',
  };
  
  for (const [pattern, translationKey] of Object.entries(patterns)) {
    if (path.includes(pattern)) {
      return t(translationKey);
    }
  }
  
  // Fallback: try to match parent path
  const segments = path.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const parentPath = '/' + segments.slice(0, i + 1).join('/');
    if (pathTitleMap[parentPath]) {
      const translationKey = pathTitleMap[parentPath];
      if (translationKey.startsWith('nav.')) {
        return t(translationKey);
      }
      return translationKey;
    }
  }
  
  // Smart fallback: generate title from path
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : null;
    
    // Handle common patterns
    if (lastSegment === 'new' && secondLastSegment) {
      const parentPath = `/${secondLastSegment}`;
      const parentKey = pathTitleMap[parentPath];
      if (parentKey && parentKey.startsWith('nav.')) {
        return t('common.create') + ' ' + t(parentKey);
      }
      return t('common.create') + ' ' + (parentKey || secondLastSegment);
    }
    
    if (lastSegment === 'edit' && secondLastSegment) {
      const parentPath = `/${secondLastSegment}`;
      const parentKey = pathTitleMap[parentPath];
      if (parentKey && parentKey.startsWith('nav.')) {
        return t(parentKey) + ' ' + t('common.edit');
      }
      return (parentKey || secondLastSegment) + ' ' + t('common.edit');
    }
    
    if (lastSegment === 'create' && secondLastSegment) {
      const parentPath = `/${secondLastSegment}`;
      const parentKey = pathTitleMap[parentPath];
      if (parentKey && parentKey.startsWith('nav.')) {
        return t('common.create') + ' ' + t(parentKey);
      }
      return t('common.create') + ' ' + (parentKey || secondLastSegment);
    }
    
    // Capitalize and format last segment
    const formatted = lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formatted;
  }
  
  // Last resort
  return t('common.view');
}

// Helper function to fetch and set tab title for detail pages
async function fetchDetailPageTitle(
  path: string,
  table: string,
  id: string,
  fields: string[],
  formatter: (data: any) => string,
  fallbackTitle: string,
  addTab: (path: string, title: string) => void
) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(fields.join(', '))
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      const title = formatter(data);
      addTab(path, title);
    } else {
      addTab(path, fallbackTitle);
    }
  } catch {
    addTab(path, fallbackTitle);
  }
}

export function useTabNavigation() {
  const location = useLocation();
  const { addTab, updateTabTitle, tabs } = useTabs();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    
    // Skip certain paths
    if (path === '/' || path === '/login' || path === '/auth') {
      return;
    }
    
    // UUID pattern for detail pages
    const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const match = path.match(uuidPattern);
    
    if (match) {
      const id = match[1];
      
      // Employee detail page
      if (path.match(/^\/employees\//)) {
        fetchDetailPageTitle(
          path,
          'employees',
          id,
          ['first_name', 'last_name'],
          (data) => `${data.first_name} ${data.last_name}`,
          'Çalışan Detayı',
          addTab
        );
        return;
      }
      
      // Customer detail page
      if (path.match(/^\/customers\//)) {
        fetchDetailPageTitle(
          path,
          'customers',
          id,
          ['name', 'company', 'type'],
          (data) => {
            if (data.type === 'kurumsal' && data.company) {
              return data.company;
            }
            return data.name || 'Müşteri';
          },
          'Müşteri Detayı',
          addTab
        );
        return;
      }
      
      // Supplier detail page
      if (path.match(/^\/suppliers\//)) {
        fetchDetailPageTitle(
          path,
          'suppliers',
          id,
          ['name', 'company'],
          (data) => data.company || data.name || 'Tedarikçi',
          'Tedarikçi Detayı',
          addTab
        );
        return;
      }
      
      // Product detail page
      if (path.match(/^\/products\//) || path.match(/^\/product-details\//)) {
        fetchDetailPageTitle(
          path,
          'products',
          id,
          ['name'],
          (data) => data.name || 'Ürün',
          'Ürün Detayı',
          addTab
        );
        return;
      }
      
      // Product form/edit page
      if (path.match(/^\/product-form\//)) {
        fetchDetailPageTitle(
          path,
          'products',
          id,
          ['name'],
          (data) => data.name || 'Ürün Düzenle',
          'Ürün Düzenle',
          addTab
        );
        return;
      }
      
      // Proposal detail page
      if (path.match(/^\/proposal\//)) {
        fetchDetailPageTitle(
          path,
          'proposals',
          id,
          ['number', 'title'],
          (data) => data.number || data.title || 'Teklif',
          'Teklif Detayı',
          addTab
        );
        return;
      }
      
      // Order detail page
      if (path.match(/^\/orders\//)) {
        fetchDetailPageTitle(
          path,
          'orders',
          id,
          ['order_number'],
          (data) => data.order_number || 'Sipariş',
          'Sipariş Detayı',
          addTab
        );
        return;
      }
      
      // Service detail page
      if (path.match(/^\/service\/detail\//)) {
        fetchDetailPageTitle(
          path,
          'service_requests',
          id,
          ['service_number', 'service_title'],
          (data) => data.service_number || data.service_title || 'Servis',
          'Servis Detayı',
          addTab
        );
        return;
      }
      
      // Sales invoice detail page
      if (path.match(/^\/sales-invoices\//)) {
        fetchDetailPageTitle(
          path,
          'sales_invoices',
          id,
          ['fatura_no'],  // invoice_number yerine fatura_no
          (data) => data.fatura_no || 'Fatura',  // invoice_number yerine fatura_no
          'Fatura Detayı',
          addTab
        );
        return;
      }
      
      // Purchase invoice detail page
      if (path.match(/^\/purchase-invoices\//)) {
        fetchDetailPageTitle(
          path,
          'purchase_invoices',
          id,
          ['invoice_number'],
          (data) => data.invoice_number || 'Fatura',
          'Fatura Detayı',
          addTab
        );
        return;
      }
      
      // E-invoice process page
      if (path.match(/^\/e-invoice\/process\//)) {
        fetchDetailPageTitle(
          path,
          'einvoices',
          id,
          ['invoice_number', 'supplier_name'],
          (data) => data.invoice_number || 'E-Fatura İşleme',
          'E-Fatura İşleme',
          addTab
        );
        return;
      }
    }
    
    // Default: Get title for the path
    const title = getTitleForPath(path, t);
    addTab(path, title);
  }, [location.pathname, addTab, updateTabTitle, t]);
}
