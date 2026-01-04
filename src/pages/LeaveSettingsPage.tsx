import React, { useMemo, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import LeaveSettingsPageHeader from "@/components/leaves/LeaveSettingsPageHeader";
import { LeavePoliciesCard } from "@/components/leaves/LeavePoliciesCard";
import { LeaveTypesCard } from "@/components/leaves/LeaveTypesCard";
import { Loader2 } from "lucide-react";

export default function LeaveSettingsPage() {
  const { userData } = useCurrentUser();
  const [handleSave, setHandleSave] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use refs to prevent unnecessary re-renders
  const lastSavingRef = useRef(isSaving);
  const saveHandlerRef = useRef<(() => void) | null>(null);
  
  // Create stable callback outside of JSX
  const handleSaveReady = useCallback((saveHandler: () => void, saving: boolean) => {
    // Only update state if values actually changed to prevent re-render loops
    if (saveHandlerRef.current !== saveHandler) {
      saveHandlerRef.current = saveHandler;
      setHandleSave(() => saveHandler);
    }
    if (lastSavingRef.current !== saving) {
      lastSavingRef.current = saving;
      setIsSaving(saving);
    }
  }, []);

  // Fetch leave types for statistics
  const { data: leaveTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["leave-types", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data: types, error: typesError } = await supabase
        .from("leave_types")
        .select("*")
        .eq("tenant_id", userData.company_id)
        .order("created_at", { ascending: false });

      if (typesError) throw typesError;
      return types || [];
    },
    enabled: !!userData?.company_id,
  });

  // Fetch leave settings to check if active
  const { data: leaveSettings } = useQuery({
    queryKey: ["leave-settings", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;
      
      const { data, error } = await supabase
        .from("leave_settings")
        .select("*")
        .eq("tenant_id", userData.company_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
  });

  // Fetch rules count
  const { data: rulesCount = 0 } = useQuery({
    queryKey: ["leave-type-rules-count", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;

      const { count, error } = await supabase
        .from("leave_type_rules")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userData.company_id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userData?.company_id,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLeaveTypes = leaveTypes.length;
    const activeLeaveTypes = leaveTypes.filter((type: any) => type.is_active).length;
    const totalRules = rulesCount;
    const hasActiveSettings = !!leaveSettings;

    return {
      totalLeaveTypes,
      activeLeaveTypes,
      totalRules,
      hasActiveSettings,
    };
  }, [leaveTypes, rulesCount, leaveSettings]);

  if (isLoadingTypes) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <LeaveSettingsPageHeader
        totalLeaveTypes={stats.totalLeaveTypes}
        activeLeaveTypes={stats.activeLeaveTypes}
        totalRules={stats.totalRules}
        hasActiveSettings={stats.hasActiveSettings}
        onSave={handleSave || undefined}
        isSaving={isSaving}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sol Kart: İzin Politikaları */}
        <LeavePoliciesCard onSaveReady={handleSaveReady} />
        
        {/* Sağ Kart: İzin Türleri */}
        <LeaveTypesCard />
      </div>
    </div>
  );
}

