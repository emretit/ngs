
import React from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActivitiesSummary from "@/components/crm/ActivitiesSummary";
import ProposalsSummary from "@/components/crm/ProposalsSummary";
import OpportunitiesSummary from "@/components/crm/OpportunitiesSummary";
import OrdersSummary from "@/components/crm/OrdersSummary";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, FileText, BarChart3, ShoppingCart, Plus } from "lucide-react";
import { useState } from "react";
import NewActivityDialog from "@/components/activities/NewActivityDialog";
import OpportunityForm from "@/components/opportunities/OpportunityForm";

interface CrmDashboardProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CrmDashboard: React.FC<CrmDashboardProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);
  const [isNewOpportunityDialogOpen, setIsNewOpportunityDialogOpen] = useState(false);

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="CRM Özeti"
      subtitle="Aktiviteler, fırsatlar, teklifler ve siparişlerin genel durumu"
    >
      {/* Clean Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              CRM Özeti
            </h1>
            <p className="text-muted-foreground mt-1">
              İş süreçlerinizi takip edin ve yönetin
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Güncel</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Activities Card - Blue Theme */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-blue-50/60 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20 backdrop-blur-xl border-2 border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-600/10 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:from-blue-400 group-hover:to-blue-500 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-blue-500/30">
                    <Calendar className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-100">
                      Aktiviteler
                    </CardTitle>
                    <p className="text-sm text-blue-600/80 dark:text-blue-300/80 font-medium">Günlük işlemler & görevler</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/40 transition-all duration-300 border-0 group-hover:scale-110"
                  onClick={() => setIsNewActivityDialogOpen(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <ActivitiesSummary />
            </CardContent>
          </Card>

          {/* Opportunities Card - Green Theme */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 backdrop-blur-xl border-2 border-emerald-200/30 dark:border-emerald-800/30 hover:border-emerald-300/50 dark:hover:border-emerald-700/50 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-emerald-600/10 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:from-emerald-400 group-hover:to-green-500 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-emerald-500/30">
                    <BarChart3 className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-emerald-800 dark:text-emerald-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-100">
                      Fırsatlar
                    </CardTitle>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-300/80 font-medium">Satış fırsatları & potansiyel</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/40 transition-all duration-300 border-0 group-hover:scale-110"
                  onClick={() => setIsNewOpportunityDialogOpen(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <OpportunitiesSummary />
            </CardContent>
          </Card>

          {/* Proposals Card - Orange Theme */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50/90 via-orange-50/60 to-amber-100/40 dark:from-orange-950/40 dark:to-amber-900/20 backdrop-blur-xl border-2 border-orange-200/30 dark:border-orange-800/30 hover:border-orange-300/50 dark:hover:border-orange-700/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-400/5 to-orange-600/10 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center group-hover:from-orange-400 group-hover:to-amber-500 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-orange-500/30">
                    <FileText className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-200 group-hover:text-orange-700 dark:group-hover:text-orange-100">
                      Teklifler
                    </CardTitle>
                    <p className="text-sm text-orange-600/80 dark:text-orange-300/80 font-medium">Müşteri teklifleri & sunumlar</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-orange-500/40 transition-all duration-300 border-0 group-hover:scale-110"
                  onClick={() => navigate("/proposal/create")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <ProposalsSummary />
            </CardContent>
          </Card>

          {/* Orders Card - Purple Theme */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-50/90 via-purple-50/60 to-violet-100/40 dark:from-violet-950/40 dark:to-purple-900/20 backdrop-blur-xl border-2 border-violet-200/30 dark:border-violet-800/30 hover:border-violet-300/50 dark:hover:border-violet-700/50 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-400/5 to-violet-600/10 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:from-violet-400 group-hover:to-purple-500 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-violet-500/30">
                    <ShoppingCart className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-violet-800 dark:text-violet-200 group-hover:text-violet-700 dark:group-hover:text-violet-100">
                      Siparişler
                    </CardTitle>
                    <p className="text-sm text-violet-600/80 dark:text-violet-300/80 font-medium">Müşteri siparişleri & teslimat</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-violet-500/40 transition-all duration-300 border-0 group-hover:scale-110"
                  onClick={() => navigate("/orders/create")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <OrdersSummary />
            </CardContent>
          </Card>
        </div>

        <NewActivityDialog
          isOpen={isNewActivityDialogOpen}
          onClose={() => setIsNewActivityDialogOpen(false)}
          onSuccess={() => {
            // Aktivite başarıyla eklendiğinde yapılacak işlemler
            setIsNewActivityDialogOpen(false);
          }}
        />
        
        <OpportunityForm
          isOpen={isNewOpportunityDialogOpen}
          onClose={() => setIsNewOpportunityDialogOpen(false)}
        />
      </div>
    </DefaultLayout>
  );
};

export default CrmDashboard;
