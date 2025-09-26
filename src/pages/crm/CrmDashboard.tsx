
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
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Aktiviteler
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Günlük işlemler & görevler</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsNewActivityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Yeni
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivitiesSummary />
            </CardContent>
          </Card>

          {/* Opportunities Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Fırsatlar
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Satış fırsatları & potansiyel</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsNewOpportunityDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Yeni
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <OpportunitiesSummary />
            </CardContent>
          </Card>

          {/* Proposals Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Teklifler
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Müşteri teklifleri & sunumlar</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => navigate("/proposal/create")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Yeni
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ProposalsSummary />
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Siparişler
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Müşteri siparişleri & teslimat</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => navigate("/orders/create")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Yeni
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
