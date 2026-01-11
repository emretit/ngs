
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PerformanceRecord } from "./types";

export const usePerformanceData = (employeeId: string) => {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPerformanceHistory = async () => {
      try {
        setIsLoading(true);
        // This is a placeholder until the actual performance table is created
        // Using mock data for now
        const mockData: PerformanceRecord[] = [
          {
            id: '1',
            employee_id: employeeId,
            review_period: '2023-01',
            reviewer_id: '123',
            reviewer_name: 'John Manager',
            technical_score: 4,
            communication_score: 3,
            teamwork_score: 4,
            leadership_score: 3,
            overall_score: 3.5,
            strengths: 'Technical expertise, problem-solving',
            areas_for_improvement: 'Communication with team members',
            goals: 'Improve project documentation',
            notes: 'Overall good performance',
            created_at: '2023-01-31T00:00:00Z'
          },
          {
            id: '2',
            employee_id: employeeId,
            review_period: '2023-04',
            reviewer_id: '123',
            reviewer_name: 'John Manager',
            technical_score: 4,
            communication_score: 4,
            teamwork_score: 4,
            leadership_score: 3,
            overall_score: 3.75,
            strengths: 'Technical expertise, problem-solving, improved communication',
            areas_for_improvement: 'Taking initiative on projects',
            goals: 'Lead at least one project in next quarter',
            notes: 'Showing improvement in communication',
            created_at: '2023-04-30T00:00:00Z'
          },
          {
            id: '3',
            employee_id: employeeId,
            review_period: '2023-07',
            reviewer_id: '123',
            reviewer_name: 'John Manager',
            technical_score: 5,
            communication_score: 4,
            teamwork_score: 4,
            leadership_score: 4,
            overall_score: 4.25,
            strengths: 'Technical expertise, mentoring junior team members',
            areas_for_improvement: 'Time management during project deadlines',
            goals: 'Complete leadership training program',
            notes: 'Excellent technical performance',
            created_at: '2023-07-31T00:00:00Z'
          },
        ];
        
        setPerformanceHistory(mockData);
      } catch (error) {
        console.error('Error fetching performance history:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Performans bilgileri yüklenirken bir hata oluştu.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceHistory();
  }, [employeeId, toast]);

  const addPerformanceRecord = (newRecord: PerformanceRecord) => {
    setPerformanceHistory([...performanceHistory, newRecord]);
  };

  return {
    performanceHistory,
    isLoading,
    addPerformanceRecord
  };
};

export const usePerformanceStats = (performanceHistory: PerformanceRecord[]) => {
  const getLatestScores = () => {
    if (performanceHistory.length === 0) return null;
    return performanceHistory[performanceHistory.length - 1];
  };

  const getPerformanceTrend = () => {
    if (performanceHistory.length < 2) return { trend: 0, icon: null };
    
    const latest = performanceHistory[performanceHistory.length - 1].overall_score;
    const previous = performanceHistory[performanceHistory.length - 2].overall_score;
    const trend = ((latest - previous) / previous) * 100;
    
    return { 
      trend: parseFloat(trend.toFixed(1)),
      icon: trend >= 0 ? "up" : "down"
    };
  };

  const getChartData = () => {
    return performanceHistory.map(record => ({
      period: record.review_period,
      Technical: record.technical_score,
      Communication: record.communication_score,
      Teamwork: record.teamwork_score,
      Leadership: record.leadership_score,
      Overall: record.overall_score
    }));
  };

  return {
    latestScores: getLatestScores(),
    performanceTrend: getPerformanceTrend(),
    chartData: getChartData()
  };
};
