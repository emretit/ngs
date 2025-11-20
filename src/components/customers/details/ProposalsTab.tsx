import { useState } from "react";
import { Plus, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Customer } from "@/types/customer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Proposal } from "@/types/proposal";
import ProposalTable from "@/components/proposals/ProposalTable";

interface ProposalsTabProps {
  customer: Customer;
}

export const ProposalsTab = ({ customer }: ProposalsTabProps) => {
  const navigate = useNavigate();

  // Fetch proposal statistics
  const { data: proposalStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['customer-proposal-stats', customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('status, total_amount')
        .eq('customer_id', customer.id);

      if (error) throw error;

      const stats = {
        totalProposals: data?.length || 0,
        acceptedCount: 0,
        pendingCount: 0,
        totalAmount: 0,
        acceptedAmount: 0,
      };

      data?.forEach(proposal => {
        const amount = Number(proposal.total_amount) || 0;
        stats.totalAmount += amount;

        if (proposal.status === 'accepted') {
          stats.acceptedCount++;
          stats.acceptedAmount += amount;
        } else if (proposal.status === 'sent' || proposal.status === 'pending_approval') {
          stats.pendingCount++;
        }
      });

      return stats;
    },
  });

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

  const handleNewProposal = () => {
    navigate(`/proposals/new?customer_id=${customer.id}`);
  };

  const handleProposalClick = (proposal: Proposal) => {
    navigate(`/proposals/${proposal.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Proposal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Teklif</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="w-8 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                proposalStats?.totalProposals || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam teklif sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kabul Edilen</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? (
                <div className="w-8 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                proposalStats?.acceptedCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Kabul edilen teklifler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyenler</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isLoadingStats ? (
                <div className="w-8 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                proposalStats?.pendingCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Cevap bekleyen teklifler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                proposalStats?.totalAmount?.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                }) || '₺0,00'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <div className="w-20 h-3 bg-gray-200 animate-pulse rounded" />
              ) : (
                `₺${(proposalStats?.acceptedAmount || 0).toLocaleString('tr-TR')} kabul edildi`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Teklifler</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {customer.name} için hazırlanan tüm teklifler
              </p>
            </div>
            <Button 
              onClick={handleNewProposal} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Teklif
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {proposals && proposals.length > 0 ? (
            <ProposalTable 
              proposals={proposals}
              isLoading={isLoadingProposals}
              onProposalSelect={handleProposalClick}
            />
          ) : !isLoadingProposals ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Henüz teklif yok</h3>
              <p className="text-gray-600 mb-4">Bu müşteri için henüz hiç teklif hazırlanmamış.</p>
              <Button onClick={handleNewProposal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                İlk Teklifi Oluştur
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};