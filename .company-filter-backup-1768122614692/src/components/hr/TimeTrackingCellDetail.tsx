import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  Calculator, 
  Edit, 
  Save, 
  History,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getPDKSLogsForDate, getShiftForEmployee, calculateTimesheetFromLogs } from "@/services/timeTrackingService";
import { useToast } from "@/hooks/use-toast";

interface TimeTrackingCellDetailProps {
  companyId: string;
  employeeId: string;
  date: Date;
  isLocked: boolean;
}

const TimeTrackingCellDetail: React.FC<TimeTrackingCellDetailProps> = ({
  companyId,
  employeeId,
  date,
  isLocked,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [correctionReason, setCorrectionReason] = useState("");
  const [manualInTime, setManualInTime] = useState("");
  const [manualOutTime, setManualOutTime] = useState("");

  // Fetch PDKS logs
  const { data: pdksLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["pdks_logs", companyId, employeeId, date.toISOString().split("T")[0]],
    queryFn: () => getPDKSLogsForDate(companyId, employeeId, date),
    enabled: !!companyId && !!employeeId,
  });

  // Fetch shift
  const { data: shift } = useQuery({
    queryKey: ["shift", companyId, employeeId, date.toISOString().split("T")[0]],
    queryFn: () => getShiftForEmployee(companyId, employeeId, date),
    enabled: !!companyId && !!employeeId,
  });

  // Fetch existing timesheet
  const { data: timesheet } = useQuery({
    queryKey: ["timesheet_day", companyId, employeeId, date.toISOString().split("T")[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheet_days")
        .select("*")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("work_date", date.toISOString().split("T")[0])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!employeeId,
  });

  // Calculate timesheet from logs
  const calculatedTimesheet = shift && pdksLogs.length > 0
    ? calculateTimesheetFromLogs(pdksLogs, date, shift)
    : null;

  // Fetch audit history (timesheet adjustments)
  const { data: adjustments = [] } = useQuery({
    queryKey: ["timesheet_adjustments", timesheet?.id],
    queryFn: async () => {
      if (!timesheet?.id) return [];
      const { data, error } = await supabase
        .from("timesheet_adjustments")
        .select("*")
        .eq("timesheet_day_id", timesheet.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!timesheet?.id,
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit_logs", "timesheet_days", timesheet?.id],
    queryFn: async () => {
      if (!timesheet?.id) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("company_id", companyId)
        .eq("entity_type", "timesheet_days")
        .eq("entity_id", timesheet.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!timesheet?.id,
  });

  // Save manual correction
  const saveCorrectionMutation = useMutation({
    mutationFn: async () => {
      if (!correctionReason.trim()) {
        throw new Error("Correction reason is required");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create or update timesheet day
      const workDate = date.toISOString().split("T")[0];
      let timesheetDayId = timesheet?.id;

      if (!timesheetDayId) {
        // Create new timesheet day
        const { data: newTimesheet, error: createError } = await supabase
          .from("timesheet_days")
          .insert({
            company_id: companyId,
            employee_id: employeeId,
            work_date: workDate,
            shift_id: shift?.id || null,
            first_in_time: manualInTime ? `${workDate}T${manualInTime}:00` : null,
            last_out_time: manualOutTime ? `${workDate}T${manualOutTime}:00` : null,
            status: "edited",
            approval_status: "draft",
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        timesheetDayId = newTimesheet.id;
      } else {
        // Update existing timesheet day
        const oldValues = {
          first_in_time: timesheet.first_in_time,
          last_out_time: timesheet.last_out_time,
          net_working_minutes: timesheet.net_working_minutes,
        };

        const { error: updateError } = await supabase
          .from("timesheet_days")
          .update({
            first_in_time: manualInTime ? `${workDate}T${manualInTime}:00` : timesheet.first_in_time,
            last_out_time: manualOutTime ? `${workDate}T${manualOutTime}:00` : timesheet.last_out_time,
            status: "edited",
            updated_by: user.id,
          })
          .eq("id", timesheetDayId);

        if (updateError) throw updateError;

        // Create adjustment record
        const newValues = {
          first_in_time: manualInTime ? `${workDate}T${manualInTime}:00` : timesheet.first_in_time,
          last_out_time: manualOutTime ? `${workDate}T${manualOutTime}:00` : timesheet.last_out_time,
        };

        await supabase.from("timesheet_adjustments").insert({
          company_id: companyId,
          timesheet_day_id: timesheetDayId,
          adjustment_type: "time_correction",
          old_value: oldValues,
          new_value: newValues,
          reason: correctionReason,
          created_by: user.id,
        });
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        company_id: companyId,
        user_id: user.id,
        action: "timesheet_correction",
        entity_type: "timesheet_days",
        entity_id: timesheetDayId,
        changes: {
          reason: correctionReason,
          manual_in_time: manualInTime,
          manual_out_time: manualOutTime,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet_day"] });
      queryClient.invalidateQueries({ queryKey: ["timesheet_adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      queryClient.invalidateQueries({ queryKey: ["timesheet_days"] });
      toast({
        title: "Correction saved",
        description: "Time tracking correction has been saved successfully.",
      });
      setCorrectionReason("");
      setManualInTime("");
      setManualOutTime("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Tabs defaultValue="logs" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="logs">PDKS Logs</TabsTrigger>
        <TabsTrigger value="calculated">Calculated</TabsTrigger>
        <TabsTrigger value="correction">Correction</TabsTrigger>
        <TabsTrigger value="audit">Audit</TabsTrigger>
      </TabsList>

      <TabsContent value="logs" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Raw PDKS Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-sm text-muted-foreground">Loading logs...</div>
            ) : pdksLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">No PDKS logs found for this date.</div>
            ) : (
              <div className="space-y-2">
                {pdksLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 border rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={log.direction === "in" ? "default" : "secondary"}>
                        {log.direction.toUpperCase()}
                      </Badge>
                      <span className="font-mono">
                        {format(new Date(log.log_timestamp), "HH:mm:ss")}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      {log.device_id && `Device: ${log.device_id}`}
                      {log.terminal_id && ` | Terminal: ${log.terminal_id}`}
                      {log.auth_type && ` | ${log.auth_type}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="calculated" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculated Values
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculatedTimesheet ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">First In</Label>
                    <div className="font-medium">
                      {calculatedTimesheet.first_in_time
                        ? format(calculatedTimesheet.first_in_time, "HH:mm")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Out</Label>
                    <div className="font-medium">
                      {calculatedTimesheet.last_out_time
                        ? format(calculatedTimesheet.last_out_time, "HH:mm")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gross Duration</Label>
                    <div className="font-medium">
                      {formatTime(calculatedTimesheet.gross_duration_minutes)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Break Duration</Label>
                    <div className="font-medium">
                      {formatTime(calculatedTimesheet.break_duration_minutes)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Net Working</Label>
                    <div className="font-medium">
                      {formatTime(calculatedTimesheet.net_working_minutes)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Overtime</Label>
                    <div className="font-medium text-orange-600">
                      {formatTime(calculatedTimesheet.overtime_minutes)}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      className={
                        calculatedTimesheet.status === "normal"
                          ? "bg-green-100 text-green-800"
                          : calculatedTimesheet.status === "missing"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {calculatedTimesheet.status}
                    </Badge>
                    {calculatedTimesheet.is_night_shift && (
                      <Badge className="ml-2 bg-blue-100 text-blue-800">Night Shift</Badge>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No calculated values available. PDKS logs or shift assignment missing.
              </div>
            )}
            {timesheet && (
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-muted-foreground">Saved Timesheet</Label>
                <div className="mt-2 text-sm space-y-1">
                  <div>
                    Status: <Badge>{timesheet.status}</Badge>
                  </div>
                  <div>
                    Approval: <Badge>{timesheet.approval_status}</Badge>
                  </div>
                  {timesheet.net_working_minutes > 0 && (
                    <div>Net Working: {formatTime(timesheet.net_working_minutes)}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="correction" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Manual Correction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLocked ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This period is locked. Corrections are not allowed.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>In Time (HH:mm)</Label>
                    <Input
                      type="time"
                      value={manualInTime}
                      onChange={(e) => setManualInTime(e.target.value)}
                      placeholder="09:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Out Time (HH:mm)</Label>
                    <Input
                      type="time"
                      value={manualOutTime}
                      onChange={(e) => setManualOutTime(e.target.value)}
                      placeholder="18:00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Correction Reason *</Label>
                  <Textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Enter mandatory reason for this correction..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => saveCorrectionMutation.mutate()}
                  disabled={!correctionReason.trim() || saveCorrectionMutation.isPending}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Correction
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Audit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 && auditLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">No audit history available.</div>
            ) : (
              <div className="space-y-3">
                {adjustments.map((adj) => (
                  <div key={adj.id} className="p-3 border rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{adj.adjustment_type}</Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(adj.created_at), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="text-muted-foreground">{adj.reason}</div>
                    {adj.old_value && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-[10px] text-muted-foreground">Old: {JSON.stringify(adj.old_value)}</div>
                        <div className="text-[10px] text-muted-foreground">New: {JSON.stringify(adj.new_value)}</div>
                      </div>
                    )}
                  </div>
                ))}
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{log.action}</Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    {log.changes && (
                      <div className="text-muted-foreground text-[10px]">
                        {JSON.stringify(log.changes, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default TimeTrackingCellDetail;

