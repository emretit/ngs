
import { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Input } from "@/components/ui/input";
import { PrimaryButton, SecondaryButton } from "@/components/shared";
import { Plus, Search, Filter, User, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalTable from "@/components/proposals/ProposalTable";
import { ProposalKanban } from "@/components/proposals/ProposalKanban";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProposalDetailSheet from "@/components/proposals/ProposalDetailSheet";
import { Proposal } from "@/types/proposal";
import { useProposals, useProposalsInfiniteScroll } from "@/hooks/useProposals";
import { toast } from "sonner";
import ProposalsViewToggle from "@/components/proposals/header/ProposalsViewToggle";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface ProposalsPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Proposals = ({ isCollapsed, setIsCollapsed }: ProposalsPageProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
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

  const handleProposalSelect = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  const handleCloseDetail = () => {
    setSelectedProposal(null);
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Teklifler"
      subtitle="Müşterilerinize gönderdiğiniz teklifleri yönetin"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 p-6 bg-gradient-to-r from-card to-muted/50 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Teklifler
            </h1>
            <p className="text-sm text-muted-foreground/80">
              Müşterilerinize gönderdiğiniz teklifleri yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <ProposalsViewToggle 
              activeView={activeView} 
              setActiveView={setActiveView} 
            />
            <PrimaryButton 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300"
              onClick={() => navigate("/proposal/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Teklif
            </PrimaryButton>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-r from-card/80 to-muted/40 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
          <div className="relative w-[400px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Teklif no, müşteri adı veya başlık ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="draft">📄 Taslak</SelectItem>
              <SelectItem value="pending_approval">⏳ Onay Bekliyor</SelectItem>
              <SelectItem value="sent">📤 Gönderildi</SelectItem>
              <SelectItem value="accepted">✅ Kabul Edildi</SelectItem>
              <SelectItem value="rejected">❌ Reddedildi</SelectItem>
              <SelectItem value="expired">⚠️ Süresi Dolmuş</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]">
              <User className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Satış Temsilcisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Temsilciler</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {activeView === "list" ? (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={refresh}
            isEmpty={(proposals?.length || 0) === 0 && !isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Teklif bulunamadı
                </h3>
                <p className="text-muted-foreground text-center">
                  Arama kriterlerinize uygun teklif bulunamadı.
                </p>
              </div>
            }
            className="rounded-lg border bg-card"
          >
            <ProposalTable
              proposals={proposals as any[] || []}
              isLoading={isLoading}
              onProposalSelect={handleProposalSelect}
            />
          </InfiniteScroll>
        ) : (
          <>
            {kanbanLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Teklifler yükleniyor...</p>
                </div>
              </div>
            ) : (
              <ProposalKanban
                proposals={kanbanProposals} 
                onProposalSelect={handleProposalSelect}
              />
            )}
          </>
        )}

        {/* Info Banner for List View */}
        {activeView === "list" && totalCount && totalCount > 0 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Toplam <span className="font-medium text-foreground">{totalCount}</span> teklif,
            <span className="font-medium text-foreground"> {proposals?.length || 0}</span> adet yüklendi
          </div>
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
