import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Banknote, Wrench, Package, ShoppingCart, Briefcase, Car, ArrowRight } from "lucide-react";
import ReportsFilters from "@/components/reports/ReportsFilters";
import AIReportChat from "@/components/reports/AIReportChat";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: typeof BarChart3;
  iconColor: string;
  bgColor: string;
  kpiQuery?: () => Promise<number>;
}

export default function ReportsOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // KPI queries for each category
  const { data: salesKPI } = useQuery({
    queryKey: ['sales-kpi-overview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('proposals')
        .select('total_amount')
        .eq('status', 'accepted')
        .limit(1);
      return data?.length || 0;
    }
  });

  const { data: financialKPI } = useQuery({
    queryKey: ['financial-kpi-overview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bank_accounts')
        .select('id')
        .limit(1);
      return data?.length || 0;
    }
  });

  const { data: serviceKPI } = useQuery({
    queryKey: ['service-kpi-overview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('id')
        .in('service_status', ['new', 'in_progress'])
        .limit(1);
      return data?.length || 0;
    }
  });

  const { data: inventoryKPI } = useQuery({
    queryKey: ['inventory-kpi-overview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      return data?.length || 0;
    }
  });

  const categories: ReportCategory[] = [
    {
      id: 'sales',
      title: 'Satış Raporları',
      description: 'Fırsatlar, teklifler ve satış performansı',
      path: '/reports/sales',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'financial',
      title: 'Finansal Raporlar',
      description: 'Banka hesapları ve nakit akışı',
      path: '/reports/financial',
      icon: Banknote,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'service',
      title: 'Servis Raporları',
      description: 'Servis kayıtları ve teknik performans',
      path: '/reports/service',
      icon: Wrench,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-500/10',
    },
    {
      id: 'inventory',
      title: 'Envanter Raporları',
      description: 'Stok durumu ve ürün analizleri',
      path: '/reports/inventory',
      icon: Package,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'purchasing',
      title: 'Satın Alma Raporları',
      description: 'Alış faturaları ve tedarikçi analizleri',
      path: '/reports/purchasing',
      icon: ShoppingCart,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'hr',
      title: 'İK Raporları',
      description: 'Çalışan listesi ve departman analizleri',
      path: '/reports/hr',
      icon: Briefcase,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-500/10',
    },
    {
      id: 'vehicles',
      title: 'Araç Filosu Raporları',
      description: 'Araç listesi ve bakım durumu',
      path: '/reports/vehicles',
      icon: Car,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-500/10',
    },
    {
      id: 'vat',
      title: 'KDV Analizi',
      description: 'KDV hesaplamaları ve analizleri',
      path: '/reports/vat-analysis',
      icon: BarChart3,
      iconColor: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
    },
  ];

  const getKPIValue = (categoryId: string) => {
    switch (categoryId) {
      case 'sales':
        return salesKPI;
      case 'financial':
        return financialKPI;
      case 'service':
        return serviceKPI;
      case 'inventory':
        return inventoryKPI;
      default:
        return undefined;
    }
  };

  return (
    <div className="space-y-4">
      {/* Gradient Header - Dashboard benzeri */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Raporlar & Analitik
              </h1>
              <p className="text-sm text-muted-foreground">
                Tüm modüller için detaylı raporlar ve analizler
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

      {/* AI Report Chat - Kompakt */}
      <div>
        <div className="mb-3">
          <h2 className="text-xl font-semibold mb-1">AI Rapor Asistanı</h2>
          <p className="text-sm text-muted-foreground">
            Raporlarınız hakkında sorular sorun, otomatik analizler alın
          </p>
        </div>
        <AIReportChat searchParams={searchParams} />
      </div>

      {/* Kategori Kartları - 4 Sütunlu Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Rapor Kategorileri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const kpiValue = getKPIValue(category.id);
            
            return (
              <Card
                key={category.id}
                className={cn(
                  "group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer",
                  "hover:border-primary/30"
                )}
                onClick={() => navigate(category.path)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-4">
                  {/* Icon & Title */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2.5 rounded-lg", category.bgColor)}>
                      <Icon className={cn("h-5 w-5", category.iconColor)} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {category.description}
                  </p>

                  {/* KPI Özeti */}
                  {kpiValue !== undefined && (
                    <div className="pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {kpiValue > 0 ? `${kpiValue} aktif kayıt` : 'Veri yok'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
