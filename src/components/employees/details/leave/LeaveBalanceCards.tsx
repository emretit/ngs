
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface LeaveBalanceCardsProps {
  leaveBalance: {
    annual: number;
    sick: number;
    parental: number;
    unpaid: number;
    other: number;
  };
  pendingRequestsCount: number;
}

export const LeaveBalanceCards = ({ leaveBalance, pendingRequestsCount }: LeaveBalanceCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Kalan Yıllık İzin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leaveBalance.annual} gün</div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Yıllık izin hakkı
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Kalan Hastalık İzni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leaveBalance.sick} gün</div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Hastalık izni hakkı
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bekleyen İzin Talepleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingRequestsCount}</div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Onay bekliyor
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
