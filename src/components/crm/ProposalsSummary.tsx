
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
    <div className="space-y-3">
      {/* Main Metric */}
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{totalProposals}</div>
        <div className="text-xs text-muted-foreground">Toplam</div>
      </div>
      
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>Gönderildi</span>
          </div>
          <div className="font-semibold">{sentCount}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Kabul</span>
          </div>
          <div className="font-semibold">{acceptedCount}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>İnceleme</span>
          </div>
          <div className="font-semibold">{reviewCount}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>Taslak</span>
          </div>
          <div className="font-semibold">{draftCount}</div>
        </div>
      </div>
      
      {/* Conversion Rate */}
      <div className="bg-muted/30 rounded p-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Kabul Oranı</span>
          <span className="font-semibold">{totalProposals > 0 ? Math.round((acceptedCount / totalProposals) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${totalProposals > 0 ? (acceptedCount / totalProposals) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProposalsSummary;
