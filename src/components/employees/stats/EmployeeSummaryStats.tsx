
import { Users, Clock, Briefcase, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEmployeeStats } from "../hooks/useEmployeeStats";

export const EmployeeSummaryStats = () => {
  const { stats, isLoading } = useEmployeeStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Çalışan</p>
              <h3 className="text-2xl font-bold mt-1">
                {isLoading ? "..." : stats.totalEmployees}
              </h3>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <span className="i-lucide-trending-up mr-1"></span>
                +{isLoading ? "..." : stats.newHires} bu ay
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">İzindeki Çalışanlar</p>
              <h3 className="text-2xl font-bold mt-1">
                {isLoading ? "..." : stats.onLeaveCount}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isLoading ? "..." : stats.leaveDetails}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ortalama Kıdem</p>
              <h3 className="text-2xl font-bold mt-1">
                {isLoading ? "..." : stats.averageTenure}
              </h3>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <span className="i-lucide-trending-up mr-1"></span>
                +{isLoading ? "..." : stats.tenureChange} geçen yıla göre
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Açık Pozisyonlar</p>
              <h3 className="text-2xl font-bold mt-1">
                {isLoading ? "..." : stats.openPositions}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isLoading ? "..." : stats.openPositionsDetails}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
