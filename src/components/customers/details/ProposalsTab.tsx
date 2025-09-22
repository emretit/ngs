import { useState } from "react";
import { Plus, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types/customer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { proposalStatusLabels, proposalStatusColors } from "@/types/proposal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
          employee:employee_id (first_name, last_name)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleNewProposal = () => {
    navigate(`/proposals/new?customer_id=${customer.id}`);
  };

  const handleProposalClick = (proposalId: string) => {
    navigate(`/proposals/${proposalId}`);
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
          {isLoadingProposals ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
                    <div className="w-24 h-3 bg-gray-200 animate-pulse rounded" />
                  </div>
                  <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : proposals && proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div 
                  key={proposal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleProposalClick(proposal.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{proposal.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={proposalStatusColors[proposal.status as keyof typeof proposalStatusColors]}
                      >
                        {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>#{proposal.number}</span>
                      <span className="mx-2">•</span>
                      <span>{format(new Date(proposal.created_at), 'dd MMMM yyyy', { locale: tr })}</span>
                      {proposal.employee && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{proposal.employee.first_name} {proposal.employee.last_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {proposal.total_amount?.toLocaleString('tr-TR', { 
                        style: 'currency', 
                        currency: 'TRY' 
                      }) || '₺0,00'}
                    </div>
                    {proposal.valid_until && (
                      <div className="text-xs text-muted-foreground">
                        Son: {format(new Date(proposal.valid_until), 'dd.MM.yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Henüz teklif yok</h3>
              <p className="text-gray-600 mb-4">Bu müşteri için henüz hiç teklif hazırlanmamış.</p>
              <Button onClick={handleNewProposal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                İlk Teklifi Oluştur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};