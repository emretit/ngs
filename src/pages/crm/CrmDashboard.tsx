import React from "react";
import { useNavigate } from "react-router-dom";
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
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const CrmDashboard: React.FC<CrmDashboardProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);
  const [isNewOpportunityDialogOpen, setIsNewOpportunityDialogOpen] = useState(false);
  return (
    <>
      {/* Clean Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                CRM Özeti
              </h1>
              <p className="text-xs text-muted-foreground/70">
                İş süreçlerinizi takip edin ve yönetin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Güncel</span>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Activities Card */}
          <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Aktiviteler</h2>
                    <p className="text-xs text-gray-500">Günlük işlemler</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                  onClick={() => setIsNewActivityDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Yeni
                </Button>
              </div>
              <ActivitiesSummary />
            </div>
          </div>
          {/* Opportunities Card */}
          <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Fırsatlar</h2>
                    <p className="text-xs text-gray-500">Satış fırsatları</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 h-7"
                  onClick={() => setIsNewOpportunityDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Yeni
                </Button>
              </div>
              <OpportunitiesSummary />
            </div>
          </div>
          {/* Proposals Card */}
          <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Teklifler</h2>
                    <p className="text-xs text-gray-500">Müşteri teklifleri</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7"
                  onClick={() => navigate("/proposal/create")}
                >
                  <Plus className="h-3 w-3" />
                  Yeni
                </Button>
              </div>
              <ProposalsSummary />
            </div>
          </div>
          {/* Orders Card */}
          <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Siparişler</h2>
                    <p className="text-xs text-gray-500">Müşteri siparişleri</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                  onClick={() => navigate("/orders/create")}
                >
                  <Plus className="h-3 w-3" />
                  Yeni
                </Button>
              </div>
              <OrdersSummary />
            </div>
          </div>
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
    </>
  );
};
export default CrmDashboard;
