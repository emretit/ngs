
import { Card } from "@/components/ui/card";
import { usePerformanceData } from "./performance/usePerformanceData";
import { PerformanceStats } from "./performance/PerformanceStats";
import { PerformanceChart } from "./performance/PerformanceChart";
import { PerformanceHistoryTable } from "./performance/PerformanceHistoryTable";
import { PerformanceForm } from "./performance/PerformanceForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { PerformanceRecord } from "./performance/types";

interface EmployeePerformanceTabProps {
  employeeId: string;
}

export const EmployeePerformanceTab = ({ employeeId }: EmployeePerformanceTabProps) => {
  const { performanceHistory, isLoading, addPerformanceRecord } = usePerformanceData(employeeId);
  const [showForm, setShowForm] = useState(false);

  const handleSubmitSuccess = (record: PerformanceRecord) => {
    addPerformanceRecord(record);
    setShowForm(false);
  };

  // Transform performance records to chart data format
  const chartData = performanceHistory.map(record => ({
    period: record.review_period,
    Technical: record.technical_score,
    Communication: record.communication_score,
    Teamwork: record.teamwork_score,
    Leadership: record.leadership_score,
    Overall: record.overall_score
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-60 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Performans Değerlendirmeleri</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Yeni Değerlendirme
          </Button>
        )}
      </div>

      {showForm ? (
        <Card className="p-6">
          <PerformanceForm 
            employeeId={employeeId}
            onSuccess={handleSubmitSuccess}
            onClose={() => setShowForm(false)}
          />
        </Card>
      ) : (
        <>
          {performanceHistory.length > 0 ? (
            <>
              <PerformanceStats 
                latestScores={performanceHistory[0]} 
                performanceTrend={{
                  trend: performanceHistory.length > 1 
                    ? ((performanceHistory[0].overall_score - performanceHistory[1].overall_score) / performanceHistory[1].overall_score) * 100
                    : 0,
                  icon: performanceHistory.length > 1 
                    ? performanceHistory[0].overall_score >= performanceHistory[1].overall_score ? "up" : "down"
                    : null
                }}
              />
              
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Performans Trendi</h3>
                <div className="h-80">
                  <PerformanceChart data={chartData} />
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Değerlendirme Geçmişi</h3>
                <PerformanceHistoryTable data={performanceHistory} />
              </Card>
            </>
          ) : (
            <Card className="p-10 text-center">
              <h3 className="text-lg text-gray-500 mb-4">Henüz performans değerlendirmesi bulunmuyor</h3>
              <Button onClick={() => setShowForm(true)}>Değerlendirme Ekle</Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
