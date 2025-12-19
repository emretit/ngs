import { useState, useMemo } from "react";
import { Plus, FileText, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer } from "@/types/customer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Proposal, ProposalStatus } from "@/types/proposal";
import ProposalTable from "@/components/proposals/ProposalTable";
import { DatePicker } from "@/components/ui/date-picker";

interface ProposalsTabProps {
  customer: Customer;
}

export const ProposalsTab = ({ customer }: ProposalsTabProps) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // Fetch proposals list
  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ['customer-proposals', customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .eq('customer_id', customer.id)
        .order('offer_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      // Map the database fields to match our Proposal type
      return data.map((item: any): Proposal => ({
        id: item.id,
        number: item.number,
        title: item.title,
        description: item.description,
        customer_id: item.customer_id,
        opportunity_id: item.opportunity_id,
        employee_id: item.employee_id,
        status: item.status,
        total_amount: item.total_amount || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        offer_date: item.offer_date,
        valid_until: item.valid_until,
        items: Array.isArray(item.items) ? item.items : [],
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        currency: item.currency || "TRY",
        terms: item.terms,
        notes: item.notes,
        total_value: item.total_amount || 0,
        proposal_number: item.number,
        payment_terms: item.payment_terms || "",
        delivery_terms: item.delivery_terms || "",
        internal_notes: item.internal_notes || "",
        discounts: item.discounts || 0,
        additional_charges: item.additional_charges || 0,
        customer: item.customer,
        employee: item.employee,
        customer_name: item.customer?.name,
        employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : undefined
      }));
    },
  });

  // Filtrelenmiş teklifler
  const filteredProposals = useMemo(() => {
    if (!proposals) return [];
    
    return proposals.filter(proposal => {
      // Durum filtresi
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      
      // Tarih filtresi
      let matchesDate = true;
      if (startDate || endDate) {
        const proposalDate = proposal.offer_date || proposal.created_at;
        if (proposalDate) {
          const date = new Date(proposalDate);
          if (startDate && date < startDate) matchesDate = false;
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            if (date > endDateTime) matchesDate = false;
          }
        } else {
          matchesDate = false;
        }
      }
      
      return matchesStatus && matchesDate;
    });
  }, [proposals, statusFilter, startDate, endDate]);

  // İstatistikleri hesapla
  const proposalStats = useMemo(() => {
    const allProposals = proposals || [];
    return {
      total: allProposals.length,
      accepted: allProposals.filter(p => p.status === 'accepted').length,
      pending: allProposals.filter(p => p.status === 'pending_approval' || p.status === 'sent').length,
      rejected: allProposals.filter(p => p.status === 'rejected').length,
      expired: allProposals.filter(p => p.status === 'expired').length,
      draft: allProposals.filter(p => p.status === 'draft').length,
      totalAmount: allProposals.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0),
      acceptedAmount: allProposals
        .filter(p => p.status === 'accepted')
        .reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0),
    };
  }, [proposals]);

  const handleNewProposal = () => {
    navigate(`/proposals/new?customer_id=${customer.id}`);
  };

  const handleProposalClick = (proposal: Proposal) => {
    navigate(`/proposals/${proposal.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Teklif Geçmişi</h3>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Kabul Edilen</span>
              <span className="text-sm font-semibold text-green-600">
                {proposalStats.accepted}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Bekleyenler</span>
              <span className="text-sm font-semibold text-yellow-600">
                {proposalStats.pending}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Toplam</span>
              <span className="text-sm font-semibold text-gray-900">
                {proposalStats.total}
              </span>
            </div>
            {proposalStats.rejected > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Reddedilen</span>
                  <span className="text-sm font-semibold text-red-600">
                    {proposalStats.rejected}
                  </span>
                </div>
              </>
            )}
            {proposalStats.expired > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Süresi Dolmuş</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {proposalStats.expired}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProposalStatus | 'all')}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="pending_approval">Onay Bekliyor</SelectItem>
              <SelectItem value="sent">Gönderildi</SelectItem>
              <SelectItem value="accepted">Kabul Edildi</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
              <SelectItem value="expired">Süresi Dolmuş</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="Başlangıç"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Bitiş"
            />
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={handleNewProposal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Teklif Ekle
          </Button>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              {isLoadingProposals ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </div>
                </div>
              ) : (
                <ProposalTable 
                  proposals={filteredProposals || []}
                  isLoading={isLoadingProposals}
                  onProposalSelect={handleProposalClick}
                  statusFilter={statusFilter !== 'all' ? statusFilter : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};