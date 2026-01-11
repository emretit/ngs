import { useState, useEffect, useCallback } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface BudgetRevision {
  id: string;
  company_id: string;
  budget_id: string | null;
  year: number;
  month: number | null;
  category: string;
  subcategory: string | null;
  old_budget_amount: number;
  new_requested_amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requester_id: string;
  approval_level: number;
  max_approval_level: number;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
}

export interface BudgetApproval {
  id: string;
  company_id: string;
  revision_id: string;
  approver_id: string;
  approval_level: number;
  status: "pending" | "approved" | "rejected" | "skipped";
  comment: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useBudgetApproval = (year?: number) => {
  const [revisions, setRevisions] = useState<BudgetRevision[]>([]);
  const [approvals, setApprovals] = useState<BudgetApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch revisions
  const fetchRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      let query = supabase
        .from("budget_revisions")
        .select("*")
        
        .order("created_at", { ascending: false });

      if (year) {
        query = query.eq("year", year);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setRevisions(data || []);
    } catch (err: any) {
      logger.error("fetchRevisions error:", err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Revizyonlar alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [year, toast]);

  // Fetch approvals for a revision
  const fetchApprovals = useCallback(async (revisionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("budget_approvals")
        .select("*")
        .eq("revision_id", revisionId)
        .order("approval_level", { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      logger.error("fetchApprovals error:", err);
      throw err;
    }
  }, []);

  // Create revision
  const createRevision = async (revision: Partial<BudgetRevision>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      const revisionData = {
        ...revision,
        company_id: companyId,
        requester_id: user.id,
        status: "pending" as const,
        approval_level: 1,
        max_approval_level: 3,
      };

      const { data, error: insertError } = await supabase
        .from("budget_revisions")
        .insert(revisionData)
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchRevisions();

      toast({
        title: "Başarılı",
        description: "Revizyon talebi oluşturuldu.",
      });

      return data;
    } catch (err: any) {
      logger.error("createRevision error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Revizyon oluşturulurken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Approve revision
  const approveRevision = async (revisionId: string, approvalLevel: number, comment?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      // Create or update approval
      const { data: approval, error: approvalError } = await supabase
        .from("budget_approvals")
        .upsert({
          company_id: companyId,
          revision_id: revisionId,
          approver_id: profile.id,
          approval_level: approvalLevel,
          status: "approved",
          comment: comment || null,
          decided_at: new Date().toISOString(),
        }, {
          onConflict: "revision_id,approval_level",
        })
        .select()
        .single();

      if (approvalError) throw approvalError;

      // Update revision approval level
      const { data: revision, error: revisionError } = await supabase
        .from("budget_revisions")
        .select("*")
        .eq("id", revisionId)
        .single();

      if (revisionError) throw revisionError;

      const newApprovalLevel = approvalLevel + 1;
      const isFullyApproved = newApprovalLevel > revision.max_approval_level;

      const { error: updateError } = await supabase
        .from("budget_revisions")
        .update({
          approval_level: newApprovalLevel,
          status: isFullyApproved ? "approved" : "pending",
          approved_at: isFullyApproved ? new Date().toISOString() : null,
        })
        .eq("id", revisionId);

      if (updateError) throw updateError;

      await fetchRevisions();

      toast({
        title: "Başarılı",
        description: "Revizyon onaylandı.",
      });

      return approval;
    } catch (err: any) {
      logger.error("approveRevision error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Onay işlemi sırasında hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Reject revision
  const rejectRevision = async (revisionId: string, approvalLevel: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      // Create or update approval
      const { error: approvalError } = await supabase
        .from("budget_approvals")
        .upsert({
          company_id: companyId,
          revision_id: revisionId,
          approver_id: profile.id,
          approval_level: approvalLevel,
          status: "rejected",
          comment: reason,
          decided_at: new Date().toISOString(),
        }, {
          onConflict: "revision_id,approval_level",
        });

      if (approvalError) throw approvalError;

      // Update revision status
      const { error: updateError } = await supabase
        .from("budget_revisions")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejected_reason: reason,
        })
        .eq("id", revisionId);

      if (updateError) throw updateError;

      await fetchRevisions();

      toast({
        title: "Başarılı",
        description: "Revizyon reddedildi.",
      });
    } catch (err: any) {
      logger.error("rejectRevision error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Red işlemi sırasında hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  return {
    revisions,
    approvals,
    loading,
    error,
    fetchRevisions,
    fetchApprovals,
    createRevision,
    approveRevision,
    rejectRevision,
  };
};

