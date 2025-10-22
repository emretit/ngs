
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
  
  // Veri yoksa da kartları göster
  
  const acceptedCount = proposalStats.find(s => s.status === 'accepted')?.count || 0;
  const sentCount = proposalStats.find(s => s.status === 'sent')?.count || 0;
  const reviewCount = proposalStats.find(s => s.status === 'review')?.count || 0;
  const draftCount = proposalStats.find(s => s.status === 'draft')?.count || 0;

  return (
    <div className="space-y-4">
      {/* Main Metric - Sade */}
      <div className="text-center bg-gray-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">
          {totalProposals}
        </div>
        <div className="text-sm text-gray-600 font-medium">Toplam Teklif</div>
      </div>
      
      {/* Proposal Status Grid - Gerçek Durumlar */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Taslak</span>
          </div>
          <div className="text-lg font-bold text-gray-600">{draftCount}</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-700">Onay Bekliyor</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">{proposalStats.find(s => s.status === 'pending_approval')?.count || 0}</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700">Gönderildi</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{sentCount}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Kabul Edildi</span>
          </div>
          <div className="text-lg font-bold text-green-600">{acceptedCount}</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700">Reddedildi</span>
          </div>
          <div className="text-lg font-bold text-red-600">{proposalStats.find(s => s.status === 'rejected')?.count || 0}</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="font-medium text-orange-700">Süresi Dolmuş</span>
          </div>
          <div className="text-lg font-bold text-orange-600">{proposalStats.find(s => s.status === 'expired')?.count || 0}</div>
        </div>
      </div>
      
      {/* Conversion Rate - Sade */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">%</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Kabul Oranı</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {totalProposals > 0 ? Math.round((acceptedCount / totalProposals) * 100) : 0}%
          </span>
        </div>
        
        {/* Conversion Progress Bar */}
        <div className="relative w-full bg-gray-200 rounded-full h-2">
          <div 
            className="absolute top-0 left-0 h-2 rounded-full bg-green-500 transition-all duration-1000 ease-out"
            style={{ width: `${totalProposals > 0 ? (acceptedCount / totalProposals) * 100 : 0}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          <span>Hedef: 75%</span>
        </div>
      </div>
    </div>
  );
};

export default ProposalsSummary;
