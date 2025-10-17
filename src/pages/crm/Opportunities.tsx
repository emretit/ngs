import { useState } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { Opportunity, OpportunityStatus } from "@/types/crm";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useToast } from "@/components/ui/use-toast";
import OpportunityKanbanBoard from "@/components/opportunities/OpportunityKanbanBoard";
import OpportunitiesHeader from "@/components/opportunities/OpportunitiesHeader";
import OpportunityFilterBar from "@/components/opportunities/OpportunityFilterBar";
import { OpportunityDetailSheet } from "@/components/crm/OpportunityDetailSheet";
import OpportunityBulkActions from "@/components/opportunities/OpportunityBulkActions";
import OpportunitiesContent from "@/components/opportunities/OpportunitiesContent";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
const Opportunities = () => {
  const { toast } = useToast();
  const [selectedOpportunities, setSelectedOpportunities] = useState<Opportunity[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [activeView, setActiveView] = useState<"kanban" | "list">("list");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  // Use opportunities with filters
  const { 
    opportunities,
    opportunitiesData, // Tüm fırsatlar (infinite scroll için)
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    refresh,
    totalCount,
    error,
    handleDragEnd,
    handleUpdateOpportunity,
    handleUpdateOpportunityStatus,
    selectedOpportunity,
    setSelectedOpportunity,
    isDetailOpen,
    setIsDetailOpen
  } = useOpportunities({
    search: filterKeyword,
    status: statusFilter,
    priority: priorityFilter,
    employeeId: selectedEmployee === 'all' ? null : selectedEmployee,
    startDate: startDate,
    endDate: endDate
  });
  // Group opportunities by status (6-stage system) - sorted by creation date only
  const sortByCreatedAt = (a: any, b: any) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    // If dates are the same, sort by ID to maintain consistent order
    if (dateA === dateB) {
      return a.id.localeCompare(b.id);
    }
    return dateB - dateA; // Newest first
  };
  const groupedOpportunities = {
    new: (opportunities.new || []).sort(sortByCreatedAt),
    meeting_visit: (opportunities.meeting_visit || []).sort(sortByCreatedAt),
    proposal: (opportunities.proposal || []).sort(sortByCreatedAt),
    negotiation: (opportunities.negotiation || []).sort(sortByCreatedAt),
    won: (opportunities.won || []).sort(sortByCreatedAt),
    lost: (opportunities.lost || []).sort(sortByCreatedAt),
  };
  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsDetailOpen(true);
  };
  const handleOpportunitySelect = (opportunity: Opportunity) => {
    setSelectedOpportunities(prev => {
      const isSelected = prev.some(o => o.id === opportunity.id);
      return isSelected 
        ? prev.filter(o => o.id !== opportunity.id) 
        : [...prev, opportunity];
    });
  };
  const handleClearSelection = () => {
    setSelectedOpportunities([]);
  };
  // 3 Nokta Menü Fonksiyonları
  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsDetailOpen(true);
  };
  const handleDeleteOpportunityClick = (opportunity: Opportunity) => {
    setOpportunityToDelete(opportunity);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOpportunityConfirm = async () => {
    if (!opportunityToDelete) return;

    setIsDeleting(true);
    try {
      // Burada silme işlemi yapılacak
      console.log('Deleting opportunity:', opportunityToDelete.id);
      // TODO: Implement delete functionality
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const handleDeleteOpportunityCancel = () => {
    setIsDeleteDialogOpen(false);
    setOpportunityToDelete(null);
  };
  const handleConvertToProposal = (opportunity: Opportunity) => {
    // Teklif sayfasına yönlendir
    console.log('Converting to proposal:', opportunity.id);
    // TODO: Navigate to new proposal page with opportunity data
  };
  const handlePlanMeeting = (opportunity: Opportunity) => {
    // Yeni aktivite ekranına geçiş
    console.log('Planning meeting for opportunity:', opportunity.id);
    // TODO: Navigate to new activity page with opportunity data
    // window.location.href = `/activities/new?opportunity_id=${opportunity.id}&type=meeting`;
  };
  // Convert grouped opportunities to flat array for list view
  const flattenedOpportunities = Object.values(groupedOpportunities).flat();
  // Infinite scroll için tüm fırsatları kullan
  const allOpportunities = opportunitiesData || [];
  return (
    <>
      <div className="space-y-2">
        <OpportunitiesHeader 
          activeView={activeView} 
          setActiveView={setActiveView}
          opportunities={opportunities}
        />
        <OpportunityFilterBar 
          filterKeyword={filterKeyword}
          setFilterKeyword={setFilterKeyword}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          employees={employees}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        {selectedOpportunities.length > 0 && (
          <OpportunityBulkActions 
            selectedOpportunities={selectedOpportunities}
            onClearSelection={handleClearSelection}
          />
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Fırsatlar yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Fırsatlar yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <Tabs value={activeView} className="w-full">
            <TabsContent value="kanban" className="mt-0">
              <OpportunityKanbanBoard
                opportunities={groupedOpportunities}
                onDragEnd={handleDragEnd}
                onOpportunityClick={handleOpportunityClick}
                onOpportunitySelect={handleOpportunitySelect}
                selectedOpportunities={selectedOpportunities}
                onUpdateOpportunityStatus={handleUpdateOpportunityStatus}
                onEdit={handleEditOpportunity}
                onDelete={handleDeleteOpportunityClick}
                onConvertToProposal={handleConvertToProposal}
                onPlanMeeting={handlePlanMeeting}
              />
            </TabsContent>
            <TabsContent value="list" className="mt-0">
              <OpportunitiesContent
                opportunities={(opportunitiesData as Opportunity[]) || []}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasNextPage={hasNextPage}
                loadMore={loadMore}
                totalCount={totalCount}
                error={error}
                onSelectOpportunity={handleOpportunityClick}
                searchQuery={filterKeyword}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
      {selectedOpportunity && (
        <OpportunityDetailSheet
          opportunity={selectedOpportunity}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setTimeout(() => setSelectedOpportunity(null), 300);
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Fırsatı Sil"
        description={`"${opportunityToDelete?.title || 'Bu fırsat'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteOpportunityConfirm}
        onCancel={handleDeleteOpportunityCancel}
        isLoading={isDeleting}
      />
    </>
  );
};
export default Opportunities;
