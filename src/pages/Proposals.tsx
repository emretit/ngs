
import { useState, memo } from "react";
import { FileText } from "lucide-react";
import ProposalTable from "@/components/proposals/ProposalTable";
import { ProposalKanban } from "@/components/proposals/ProposalKanban";
import ProposalDetailSheet from "@/components/proposals/ProposalDetailSheet";
import { Proposal } from "@/types/proposal";
import { useProposals, useProposalsInfiniteScroll } from "@/hooks/useProposals";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ProposalsHeader from "@/components/proposals/ProposalsHeader";
import ProposalsFilterBar from "@/components/proposals/ProposalsFilterBar";
import ProposalsContent from "@/components/proposals/ProposalsContent";
import ProposalsBulkActions from "@/components/proposals/ProposalsBulkActions";

const Proposals = memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<Proposal[]>([]);
  // Son 1 aylık tarih filtresi - masraflardaki gibi
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return oneMonthAgo;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  
  // Sıralama state'leri - veritabanı seviyesinde sıralama için
  const [sortField, setSortField] = useState<string>("offer_date");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // For list view, use normal query - son 1 aylık filtre olduğu için infinite scroll gerek yok
  const {
    data: proposals = [],
    isLoading,
    totalCount,
    error,
  } = useProposalsInfiniteScroll({
    status: selectedStatus,
    search: searchQuery,
    employeeId: selectedEmployee,
    dateRange: { 
      from: startDate ? startDate.toISOString() : null, 
      to: endDate ? endDate.toISOString() : null 
    },
    sortField,
    sortDirection
  });

  // Durum değişikliği sonrası sayfayı yenile
  const handleProposalStatusChange = () => {
    // Query otomatik olarak yenilenecek
  };

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
    <>
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
        ) : activeView === "kanban" ? (
          <ProposalKanban
            proposals={kanbanProposals} 
            onProposalSelect={handleProposalClick}
            onStatusChange={handleProposalStatusChange}
          />
        ) : (
          <ProposalsContent
            proposals={(proposals as Proposal[]) || []}
            isLoading={isLoading}
            totalCount={totalCount}
            error={error}
            onProposalSelect={handleProposalClick}
            onStatusChange={handleProposalStatusChange}
            searchQuery={searchQuery}
            statusFilter={selectedStatus}
            employeeFilter={selectedEmployee}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
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
    </>
  );
});

Proposals.displayName = 'Proposals';

export default Proposals;
