
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

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Activities Card */}
          <Card className="group relative overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Aktiviteler</CardTitle>
                    <p className="text-xs text-muted-foreground">Günlük işlemler</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-auto h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-300"
                  onClick={() => setIsNewActivityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Yeni Aktivite Ekle</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivitiesSummary />
            </CardContent>
          </Card>

          {/* Opportunities Card */}
          <Card className="group relative overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Fırsatlar</CardTitle>
                    <p className="text-xs text-muted-foreground">Satış fırsatları</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-auto h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-300"
                  onClick={() => setIsNewOpportunityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Yeni Fırsat Ekle</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <OpportunitiesSummary />
            </CardContent>
          </Card>

          {/* Proposals Card */}
          <Card className="group relative overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Teklifler</CardTitle>
                    <p className="text-xs text-muted-foreground">Müşteri teklifleri</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-auto h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-300"
                  onClick={() => navigate("/proposal/create")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Yeni Teklif Ekle</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ProposalsSummary />
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="group relative overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Siparişler</CardTitle>
                    <p className="text-xs text-muted-foreground">Müşteri siparişleri</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-auto h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-300"
                  onClick={() => navigate("/orders/create")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Yeni Sipariş Ekle</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
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
