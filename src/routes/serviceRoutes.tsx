
import NewServiceRequest from "@/pages/service/NewServiceRequest";
import ServiceEdit from "@/pages/service/ServiceEdit";
import ServiceDetail from "@/pages/service/ServiceDetail";
import ServiceReports from "@/pages/service/ServiceReports";
import ServiceSettings from "@/pages/service/ServiceSettings";
import ServiceSLAView from "@/pages/service/ServiceSLAView";
import ServiceMaintenanceView from "@/pages/service/ServiceMaintenanceView";
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
import ServiceDashboard from "@/pages/service/ServiceDashboard";
import ServiceManagement from "@/pages/service/ServiceManagement";
import ServiceMapPage from "@/pages/service/ServiceMapPage";
import ServiceRedirect from "@/pages/service/ServiceRedirect";
import { RouteConfig } from "./types";

// Define service routes
export const serviceRoutes: RouteConfig[] = [
  // Dashboard
  { path: "/service", component: ServiceDashboard, protected: true },
  
  // Servis Yönetimi
  { path: "/service/management", component: ServiceManagement, protected: true },
  
  // Harita Sayfası
  { path: "/service/map", component: ServiceMapPage, protected: true },
  
  // Eski route'lar için redirect (geriye dönük uyumluluk)
  { path: "/service/list", component: ServiceRedirect, protected: true },
  { path: "/service/kanban", component: ServiceRedirect, protected: true },
  { path: "/service/scheduling", component: ServiceRedirect, protected: true },
  { path: "/service/calendar", component: ServiceRedirect, protected: true },
  
  // Yönetim Modülleri
  { path: "/service/work-orders", component: ServiceWorkOrders, protected: true },
  { path: "/service/assets", component: ServiceAssets, protected: true },
  { path: "/service/contracts", component: ServiceContracts, protected: true },
  { path: "/service/warranties", component: ServiceWarranties, protected: true },
  
  // Bakım ve Planlama
  { path: "/service/sla", component: ServiceSLAView, protected: true },
  { path: "/service/maintenance", component: ServiceMaintenanceView, protected: true },
  
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
  { path: "/service/edit/:id", component: ServiceEdit, protected: true },
  
  // Ayarlar ve Raporlar
  { path: "/service/reports", component: ServiceReports, protected: true },
  { path: "/service/settings", component: ServiceSettings, protected: true },
];
