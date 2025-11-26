import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  LogOut,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { useSupplierPortalAuth } from '@/hooks/useSupplierPortal';
import { useState, useEffect } from 'react';

interface SupplierPortalLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/supplier-portal/dashboard', icon: LayoutDashboard },
  { name: 'Teklif Talepleri', href: '/supplier-portal/rfqs', icon: FileText },
  { name: 'Siparişler', href: '/supplier-portal/orders', icon: ShoppingCart },
];

export default function SupplierPortalLayout({ children }: SupplierPortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, supplier, logout, isLoading } = useSupplierPortalAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/supplier-portal/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/supplier-portal/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-emerald-900 to-emerald-950 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Tedarikçi Portalı</span>
          </div>
          <button
            className="lg:hidden text-emerald-200 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supplier info */}
        <div className="px-4 py-4 border-b border-emerald-800">
          <p className="text-sm text-emerald-300">Hoş geldiniz</p>
          <p className="text-white font-medium truncate">{supplier?.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-800 text-white'
                    : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-emerald-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-emerald-200 hover:bg-emerald-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b shadow-sm lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{supplier?.portal_email || supplier?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

