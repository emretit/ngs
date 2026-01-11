import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import ApprovalTimeline from "./ApprovalTimeline";

interface Revision {
  id: string;
  category: string;
  subcategory: string | null;
  month: number | null;
  old_budget_amount: number;
  new_requested_amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approval_level: number;
  max_approval_level: number;
  created_at: string;
}

interface ApprovalListProps {
  filters: BudgetFiltersState;
}

const ApprovalList = ({ filters }: ApprovalListProps) => {
  const { toast } = useToast();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);

  useEffect(() => {
    fetchRevisions();
  }, [filters.year]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from("budget_revisions")
        .select("*")
        
        .eq("year", filters.year)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRevisions(data || []);
    } catch (error: any) {
      logger.error("Error fetching revisions:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Revizyonlar alınırken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "approved":
        return "Onaylandı";
      case "rejected":
        return "Reddedildi";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "approved":
        return <CheckCircle2 className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = filters.currency === "USD" ? "$" : filters.currency === "EUR" ? "€" : "₺";
    return `${symbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="text-xs font-semibold h-8 py-2">Kategori</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Ay</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Mevcut Bütçe</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">İstenen Tutar</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Gerekçe</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Onay Durumu</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Durum</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisions.map((revision) => (
              <TableRow key={revision.id} className="h-8">
                <TableCell className="text-sm py-2">
                  {revision.category}
                  {revision.subcategory && (
                    <span className="text-xs text-muted-foreground ml-1">
                      / {revision.subcategory}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm py-2">
                  {revision.month
                    ? ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][revision.month - 1]
                    : "Tüm Yıl"}
                </TableCell>
                <TableCell className="text-right text-sm py-2">
                  {formatAmount(revision.old_budget_amount)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium py-2">
                  {formatAmount(revision.new_requested_amount)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground line-clamp-1 py-2 max-w-xs">
                  {revision.reason}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {revision.approval_level}/{revision.max_approval_level}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs px-2 py-1 border flex items-center gap-1", getStatusColor(revision.status))}
                  >
                    {getStatusIcon(revision.status)}
                    {getStatusLabel(revision.status)}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRevision(revision.id)}
                    className="h-7 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Detay
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedRevision && (
        <ApprovalTimeline
          revisionId={selectedRevision}
          onClose={() => setSelectedRevision(null)}
        />
      )}
    </div>
  );
};

export default ApprovalList;

