
import NewServiceRequest from "@/pages/service/NewServiceRequest";
import ServiceDetail from "@/pages/service/ServiceDetail";
import ServiceReports from "@/pages/service/ServiceReports";
import ServiceSettings from "@/pages/service/ServiceSettings";
import ServiceListView from "@/pages/service/ServiceListView";
import ServiceKanbanView from "@/pages/service/ServiceKanbanView";
import ServiceMapView from "@/pages/service/ServiceMapView";
import ServiceSchedulingView from "@/pages/service/ServiceSchedulingView";
import ServiceCalendarView from "@/pages/service/ServiceCalendarView";
import ServiceSLAView from "@/pages/service/ServiceSLAView";
import ServiceMaintenanceView from "@/pages/service/ServiceMaintenanceView";
import ServiceTemplatesView from "@/pages/service/ServiceTemplatesView";
import ServicePerformanceView from "@/pages/service/ServicePerformanceView";
import ServiceCostsView from "@/pages/service/ServiceCostsView";
import ServicePartsView from "@/pages/service/ServicePartsView";
import ServiceSatisfactionView from "@/pages/service/ServiceSatisfactionView";
import ServiceAnalyticsView from "@/pages/service/ServiceAnalyticsView";
import ServiceWorkOrders from "@/pages/service/ServiceWorkOrders";
import ServiceAssets from "@/pages/service/ServiceAssets";
import ServiceContracts from "@/pages/service/ServiceContracts";
import ServiceWarranties from "@/pages/service/ServiceWarranties";
import ServiceHistory from "@/pages/service/ServiceHistory";
import { RouteConfig } from "./types";

// Define service routes
export const serviceRoutes: RouteConfig[] = [
  // Default view
  { path: "/service", component: ServiceSchedulingView, protected: true },
  
  // Görünümler
  { path: "/service/list", component: ServiceListView, protected: true },
  { path: "/service/kanban", component: ServiceKanbanView, protected: true },
  { path: "/service/map", component: ServiceMapView, protected: true },
  { path: "/service/scheduling", component: ServiceSchedulingView, protected: true },
  { path: "/service/calendar", component: ServiceCalendarView, protected: true },
  
  // Yönetim Modülleri
  { path: "/service/work-orders", component: ServiceWorkOrders, protected: true },
  { path: "/service/assets", component: ServiceAssets, protected: true },
  { path: "/service/contracts", component: ServiceContracts, protected: true },
  { path: "/service/warranties", component: ServiceWarranties, protected: true },
  
  // Bakım ve Planlama
  { path: "/service/sla", component: ServiceSLAView, protected: true },
  { path: "/service/maintenance", component: ServiceMaintenanceView, protected: true },
  { path: "/service/templates", component: ServiceTemplatesView, protected: true },
  
  // Performans ve Analiz
  { path: "/service/performance", component: ServicePerformanceView, protected: true },
  { path: "/service/costs", component: ServiceCostsView, protected: true },
  { path: "/service/parts", component: ServicePartsView, protected: true },
  { path: "/service/satisfaction", component: ServiceSatisfactionView, protected: true },
  { path: "/service/analytics", component: ServiceAnalyticsView, protected: true },
  { path: "/service/history", component: ServiceHistory, protected: true },
  
  // CRUD İşlemleri
  { path: "/service/new", component: NewServiceRequest, protected: true },
  { path: "/service/detail/:id", component: ServiceDetail, protected: true },
  { path: "/service/edit/:id", component: NewServiceRequest, protected: true },
  
  // Ayarlar ve Raporlar
  { path: "/service/reports", component: ServiceReports, protected: true },
  { path: "/service/settings", component: ServiceSettings, protected: true },
];
