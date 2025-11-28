import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  GitBranch, 
  GitCommit, 
  ExternalLink, 
  Clock, 
  FileText,
  ChevronRight,
  History
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToLocalString } from "@/utils/dateUtils";
import { proposalStatusLabels, proposalStatusColors, ProposalStatus } from "@/types/proposal";

interface RevisionInfoCardProps {
  proposalId: string;
  parentProposalId?: string | null;
  revisionNumber?: number | null;
  currentProposalNumber?: string;
}

const RevisionInfoCard: React.FC<RevisionInfoCardProps> = ({
  proposalId,
  parentProposalId,
  revisionNumber,
  currentProposalNumber
}) => {
  const navigate = useNavigate();

  // Orijinal teklifi çek (eğer bu bir revizyon ise)
  const { data: parentProposal, isLoading: loadingParent } = useQuery({
    queryKey: ['proposal-parent', parentProposalId],
    queryFn: async () => {
      if (!parentProposalId) return null;
      const { data, error } = await supabase
        .from('proposals')
        .select('id, number, title, status, created_at')
        .eq('id', parentProposalId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parentProposalId
  });

  // Bu teklifin tüm revizyonlarını çek (orijinal veya kendi üzerinden)
  const originalId = parentProposalId || proposalId;
  const { data: revisions, isLoading: loadingRevisions } = useQuery({
    queryKey: ['proposal-revisions', originalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, number, title, status, revision_number, created_at')
        .eq('parent_proposal_id', originalId)
        .order('revision_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!originalId
  });

  // Revizyon durumlarını belirle
  const hasRevisions = revisions && revisions.length > 0;
  const isRevision = !!parentProposalId && !!revisionNumber;
  
  // Kart her zaman görünsün - R0 bile olsa

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-orange-50/30 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/10 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200/50 dark:from-orange-900/30 dark:to-orange-800/20 dark:border-orange-700/30">
            <GitBranch className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          Revizyon Bilgileri
          <Badge 
            variant="outline" 
            className={`ml-2 text-xs ${
              isRevision 
                ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
                : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
            }`}
          >
            R{revisionNumber || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Orijinal Teklif Bilgisi (eğer bu bir revizyon ise) */}
        {isRevision && parentProposal && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">Orijinal Teklif</span>
            </div>
            <div 
              onClick={() => navigate(`/proposal/${parentProposal.id}`)}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/30">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">{parentProposal.number}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {parentProposal.title}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${proposalStatusColors[parentProposal.status as ProposalStatus]}`}
                >
                  {proposalStatusLabels[parentProposal.status as ProposalStatus] || parentProposal.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* Revizyon Listesi */}
        {hasRevisions && (
          <>
            {isRevision && <Separator className="my-3" />}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {isRevision ? 'Diğer Revizyonlar' : 'Revizyonlar'} ({revisions.length})
                </span>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {revisions.map((rev) => (
                  <div 
                    key={rev.id}
                    onClick={() => rev.id !== proposalId && navigate(`/proposal/${rev.id}`)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      rev.id === proposalId 
                        ? 'border-orange-300 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${
                        rev.id === proposalId 
                          ? 'bg-orange-100 dark:bg-orange-900/40' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <GitCommit className={`h-3.5 w-3.5 ${
                          rev.id === proposalId 
                            ? 'text-orange-600 dark:text-orange-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{rev.number}</span>
                          {rev.id === proposalId && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300">
                              Şu anki
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateToLocalString(new Date(rev.created_at))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${proposalStatusColors[rev.status as ProposalStatus]}`}
                      >
                        {proposalStatusLabels[rev.status as ProposalStatus] || rev.status}
                      </Badge>
                      {rev.id !== proposalId && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Özet Bilgi */}
        {!isRevision && hasRevisions && (
          <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Not:</span> Bu teklifin {revisions.length} adet revizyonu bulunmaktadır.
          </div>
        )}

        {/* R0 - Orijinal teklif ve revizyon yoksa bilgi mesajı */}
        {!isRevision && !hasRevisions && (
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Orijinal Teklif (R0)</span>
            </div>
            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
              Bu teklifin henüz revizyonu bulunmamaktadır. Menüden "Revizyon Oluştur" ile yeni bir revizyon oluşturabilirsiniz.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevisionInfoCard;

