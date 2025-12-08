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
  
  // Pattern matching for detail pages and specific routes
  const patterns: Record<string, string> = {
    // Detail pages
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
    '/service/detail/': 'Servis Detay',
    '/service/edit/': 'Servis Düzenle',
    '/service/new': 'Yeni Servis Talebi',
    '/contracts/': 'Sözleşme Detay',
    '/vehicles/': 'Araç Detay',
    '/sales-invoices/': 'Satış Faturası',
    '/purchase-invoices/': 'Alış Faturası',
    '/purchasing/requests/': 'Satın Alma Talebi',
    '/purchasing/rfqs/': 'RFQ Detay',
    '/purchasing/orders/': 'Satın Alma Siparişi',
    '/purchasing/grns/': 'GRN Detay',
    // Service routes
    '/service/reports': 'Servis Raporları',
    '/service/settings': 'Servis Ayarları',
    '/service/parts': 'Servis Parçaları',
    '/service/list': 'Servis Listesi',
    '/service/kanban': 'Servis Kanban',
    '/service/scheduling': 'Servis Planlama',
    '/service/calendar': 'Servis Takvimi',
    '/service/contracts': 'Servis Sözleşmeleri',
    '/service/assets': 'Servis Varlıkları',
    '/service/warranties': 'Servis Garantileri',
    '/service/maintenance': 'Bakım Takvimi',
    // PDF Templates
    '/pdf-templates/new': 'Yeni PDF Şablonu',
    '/pdf-templates/edit/': 'PDF Şablonu Düzenle',
    '/pdf-templates/service/new': 'Yeni Servis Şablonu',
    '/pdf-templates/service/edit/': 'Servis Şablonu Düzenle',
    // Cashflow detail pages
    '/cashflow/cash-accounts/': 'Nakit Hesap Detay',
    '/cashflow/credit-cards/': 'Kredi Kartı Detay',
    '/cashflow/bank-accounts/': 'Banka Hesabı Detay',
    '/cashflow/partner-accounts/': 'Ortak Hesap Detay',
    // E-Invoice
    '/e-invoice': 'E-Fatura',
    '/e-invoice/process/': 'E-Fatura İşle',
    // Profile
    '/profile': 'Profil',
    // Settings sub-pages
    '/notifications': 'Bildirim Ayarları',
    '/nilvera': 'Nilvera Ayarları',
    // Deliveries
    '/deliveries/new': 'Yeni Teslimat',
    // Financial
    '/financial-overview': 'Finansal Özet',
    '/sales-invoices/create': 'Yeni Satış Faturası',
    // Contract routes
    '/contracts/service': 'Servis Sözleşmeleri',
    '/contracts/vehicle': 'Araç Sözleşmeleri',
    '/contracts/customer': 'Müşteri Sözleşmeleri',
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
  
  // Smart fallback: generate title from path
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : null;
    
    // Handle common patterns
    if (lastSegment === 'new' && secondLastSegment) {
      const parentTitle = pathTitleMap[`/${secondLastSegment}`] || secondLastSegment;
      return `Yeni ${parentTitle}`;
    }
    
    if (lastSegment === 'edit' && secondLastSegment) {
      const parentTitle = pathTitleMap[`/${secondLastSegment}`] || secondLastSegment;
      return `${parentTitle} Düzenle`;
    }
    
    if (lastSegment === 'create' && secondLastSegment) {
      const parentTitle = pathTitleMap[`/${secondLastSegment}`] || secondLastSegment;
      return `Yeni ${parentTitle}`;
    }
    
    // Capitalize and format last segment
    const formatted = lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formatted;
  }
  
  // Last resort
  return 'Sayfa';
}

export function useTabNavigation() {
  const location = useLocation();
  const { addTab, tabs } = useTabs();

  useEffect(() => {
    const path = location.pathname;
    
    // Skip certain paths
    if (path === '/' || path === '/login' || path === '/auth') {
      return;
    }
    
    // Get title for the path
    const title = getTitleForPath(path);
    
    // Always add/activate tab for current path
    addTab(path, title);
  }, [location.pathname, addTab]);
}
