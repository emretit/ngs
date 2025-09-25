
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProposalCount {
  status: string;
  count: number;
  label: string;
  color: string;
}

interface ProposalStatusCount {
  status: string;
  count: number;
}

const statusLabels: Record<string, string> = {
  draft: "Taslak",
  new: "Yeni",
  sent: "Gönderildi",
  review: "İncelemede",
  negotiation: "Görüşme",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu"
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  new: "bg-blue-500",
  sent: "bg-amber-500",
  review: "bg-purple-500",
  negotiation: "bg-indigo-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-stone-500"
};

const ProposalsSummary = () => {
  const [proposalStats, setProposalStats] = useState<ProposalCount[]>([]);
  const [totalProposals, setTotalProposals] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProposalStats = async () => {
      try {
        setLoading(true);
        
        // Get total proposals count
        const { count: totalCount, error: totalError } = await supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true });
          
        if (totalError) throw totalError;
        
        // Get proposals by status using the database function
        const { data, error } = await supabase
          .rpc('get_proposal_counts_by_status') as { data: ProposalStatusCount[] | null, error: Error | null };
          
        if (error) {
          // Fallback if the RPC function doesn't work
          const { data: rawData, error: queryError } = await supabase
            .from('proposals')
            .select('status');
            
          if (queryError) throw queryError;
          
          // Process the data manually
          const statusCounts: Record<string, number> = {};
          rawData.forEach(proposal => {
            statusCounts[proposal.status] = (statusCounts[proposal.status] || 0) + 1;
          });
          
          const formattedData: ProposalCount[] = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            label: statusLabels[status] || status,
            color: statusColors[status] || "bg-gray-500"
          }));
          
          setProposalStats(formattedData);
        } else {
          // If RPC function worked
          const formattedData: ProposalCount[] = (data as ProposalStatusCount[]).map((item: ProposalStatusCount) => ({
            status: item.status,
            count: Number(item.count),
            label: statusLabels[item.status] || item.status,
            color: statusColors[item.status] || "bg-gray-500"
          }));
          
          setProposalStats(formattedData);
        }
        
        setTotalProposals(totalCount || 0);
      } catch (error) {
        console.error('Error fetching proposal stats:', error);
        toast.error('Teklif bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposalStats();
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
  
  if (totalProposals === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Henüz teklif yok</p>
      </div>
    );
  }
  
  const acceptedCount = proposalStats.find(s => s.status === 'accepted')?.count || 0;
  const sentCount = proposalStats.find(s => s.status === 'sent')?.count || 0;
  const reviewCount = proposalStats.find(s => s.status === 'review')?.count || 0;
  const draftCount = proposalStats.find(s => s.status === 'draft')?.count || 0;

  return (
    <div className="space-y-4">
      {/* Main Metric with Visual Appeal */}
      <div className="text-center bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent animate-pulse">
          {totalProposals}
        </div>
        <div className="text-sm text-muted-foreground/80 font-medium">Toplam Teklif</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gradient-to-br from-amber-50/80 to-yellow-100/40 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-lg p-3 border border-amber-200/20 dark:border-amber-800/20 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-amber-700 dark:text-amber-300">Gönderildi</span>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{sentCount}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50/80 to-emerald-100/40 dark:from-green-950/30 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200/20 dark:border-green-800/20 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </div>
            <span className="font-medium text-green-700 dark:text-green-300">Kabul Edildi</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{acceptedCount}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-100/40 dark:from-blue-950/30 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200/20 dark:border-blue-800/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg animate-pulse"></div>
            <span className="font-medium text-blue-700 dark:text-blue-300">İncelemede</span>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{reviewCount}</div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-50/80 to-gray-100/40 dark:from-slate-950/30 dark:to-gray-900/20 rounded-lg p-3 border border-slate-200/20 dark:border-slate-800/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-gradient-to-r from-slate-400 to-gray-500 rounded-full shadow-lg"></div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Taslak</span>
          </div>
          <div className="text-xl font-bold text-slate-600 dark:text-slate-400">{draftCount}</div>
        </div>
      </div>
      
      {/* Enhanced Conversion Rate */}
      <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 rounded-lg p-4 border border-green-200/20 dark:border-green-800/20">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">%</span>
            </div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Kabul Oranı</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {totalProposals > 0 ? Math.round((acceptedCount / totalProposals) * 100) : 0}%
          </span>
        </div>
        
        {/* Conversion Progress Bar */}
        <div className="relative w-full bg-green-200/40 dark:bg-green-900/20 rounded-full h-3 shadow-inner">
          <div 
            className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg transition-all duration-1000 ease-out"
            style={{ width: `${totalProposals > 0 ? (acceptedCount / totalProposals) * 100 : 0}%` }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-transparent"></div>
          </div>
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md opacity-80"></div>
        </div>
        
        <div className="flex justify-between text-xs text-green-600/60 dark:text-green-400/60 mt-2">
          <span>0%</span>
          <span>Hedef: 75%</span>
        </div>
      </div>
    </div>
  );
};

export default ProposalsSummary;
