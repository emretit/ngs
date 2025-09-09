
import { BarChart, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AnalyticsCard from "./AnalyticsCard";
import DealAnalytics from "../DealAnalytics";
import ProposalAnalytics from "../ProposalAnalytics";
import NewActivityDialog from "@/components/activities/NewActivityDialog";

const AnalyticsSection = () => {
  const navigate = useNavigate();
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);

  const handleActivitySuccess = () => {
    // Aktivite başarıyla eklendiğinde yapılacak işlemler
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analitik Görünüm</h2>
      
      {/* Deal Analytics */}
      <AnalyticsCard
        title="Fırsat Analizi"
        description="Fırsat dönüşümleri ve performans"
        icon={<BarChart />}
        iconBgColor="bg-blue-100"
        iconTextColor="text-blue-600"
      >
        <DealAnalytics />
      </AnalyticsCard>
      
      {/* Proposal Analytics */}
      <AnalyticsCard
        title="Teklif Analizi"
        description="Teklif dönüşümleri ve performans"
        icon={<Activity />}
        iconBgColor="bg-purple-100"
        iconTextColor="text-purple-600"
      >
        <ProposalAnalytics />
      </AnalyticsCard>
      
      {/* Quick Actions */}
      <Card className="shadow-md border border-gray-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <CardTitle className="text-xl font-semibold">Hızlı İşlemler</CardTitle>
            <div className="bg-amber-100 p-2 rounded-full">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              size="lg" 
              className="w-full h-16 text-lg"
              onClick={() => navigate("/deals/new")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              Yeni Fırsat Oluştur
            </Button>
            <Button 
              size="lg" 
              className="w-full h-16 text-lg"
              onClick={() => navigate("/proposal-form")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              Yeni Teklif Oluştur
            </Button>
            <Button 
              size="lg" 
              className="w-full h-16 text-lg"
              onClick={() => setIsNewActivityDialogOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              Yeni Görev Oluştur
            </Button>
          </div>
        </CardContent>
      </Card>

      <NewActivityDialog
        isOpen={isNewActivityDialogOpen}
        onClose={() => setIsNewActivityDialogOpen(false)}
        onSuccess={handleActivitySuccess}
      />
    </div>
  );
};

export default AnalyticsSection;
