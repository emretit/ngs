import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '@/components/tabs/TabContext';
import { navItems } from '@/components/navbar/nav-config';

// Build a flat map of path -> title from navItems
function buildPathTitleMap(): Record<string, string> {
  const map: Record<string, string> = {};
  
  function processItem(item: any) {
    map[item.path] = item.label;
    if (item.items) {
      item.items.forEach(processItem);
    }
  }
  
  navItems.forEach(processItem);
  
  // Add some common detail page patterns
  return map;
}

const pathTitleMap = buildPathTitleMap();

// Get title for a path, including pattern matching for detail pages
function getTitleForPath(path: string): string {
  // Direct match
  if (pathTitleMap[path]) {
    return pathTitleMap[path];
  }
  
  // Pattern matching for detail pages
  const patterns: Record<string, string> = {
    '/customers/': 'Müşteri Detay',
    '/suppliers/': 'Tedarikçi Detay',
    '/products/': 'Ürün Detay',
    '/employees/': 'Çalışan Detay',
    '/opportunities/': 'Fırsat Detay',
    '/proposals/': 'Teklif Detay',
    '/proposal/': 'Teklif',
    '/orders/': 'Sipariş Detay',
    '/deliveries/': 'Teslimat Detay',
    '/service/tickets/': 'Servis Talebi',
    '/contracts/': 'Sözleşme Detay',
    '/vehicles/': 'Araç Detay',
    '/sales-invoices/': 'Satış Faturası',
    '/purchase-invoices/': 'Alış Faturası',
    '/purchasing/requests/': 'Satın Alma Talebi',
    '/purchasing/rfqs/': 'RFQ Detay',
    '/purchasing/orders/': 'Satın Alma Siparişi',
    '/purchasing/grns/': 'GRN Detay',
  };
  
  for (const [pattern, title] of Object.entries(patterns)) {
    if (path.includes(pattern)) {
      return title;
    }
  }
  
  // Fallback: try to match parent path
  const segments = path.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const parentPath = '/' + segments.slice(0, i + 1).join('/');
    if (pathTitleMap[parentPath]) {
      return pathTitleMap[parentPath];
    }
  }
  
  // Last resort
  return 'Sayfa';
}

export function useTabNavigation() {
  const location = useLocation();
  const { addTab, getTabByPath } = useTabs();

  useEffect(() => {
    const path = location.pathname;
    
    // Skip certain paths
    if (path === '/' || path === '/login' || path === '/auth') {
      return;
    }
    
    // Check if tab already exists
    const existingTab = getTabByPath(path);
    if (existingTab) {
      return;
    }
    
    // Get title for the path
    const title = getTitleForPath(path);
    
    // Add the tab
    addTab(path, title);
  }, [location.pathname, addTab, getTabByPath]);
}
