import React from "react";
import { RouteConfig } from "./types";

// Lazy load all service pages
const NewServiceRequest = React.lazy(() => import("@/pages/service/NewServiceRequest"));
const ServiceEdit = React.lazy(() => import("@/pages/service/ServiceEdit"));
const ServiceDetail = React.lazy(() => import("@/pages/service/ServiceDetail"));
const ServiceReports = React.lazy(() => import("@/pages/service/ServiceReports"));
const ServiceSettings = React.lazy(() => import("@/pages/service/ServiceSettings"));
const ServicePerformanceView = React.lazy(() => import("@/pages/service/ServicePerformanceView"));
const ServicePartsView = React.lazy(() => import("@/pages/service/ServicePartsView"));
const ServiceAssetManagement = React.lazy(() => import("@/pages/service/ServiceAssetManagement"));
const ServiceDashboard = React.lazy(() => import("@/pages/service/ServiceDashboard"));
const ServiceManagement = React.lazy(() => import("@/pages/service/ServiceManagement"));
const ServiceMapPage = React.lazy(() => import("@/pages/service/ServiceMapPage"));
const ServiceRedirect = React.lazy(() => import("@/pages/service/ServiceRedirect"));
const ServiceContractsRedirect = React.lazy(() => import("@/pages/service/ServiceContractsRedirect"));
const ServiceAssetsRedirect = React.lazy(() => import("@/pages/service/ServiceAssetsRedirect"));
const ServiceWarrantiesRedirect = React.lazy(() => import("@/pages/service/ServiceWarrantiesRedirect"));
const ServiceMaintenanceRedirect = React.lazy(() => import("@/pages/service/ServiceMaintenanceRedirect"));

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
  { path: "/service/contracts", component: ServiceContractsRedirect, protected: true },
  { path: "/service/assets", component: ServiceAssetsRedirect, protected: true },
  { path: "/service/warranties", component: ServiceWarrantiesRedirect, protected: true },
  
  // Varlık Yönetimi (Cihaz, Garanti, Parça - Birleşik)
  { path: "/service/asset-management", component: ServiceAssetManagement, protected: true },

  // Bakım Takvimi (redirect to management with view=maintenance)
  { path: "/service/maintenance", component: ServiceMaintenanceRedirect, protected: true },
  
  // Performans ve Analiz
  { path: "/service/performance", component: ServicePerformanceView, protected: true },
  { path: "/service/parts", component: ServicePartsView, protected: true },
  
  // CRUD İşlemleri
  { path: "/service/new", component: NewServiceRequest, protected: true },
  { path: "/service/detail/:id", component: ServiceDetail, protected: true },
  { path: "/service/edit/:id", component: ServiceEdit, protected: true },
  
  // Ayarlar ve Raporlar
  { path: "/service/reports", component: ServiceReports, protected: true },
  { path: "/service/settings", component: ServiceSettings, protected: true },
];
