
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
    <div className="space-y-3">
      {/* Main Metric */}
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{totalOpportunities}</div>
        <div className="text-xs text-muted-foreground">Toplam</div>
      </div>
      
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {topStats.slice(0, 2).map((stat) => (
          <div key={stat.status} className="bg-muted/30 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
              <span className="truncate">{stat.label}</span>
            </div>
            <div className="font-semibold">{stat.count}</div>
          </div>
        ))}
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Kazanılan</span>
          </div>
          <div className="font-semibold">{wonCount}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 className="h-3 w-3" />
            <span>Aktif</span>
          </div>
          <div className="font-semibold">{totalOpportunities - wonCount}</div>
        </div>
      </div>
      
      {/* Value Indicator */}
      <div className="bg-muted/30 rounded p-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Tahmini Değer</span>
          <span className="font-semibold">₺{(totalValue/1000).toFixed(0)}K</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Ort: ₺{totalOpportunities > 0 ? ((totalValue / totalOpportunities)/1000).toFixed(0) : 0}K
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesSummary;
