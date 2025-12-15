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
    
    // Check if this is an employee detail page (UUID pattern)
    const employeeDetailMatch = path.match(/^\/employees\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    
    if (employeeDetailMatch) {
      const employeeId = employeeDetailMatch[1];
      
      // Fetch employee name first, then add tab with employee name
      supabase
        .from('employees')
        .select('first_name, last_name')
        .eq('id', employeeId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            const employeeName = `${data.first_name} ${data.last_name}`;
            addTab(path, employeeName);
          } else {
            // If fetch fails, add tab with fallback title
            addTab(path, 'Çalışan Detayı');
          }
        })
        .catch(() => {
          // If fetch fails, add tab with fallback title
          addTab(path, 'Çalışan Detayı');
        });
    } else {
      // Get title for the path
      const title = getTitleForPath(path, t);
      
      // Always add/activate tab for current path
      addTab(path, title);
    }
  }, [location.pathname, addTab, updateTabTitle, t]);
}
