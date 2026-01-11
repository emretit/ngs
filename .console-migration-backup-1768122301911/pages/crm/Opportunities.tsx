import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { DropResult } from "@hello-pangea/dnd";
import { Opportunity, OpportunityStatus } from "@/types/crm";
import { useOpportunities } from "@/hooks/useOpportunities";
import { toast } from "sonner";
import OpportunityKanbanBoard from "@/components/opportunities/OpportunityKanbanBoard";
import OpportunitiesHeader from "@/components/opportunities/OpportunitiesHeader";
import OpportunityFilterBar from "@/components/opportunities/OpportunityFilterBar";
import { OpportunityDetailSheet } from "@/components/crm/OpportunityDetailSheet";
import OpportunityBulkActions from "@/components/opportunities/OpportunityBulkActions";
import OpportunitiesContent from "@/components/opportunities/OpportunitiesContent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
const Opportunities = memo(() => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOpportunities, setSelectedOpportunities] = useState<Opportunity[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [activeView, setActiveView] = useState<"kanban" | "list">("list");
  // Son 1 aylık tarih filtresi - masraflardaki gibi
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return oneMonthAgo;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  
  // Sıralama state'leri - veritabanı seviyesinde sıralama için
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
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
    opportunitiesData, // Tüm fırsatlar
    isLoading,
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
    endDate: endDate,
    sortField,
    sortDirection
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
      // Önce fırsatın başka kayıtlarda kullanılıp kullanılmadığını kontrol et
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id')
        .eq('opportunity_id', opportunityToDelete.id)
        .limit(1);

      if (proposals && proposals.length > 0) {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu fırsat tekliflerde kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityToDelete.id);

      if (error) {
        console.error('Delete error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: (error as any)?.status
        });
        
        const httpStatus = (error as any)?.status;
        const isConflictError = 
          httpStatus === 409 || 
          error.code === '23503' || 
          error.code === 'PGRST204' ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint') ||
          error.message?.includes('still referenced') ||
          error.message?.includes('permission denied') ||
          error.message?.includes('new row violates row-level security');

        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        if (isConflictError) {
          toast.error('Bu fırsat başka kayıtlarda kullanıldığı için silinemez (teklif, aktivite vb.)', { duration: 2000 });
        } else {
          toast.error(`Silme hatası: ${error.message || 'Bilinmeyen hata'}`, { duration: 2000 });
        }
        return;
      }

      // Toast mesajını göster
      toast.success("Fırsat başarıyla silindi", { duration: 2000 });
      
      // Query'leri invalidate et
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      
      // Seçili fırsatı temizle
      if (selectedOpportunity?.id === opportunityToDelete.id) {
        setSelectedOpportunity(null);
        setIsDetailOpen(false);
      }
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast.error(`Fırsat silinirken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`, { duration: 2000 });
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
    navigate(`/proposals/new?opportunityId=${opportunity.id}`);
  };
  const handlePlanMeeting = (opportunity: Opportunity) => {
    // Yeni aktivite ekranına geçiş
    // TODO: Navigate to new activity page with opportunity data
    // window.location.href = `/activities/new?opportunity_id=${opportunity.id}&type=meeting`;
  };
  // Convert grouped opportunities to flat array for list view
  const flattenedOpportunities = Object.values(groupedOpportunities).flat();
  // Tüm fırsatları kullan
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
        ) : activeView === "kanban" ? (
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
        ) : (
          <OpportunitiesContent
            opportunities={(opportunitiesData as Opportunity[]) || []}
            isLoading={isLoading}
            totalCount={totalCount}
            error={error}
            onSelectOpportunity={handleOpportunityClick}
            onEditOpportunity={handleEditOpportunity}
            onDeleteOpportunity={handleDeleteOpportunityClick}
            onConvertToProposal={handleConvertToProposal}
            onStatusChange={handleUpdateOpportunityStatus}
            searchQuery={filterKeyword}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
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
});

Opportunities.displayName = 'Opportunities';

export default Opportunities;
