import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LeaveSettingsPageHeader from "@/components/leaves/LeaveSettingsPageHeader";
import LeaveSettings from "@/components/leaves/LeaveSettings";
import { Loader2 } from "lucide-react";

export default function LeaveSettingsPage() {
  const { userData } = useCurrentUser();
  const [handleSave, setHandleSave] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  console.log("LeaveSettingsPage rendered, userData:", userData);

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
    console.log("LeaveSettingsPage: Loading types...");
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  console.log("LeaveSettingsPage: Rendering main content, stats:", stats);

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

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Ayarlar</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <LeaveSettings 
            onSaveReady={(saveHandler, saving) => {
              setHandleSave(() => saveHandler);
              setIsSaving(saving);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

