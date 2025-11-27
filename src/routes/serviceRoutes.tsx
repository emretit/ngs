import React from "react";
import { RouteConfig } from "./types";

// Lazy load all service pages
const NewServiceRequest = React.lazy(() => import("@/pages/service/NewServiceRequest"));
const ServiceEdit = React.lazy(() => import("@/pages/service/ServiceEdit"));
const ServiceDetail = React.lazy(() => import("@/pages/service/ServiceDetail"));
const ServiceReports = React.lazy(() => import("@/pages/service/ServiceReports"));
const ServiceSettings = React.lazy(() => import("@/pages/service/ServiceSettings"));
const ServiceSLAView = React.lazy(() => import("@/pages/service/ServiceSLAView"));
const ServiceMaintenanceView = React.lazy(() => import("@/pages/service/ServiceMaintenanceView"));
const ServicePerformanceView = React.lazy(() => import("@/pages/service/ServicePerformanceView"));
const ServiceCostsView = React.lazy(() => import("@/pages/service/ServiceCostsView"));
const ServicePartsView = React.lazy(() => import("@/pages/service/ServicePartsView"));
const ServiceSatisfactionView = React.lazy(() => import("@/pages/service/ServiceSatisfactionView"));
const ServiceAnalyticsView = React.lazy(() => import("@/pages/service/ServiceAnalyticsView"));
const ServiceWorkOrders = React.lazy(() => import("@/pages/service/ServiceWorkOrders"));
const ServiceAssets = React.lazy(() => import("@/pages/service/ServiceAssets"));
const ServiceContracts = React.lazy(() => import("@/pages/service/ServiceContracts"));
const ServiceWarranties = React.lazy(() => import("@/pages/service/ServiceWarranties"));
const ServiceHistory = React.lazy(() => import("@/pages/service/ServiceHistory"));
const ServiceDashboard = React.lazy(() => import("@/pages/service/ServiceDashboard"));
const ServiceManagement = React.lazy(() => import("@/pages/service/ServiceManagement"));
const ServiceMapPage = React.lazy(() => import("@/pages/service/ServiceMapPage"));
const ServiceRedirect = React.lazy(() => import("@/pages/service/ServiceRedirect"));

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
