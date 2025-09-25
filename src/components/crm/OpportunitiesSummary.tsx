
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OpportunityCount {
  status: string;
  count: number;
  label: string;
  color: string;
}

interface OpportunityStatusCount {
  status: string;
  count: number;
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
  const [opportunityStats, setOpportunityStats] = useState<OpportunityCount[]>([]);
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchOpportunityStats = async () => {
      try {
        setLoading(true);
        
        // Get all opportunities
        const { data: opportunities, error } = await supabase
          .from('opportunities')
          .select('status');
        
        if (error) throw error;
        
        const totalCount = opportunities?.length || 0;
        
        if (opportunities) {
          // Count opportunities by status
          const statusCounts: Record<string, number> = {};
          opportunities.forEach(opportunity => {
            statusCounts[opportunity.status] = (statusCounts[opportunity.status] || 0) + 1;
          });
          
          const formattedData: OpportunityCount[] = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            label: statusLabels[status] || status,
            color: statusColors[status] || "bg-gray-500"
          }));
          
          setOpportunityStats(formattedData);
          setTotalOpportunities(totalCount);
        }
      } catch (error) {
        console.error('Error fetching opportunity stats:', error);
        toast.error('Fırsat bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpportunityStats();
  }, []);
  
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
  
  if (totalOpportunities === 0) {
    return (
      <div className="text-center py-6">
        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Henüz fırsat yok</p>
      </div>
    );
  }
  
  const topStats = opportunityStats.slice(0, 3);
  const wonCount = opportunityStats.find(s => s.status === 'won')?.count || 0;
  const totalValue = totalOpportunities * 1000;

  return (
    <div className="space-y-4">
      {/* Main Metric with Visual Appeal */}
      <div className="text-center bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent animate-pulse">
          {totalOpportunities}
        </div>
        <div className="text-sm text-muted-foreground/80 font-medium">Toplam Fırsat</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
          <div className="w-2 h-1 bg-emerald-400 rounded-full"></div>
          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Enhanced Dynamic Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {topStats.slice(0, 2).map((stat, index) => (
          <div 
            key={stat.status} 
            className="bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-950/30 dark:to-slate-900/20 rounded-lg p-3 border border-slate-200/20 dark:border-slate-800/20 hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${stat.color} shadow-lg animate-pulse`} style={{ animationDelay: `${index * 200}ms` }}></div>
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-600 dark:text-slate-400">{stat.count}</div>
          </div>
        ))}
        
        <div className="bg-gradient-to-br from-green-50/80 to-emerald-100/40 dark:from-green-950/30 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200/20 dark:border-green-800/20 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="font-medium text-green-700 dark:text-green-300">Kazanılan</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{wonCount}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-100/40 dark:from-blue-950/30 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200/20 dark:border-blue-800/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-blue-700 dark:text-blue-300">Aktif</span>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalOpportunities - wonCount}</div>
        </div>
      </div>
      
      {/* Enhanced Value Indicator with Currency Visual */}
      <div className="bg-gradient-to-r from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10 rounded-lg p-4 border border-amber-200/20 dark:border-amber-800/20">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">₺</span>
            </div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Tahmini Değer</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            ₺{(totalValue/1000).toFixed(0)}K
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">Ortalama Değer</span>
          </div>
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            ₺{totalOpportunities > 0 ? ((totalValue / totalOpportunities)/1000).toFixed(0) : 0}K
          </span>
        </div>
        
        {/* Value Progress Bar */}
        <div className="mt-3 w-full bg-amber-200/40 dark:bg-amber-900/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full shadow-sm transition-all duration-1000"
            style={{ width: `${Math.min((totalValue / 50000) * 100, 100)}%` }}
          >
            <div className="h-full bg-gradient-to-r from-white/30 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesSummary;
