import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { OrderStats } from "@/types/orders";

const OrdersSummary = () => {
  const { userData } = useCurrentUser();

  const { data: orderStats, isLoading: loading } = useQuery({
    queryKey: ['order-stats', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return {
          total: 0,
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          completed: 0,
          cancelled: 0,
          total_value: 0
        };
      }
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total_amount')
        .eq('company_id', userData.company_id);
        
      if (error) {
        console.error('Orders table error:', error);
        return {
          total: 0,
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          completed: 0,
          serviced: 0,
          cancelled: 0,
          total_value: 0
        };
      }
      
      const stats: OrderStats = {
        total: orders?.length || 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        completed: 0,
        serviced: 0,
        cancelled: 0,
        total_value: 0
      };
      
      orders?.forEach(order => {
        if (stats.hasOwnProperty(order.status)) {
          stats[order.status as keyof Omit<OrderStats, 'total' | 'total_value'>]++;
        }
        stats.total_value += Number(order.total_amount || 0);
      });
      
      return stats;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

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

  const stats = orderStats || {
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    total_value: 0
  };

  return (
    <div className="space-y-4">
      {/* Main Metric - Sade */}
      <div className="text-center bg-gray-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">
          {stats.total}
        </div>
        <div className="text-sm text-gray-600 font-medium">Toplam Sipariş</div>
      </div>
      
      {/* Order Status Grid - Sade */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-700">Bekliyor</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700">Onaylandı</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{stats.confirmed}</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="font-medium text-purple-700">İşleniyor</span>
          </div>
          <div className="text-lg font-bold text-purple-600">{stats.processing}</div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="font-medium text-indigo-700">Kargo</span>
          </div>
          <div className="text-lg font-bold text-indigo-600">{stats.shipped}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Teslim</span>
          </div>
          <div className="text-lg font-bold text-green-600">{stats.delivered}</div>
        </div>
        
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="font-medium text-emerald-700">Tamamlandı</span>
          </div>
          <div className="text-lg font-bold text-emerald-600">{stats.completed}</div>
        </div>
      </div>
      
      {/* Total Value Display - Sade */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">₺</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Toplam Değer</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(stats.total_value)}
            </div>
            <div className="text-xs text-gray-500">
              Ort: {stats.total > 0 ? new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(stats.total_value / stats.total) : '₺0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersSummary;
