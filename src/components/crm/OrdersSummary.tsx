import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrderStats } from "@/types/orders";

const OrdersSummary = () => {
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    total_value: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        setLoading(true);
        
        // Orders tablosundan istatistikleri çek
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, total_amount');
          
        if (error) {
          console.error('Orders table error:', error);
          // Fallback olarak mock data kullan
          setOrderStats({
            total: 0,
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            completed: 0,
            cancelled: 0,
            total_value: 0
          });
          return;
        }
        
        if (orders) {
          const stats: OrderStats = {
            total: orders.length,
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            completed: 0,
            cancelled: 0,
            total_value: 0
          };
          
          orders.forEach(order => {
            if (stats.hasOwnProperty(order.status)) {
              stats[order.status as keyof Omit<OrderStats, 'total' | 'total_value'>]++;
            }
            stats.total_value += Number(order.total_amount || 0);
          });
          
          setOrderStats(stats);
        }
      } catch (error) {
        console.error('Error fetching order stats:', error);
        // Error durumunda mock data kullan
        setOrderStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          completed: 0,
          cancelled: 0,
          total_value: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
        </div>
        <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Metric with Visual Appeal */}
      <div className="text-center bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
          {orderStats.total}
        </div>
        <div className="text-sm text-muted-foreground/80 font-medium">Toplam Sipariş</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-1 h-1 bg-violet-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
          <div className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
      
      {/* Enhanced Order Status Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gradient-to-br from-yellow-50/80 to-amber-100/40 dark:from-yellow-950/30 dark:to-amber-900/20 rounded-lg p-3 border border-yellow-200/20 dark:border-yellow-800/20 hover:shadow-md hover:shadow-yellow-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
            <span className="font-medium text-yellow-700 dark:text-yellow-300">Bekliyor</span>
          </div>
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{orderStats.pending}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-100/40 dark:from-blue-950/30 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200/20 dark:border-blue-800/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="font-medium text-blue-700 dark:text-blue-300">Onaylandı</span>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{orderStats.confirmed}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50/80 to-violet-100/40 dark:from-purple-950/30 dark:to-violet-900/20 rounded-lg p-3 border border-purple-200/20 dark:border-purple-800/20 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 border-2 border-white rounded-full animate-spin"></div>
            </div>
            <span className="font-medium text-purple-700 dark:text-purple-300">İşleniyor</span>
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{orderStats.processing}</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50/80 to-blue-100/40 dark:from-indigo-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-indigo-200/20 dark:border-indigo-800/20 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-3 h-2 bg-white rounded-sm"></div>
            </div>
            <span className="font-medium text-indigo-700 dark:text-indigo-300">Kargo</span>
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{orderStats.shipped}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50/80 to-emerald-100/40 dark:from-green-950/30 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200/20 dark:border-green-800/20 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="font-medium text-green-700 dark:text-green-300">Teslim</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{orderStats.delivered}</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50/80 to-green-100/40 dark:from-emerald-950/30 dark:to-green-900/20 rounded-lg p-3 border border-emerald-200/20 dark:border-emerald-800/20 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-1.5 h-3 bg-white rounded-full"></div>
            </div>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">Tamamlandı</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{orderStats.completed}</div>
        </div>
      </div>
      
      {/* Enhanced Total Value Display */}
      <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 rounded-lg p-4 border border-violet-200/20 dark:border-violet-800/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">₺</span>
            </div>
            <div>
              <div className="text-sm font-medium text-violet-700 dark:text-violet-300">Toplam Değer</div>
              <div className="text-xs text-violet-600/60 dark:text-violet-400/60">Bu aydaki siparişler</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(orderStats.total_value)}
            </div>
            <div className="text-xs text-muted-foreground">
              Ort: {orderStats.total > 0 ? new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(orderStats.total_value / orderStats.total) : '₺0'}
            </div>
          </div>
        </div>
        
        {/* Value Progress Indicator */}
        <div className="mt-3 w-full bg-violet-200/40 dark:bg-violet-900/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full shadow-sm transition-all duration-1000"
            style={{ width: `${Math.min((orderStats.total_value / 100000) * 100, 100)}%` }}
          >
            <div className="h-full bg-gradient-to-r from-white/30 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersSummary;