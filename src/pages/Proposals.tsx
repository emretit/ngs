
import { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { FileText } from "lucide-react";
import ProposalTable from "@/components/proposals/ProposalTable";
import { ProposalKanban } from "@/components/proposals/ProposalKanban";
import ProposalDetailSheet from "@/components/proposals/ProposalDetailSheet";
import { Proposal } from "@/types/proposal";
import { useProposals, useProposalsInfiniteScroll } from "@/hooks/useProposals";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import ProposalsHeader from "@/components/proposals/ProposalsHeader";
import ProposalsFilterBar from "@/components/proposals/ProposalsFilterBar";
import ProposalsContent from "@/components/proposals/ProposalsContent";
import ProposalsBulkActions from "@/components/proposals/ProposalsBulkActions";
import { Tabs, TabsContent } from "@/components/ui/tabs";

interface ProposalsPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Proposals = ({ isCollapsed, setIsCollapsed }: ProposalsPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<Proposal[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const pageSize = 20;

  // Fetch employees data
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'aktif')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  // For kanban view, use the original hook
  const { data: kanbanProposals = [], isLoading: kanbanLoading, error: kanbanError } = useProposals({
    status: selectedStatus,
    search: searchQuery,
    employeeId: selectedEmployee,
    dateRange: { from: null, to: null }
  });

  // For list view, use infinite scroll
  const {
    data: proposals,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useProposalsInfiniteScroll(
    {
      status: selectedStatus,
      search: searchQuery,
      employeeId: selectedEmployee,
      dateRange: { from: null, to: null }
    },
    pageSize
  );

  if (error || kanbanError) {
    toast.error("Teklifler yüklenirken bir hata oluştu");
    console.error("Error loading proposals:", error || kanbanError);
  }

  const handleProposalClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  const handleCloseDetail = () => {
    setSelectedProposal(null);
  };

  const handleProposalSelect = (proposal: Proposal) => {
    setSelectedProposals(prev => {
      const isSelected = prev.some(p => p.id === proposal.id);
      return isSelected 
        ? prev.filter(p => p.id !== proposal.id) 
        : [...prev, proposal];
    });
  };
  
  const handleClearSelection = () => {
    setSelectedProposals([]);
  };

  // Group proposals by status for header stats
  const groupedProposals = {
    draft: kanbanProposals.filter(p => p.status === 'draft'),
    pending_approval: kanbanProposals.filter(p => p.status === 'pending_approval'),
    sent: kanbanProposals.filter(p => p.status === 'sent'),
    accepted: kanbanProposals.filter(p => p.status === 'accepted'),
    rejected: kanbanProposals.filter(p => p.status === 'rejected'),
    expired: kanbanProposals.filter(p => p.status === 'expired'),
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Teklifler"
      subtitle="Müşterilerinize gönderdiğiniz teklifleri yönetin"
    >
      <div className="space-y-2">
        {/* Header */}
        <ProposalsHeader 
          activeView={activeView} 
          setActiveView={setActiveView}
          proposals={groupedProposals}
        />

        {/* Filters */}
        <ProposalsFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          employees={employees}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        
        {selectedProposals.length > 0 && (
          <ProposalsBulkActions 
            selectedProposals={selectedProposals}
            onClearSelection={handleClearSelection}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Teklifler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Teklifler yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <Tabs value={activeView} className="w-full">
            <TabsContent value="kanban" className="mt-0">
              <ProposalKanban
                proposals={kanbanProposals} 
                onProposalSelect={handleProposalClick}
              />
            </TabsContent>
            <TabsContent value="list" className="mt-0">
              <ProposalsContent
                proposals={(proposals as Proposal[]) || []}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasNextPage={hasNextPage}
                loadMore={loadMore}
                totalCount={totalCount}
                error={error}
                onProposalSelect={handleProposalClick}
                searchQuery={searchQuery}
                statusFilter={selectedStatus}
                employeeFilter={selectedEmployee}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Detail Sheet */}
      {selectedProposal && (
        <ProposalDetailSheet 
          proposal={selectedProposal} 
          open={!!selectedProposal} 
          onOpenChange={handleCloseDetail} 
        />
      )}
    </DefaultLayout>
  );
};

export default Proposals;
