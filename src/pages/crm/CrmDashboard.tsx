import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Calendar, FileText, ShoppingCart, Plus } from "lucide-react";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig } from "@/components/module-dashboard";
import ActivitiesSummary from "@/components/crm/ActivitiesSummary";
import ProposalsSummary from "@/components/crm/ProposalsSummary";
import OpportunitiesSummary from "@/components/crm/OpportunitiesSummary";
import OrdersSummary from "@/components/crm/OrdersSummary";
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

  const cards: QuickLinkCardConfig[] = [
    {
      id: "activities",
      title: "Aktiviteler",
      subtitle: "Günlük işlemler",
      icon: Calendar,
      color: "blue",
      href: "/activities",
      newButton: {
        onClick: (e) => {
          e.stopPropagation();
          setIsNewActivityDialogOpen(true);
        },
      },
      customContent: <ActivitiesSummary />,
    },
    {
      id: "opportunities",
      title: "Fırsatlar",
      subtitle: "Satış fırsatları",
      icon: BarChart3,
      color: "purple",
      href: "/opportunities",
      newButton: {
        onClick: (e) => {
          e.stopPropagation();
          setIsNewOpportunityDialogOpen(true);
        },
      },
      customContent: <OpportunitiesSummary />,
    },
    {
      id: "proposals",
      title: "Teklifler",
      subtitle: "Müşteri teklifleri",
      icon: FileText,
      color: "orange",
      href: "/proposals",
      newButton: {
        href: "/proposal/create",
      },
      customContent: <ProposalsSummary />,
    },
    {
      id: "orders",
      title: "Siparişler",
      subtitle: "Müşteri siparişleri",
      icon: ShoppingCart,
      color: "green",
      href: "/orders",
      newButton: {
        href: "/orders/create",
      },
      customContent: <OrdersSummary />,
    },
  ];

  const config: ModuleDashboardConfig = {
    header: {
      title: "CRM Özeti",
      subtitle: "İş süreçlerinizi takip edin ve yönetin",
      icon: BarChart3,
    },
    cards,
    additionalContent: (
      <>
        <NewActivityDialog
          isOpen={isNewActivityDialogOpen}
          onClose={() => setIsNewActivityDialogOpen(false)}
          onSuccess={() => setIsNewActivityDialogOpen(false)}
        />
        <OpportunityForm
          isOpen={isNewOpportunityDialogOpen}
          onClose={() => setIsNewOpportunityDialogOpen(false)}
        />
      </>
    ),
  };

  return <ModuleDashboard config={config} gridCols={4} />;
};

export default CrmDashboard;
