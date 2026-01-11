import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";

interface ShiftConfigurationSectionProps {
  companyId: string;
  isLocked: boolean;
}

const ShiftConfigurationSection: React.FC<ShiftConfigurationSectionProps> = ({
  companyId,
  isLocked,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingShift, setEditingShift] = useState<string | null>(null);

  // Fetch shifts
  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch shift assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ["shift_assignments", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_assignments")
        .select("*, shifts(*), employees(id, first_name, last_name)")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("company_id", companyId)
        .eq("status", "aktif")
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          ...shiftData,
          company_id: companyId,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Shift created", description: "Shift has been created successfully." });
    },
  });

  if (isLocked) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Shift configuration is locked for this period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure shifts, rules, and assign shifts to employees
        </p>
        <Button
          size="sm"
          onClick={() => {
            // TODO: Open shift creation dialog
            toast({
              title: "Create shift",
              description: "Shift creation form will be implemented here.",
            });
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Shift
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shifts.map((shift) => (
          <Card key={shift.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{shift.name}</h4>
                  <Badge variant="outline" className="mt-1">
                    {shift.shift_type}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingShift(editingShift === shift.id ? null : shift.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>Time: {shift.start_time} - {shift.end_time}</div>
                <div>Break: {shift.break_duration_minutes} min</div>
                <div>Late tolerance: {shift.late_tolerance_minutes} min</div>
                <div>Rounding: {shift.rounding_method}</div>
                <div>Daily OT threshold: {shift.daily_overtime_threshold_hours}h</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shifts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No shifts configured. Create a shift to get started.
        </div>
      )}
    </div>
  );
};

export default ShiftConfigurationSection;

