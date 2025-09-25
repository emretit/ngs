
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
          {/* Activities Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/40 transition-all duration-500 group-hover:scale-110">
                    <Calendar className="w-6 h-6 text-blue-600 group-hover:text-blue-500 transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Aktiviteler
                    </CardTitle>
                    <p className="text-sm text-muted-foreground/80">Günlük işlemler & görevler</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border-0 group-hover:scale-105"
                  onClick={() => setIsNewActivityDialogOpen(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <ActivitiesSummary />
            </CardContent>
          </Card>

          {/* Opportunities Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-600/30 rounded-xl flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-green-600/40 transition-all duration-500 group-hover:scale-110">
                    <BarChart3 className="w-6 h-6 text-emerald-600 group-hover:text-emerald-500 transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Fırsatlar
                    </CardTitle>
                    <p className="text-sm text-muted-foreground/80">Satış fırsatları & potansiyel</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 border-0 group-hover:scale-105"
                  onClick={() => setIsNewOpportunityDialogOpen(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <OpportunitiesSummary />
            </CardContent>
          </Card>

          {/* Proposals Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-600/30 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-600/40 transition-all duration-500 group-hover:scale-110">
                    <FileText className="w-6 h-6 text-orange-600 group-hover:text-orange-500 transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Teklifler
                    </CardTitle>
                    <p className="text-sm text-muted-foreground/80">Müşteri teklifleri & sunumlar</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-300 border-0 group-hover:scale-105"
                  onClick={() => navigate("/proposal/create")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Yeni</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <ProposalsSummary />
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-600/30 rounded-xl flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-600/40 transition-all duration-500 group-hover:scale-110">
                    <ShoppingCart className="w-6 h-6 text-violet-600 group-hover:text-violet-500 transition-colors duration-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Siparişler
                    </CardTitle>
                    <p className="text-sm text-muted-foreground/80">Müşteri siparişleri & teslimat</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-violet-500/25 transition-all duration-300 border-0 group-hover:scale-105"
                  onClick={() => navigate("/orders/create")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Yeni</span>
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
