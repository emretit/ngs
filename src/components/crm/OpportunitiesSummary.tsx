import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface OpportunityCount {
  status: string;
  count: number;
  label: string;
  color: string;
}

const statusLabels: Record<string, string> = {
  new: "Yeni",
  meeting_visit: "Görüşme ve Ziyaret",
  proposal: "Teklif",
  qualified: "Nitelikli",
  negotiation: "Müzakere",
  won: "Kazanıldı",
  lost: "Kaybedildi"
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  meeting_visit: "bg-purple-500",
  proposal: "bg-orange-500",
  qualified: "bg-yellow-500",
  negotiation: "bg-indigo-500",
  won: "bg-green-500",
  lost: "bg-red-500"
};

const OpportunitiesSummary = () => {
  const { userData } = useCurrentUser();
  
  const { data, isLoading: loading } = useQuery({
    queryKey: ['opportunity-stats', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return { stats: [], total: 0 };
      }
      
      // RLS policy otomatik olarak current_company_id() ile filtreler
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('status');
      
      if (error) throw error;
      
      const totalCount = opportunities?.length || 0;
      
      // Count opportunities by status
      const statusCounts: Record<string, number> = {};
      opportunities?.forEach(opportunity => {
        statusCounts[opportunity.status] = (statusCounts[opportunity.status] || 0) + 1;
      });
      
      const formattedData: OpportunityCount[] = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        label: statusLabels[status] || status,
        color: statusColors[status] || "bg-gray-500"
      }));
      
      return { stats: formattedData, total: totalCount };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
  
  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <div className="h-6 bg-muted animate-pulse rounded"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted/60 animate-pulse rounded"></div>
          <div className="h-4 bg-muted/60 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }
  
  const opportunityStats = data?.stats || [];
  const totalOpportunities = data?.total || 0;
  const wonCount = opportunityStats.find(s => s.status === 'won')?.count || 0;
  const totalValue = totalOpportunities * 1000;

  return (
    <div className="space-y-4">
      {/* Main Metric - Sade */}
      <div className="text-center bg-gray-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">
          {totalOpportunities}
        </div>
        <div className="text-sm text-gray-600 font-medium">Toplam Fırsat</div>
      </div>
      
      {/* Opportunity Status Grid - Gerçek Durumlar */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700">Yeni</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{opportunityStats.find(s => s.status === 'new')?.count || 0}</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="font-medium text-purple-700">Görüşme</span>
          </div>
          <div className="text-lg font-bold text-purple-600">{opportunityStats.find(s => s.status === 'meeting_visit')?.count || 0}</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="font-medium text-orange-700">Teklif</span>
          </div>
          <div className="text-lg font-bold text-orange-600">{opportunityStats.find(s => s.status === 'proposal')?.count || 0}</div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="font-medium text-indigo-700">Müzakere</span>
          </div>
          <div className="text-lg font-bold text-indigo-600">{opportunityStats.find(s => s.status === 'negotiation')?.count || 0}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Kazanılan</span>
          </div>
          <div className="text-lg font-bold text-green-600">{wonCount}</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700">Kaybedildi</span>
          </div>
          <div className="text-lg font-bold text-red-600">{opportunityStats.find(s => s.status === 'lost')?.count || 0}</div>
        </div>
      </div>
      
      {/* Value Indicator - Sade */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">₺</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Tahmini Değer</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            ₺{(totalValue/1000).toFixed(0)}K
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Ortalama Değer</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            ₺{totalOpportunities > 0 ? ((totalValue / totalOpportunities)/1000).toFixed(0) : 0}K
          </span>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesSummary;
