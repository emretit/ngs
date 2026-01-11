import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TimesheetSummaryCardProps {
  employeeId: string;
  year: number;
  month: number;
  data: {
    totalWorkingHours: number;
    overtimeHours: number;
    totalDays: number;
    leaveDays: number;
    sickLeaveDays: number;
  };
}

export const TimesheetSummaryCard = ({
  employeeId,
  year,
  month,
  data,
}: TimesheetSummaryCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/hr/time-payroll?employeeId=${employeeId}&year=${year}&month=${month}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Puantaj Özeti</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="gap-2"
          >
            Detaya Git
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Toplam Çalışma</span>
            </div>
            <p className="text-2xl font-bold">{data.totalWorkingHours.toFixed(1)}h</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Fazla Mesai</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {data.overtimeHours.toFixed(1)}h
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Çalışma Günü</span>
            </div>
            <p className="text-2xl font-bold">{data.totalDays} gün</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>İzin/Rapor</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">
              {data.leaveDays + data.sickLeaveDays} gün
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
