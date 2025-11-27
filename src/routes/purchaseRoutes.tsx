import React from "react";
import { RouteConfig } from "./types";

// Lazy load all purchase pages
const PurchaseManagement = React.lazy(() => import("@/pages/PurchaseManagement"));
const PurchasingDashboard = React.lazy(() => import("@/pages/purchasing/index"));
const PurchaseRequestsList = React.lazy(() => import("@/pages/purchasing/requests/index"));
const NewPurchaseRequest = React.lazy(() => import("@/pages/purchasing/requests/new"));
const PurchaseRequestDetail = React.lazy(() => import("@/pages/purchasing/requests/[id]"));
const PurchaseOrdersList = React.lazy(() => import("@/pages/purchasing/orders/index"));
const NewPurchaseOrder = React.lazy(() => import("@/pages/purchasing/orders/new"));
const PurchaseOrderDetail = React.lazy(() => import("@/pages/purchasing/orders/[id]"));
const ReceivePurchaseOrder = React.lazy(() => import("@/pages/purchasing/orders/receive"));
const RFQsList = React.lazy(() => import("@/pages/purchasing/rfqs/index"));
const NewRFQ = React.lazy(() => import("@/pages/purchasing/rfqs/new"));
const RFQDetail = React.lazy(() => import("@/pages/purchasing/rfqs/[id]"));
const GRNsList = React.lazy(() => import("@/pages/purchasing/grns/index"));
const GRNDetail = React.lazy(() => import("@/pages/purchasing/grns/[id]"));
const VendorInvoicesList = React.lazy(() => import("@/pages/purchasing/invoices/index"));
const VendorInvoiceDetail = React.lazy(() => import("@/pages/purchasing/invoices/[id]"));
const PurchasingSettings = React.lazy(() => import("@/pages/purchasing/settings/index"));

export const purchaseRoutes: RouteConfig[] = [
  // Eski route (geriye dönük uyumluluk)
  {
    path: "/purchase-management",
    component: PurchaseManagement,
    protected: true,
  },
  
  // ============================================
  // SATIN ALMA MODÜLÜ - /purchasing altında
  // ============================================
  
  // Dashboard - Ana sayfa
  {
    path: "/purchasing",
    component: PurchasingDashboard,
    protected: true,
  },
  
  // Talepler (Purchase Requests)
  {
    path: "/purchasing/requests",
    component: PurchaseRequestsList,
    protected: true,
  },
  {
    path: "/purchasing/requests/new",
    component: NewPurchaseRequest,
    protected: true,
  },
  {
    path: "/purchasing/requests/:id",
    component: PurchaseRequestDetail,
    protected: true,
  },
  
  // Teklif İstekleri (RFQ)
  {
    path: "/purchasing/rfqs",
    component: RFQsList,
    protected: true,
  },
  {
    path: "/purchasing/rfqs/new",
    component: NewRFQ,
    protected: true,
  },
  {
    path: "/purchasing/rfqs/:id",
    component: RFQDetail,
    protected: true,
  },
  
  // Siparişler (Purchase Orders)
  {
    path: "/purchasing/orders",
    component: PurchaseOrdersList,
    protected: true,
  },
  {
    path: "/purchasing/orders/new",
    component: NewPurchaseOrder,
    protected: true,
  },
  {
    path: "/purchasing/orders/:id",
    component: PurchaseOrderDetail,
    protected: true,
  },
  {
    path: "/purchasing/orders/:id/receive",
    component: ReceivePurchaseOrder,
    protected: true,
  },
  
  // Mal Kabul (GRN)
  {
    path: "/purchasing/grns",
    component: GRNsList,
    protected: true,
  },
  {
    path: "/purchasing/grns/:id",
    component: GRNDetail,
    protected: true,
  },
  
  // Tedarikçi Faturaları
  {
    path: "/purchasing/invoices",
    component: VendorInvoicesList,
    protected: true,
  },
  {
    path: "/purchasing/invoices/:id",
    component: VendorInvoiceDetail,
    protected: true,
  },
  
  // Ayarlar
  {
    path: "/purchasing/settings",
    component: PurchasingSettings,
    protected: true,
  },
  
  // ============================================
  // ESKİ ROUTE'LAR (geriye dönük uyumluluk için)
  // ============================================
  {
    path: "/purchase-requests",
    component: PurchaseRequestsList,
    protected: true,
  },
  {
    path: "/purchase-requests/new",
    component: NewPurchaseRequest,
    protected: true,
  },
  {
    path: "/purchase-requests/:id",
    component: PurchaseRequestDetail,
    protected: true,
  },
  {
    path: "/purchase-orders",
    component: PurchaseOrdersList,
    protected: true,
  },
  {
    path: "/purchase-orders/new",
    component: NewPurchaseOrder,
    protected: true,
  },
  {
    path: "/purchase-orders/:id",
    component: PurchaseOrderDetail,
    protected: true,
  },
  {
    path: "/purchase-orders/:id/receive",
    component: ReceivePurchaseOrder,
    protected: true,
  },
  {
    path: "/purchase-rfqs",
    component: RFQsList,
    protected: true,
  },
  {
    path: "/purchase-rfqs/new",
    component: NewRFQ,
    protected: true,
  },
  {
    path: "/purchase-rfqs/:id",
    component: RFQDetail,
    protected: true,
  },
  {
    path: "/purchase-grns",
    component: GRNsList,
    protected: true,
  },
  {
    path: "/purchase-grns/:id",
    component: GRNDetail,
    protected: true,
  },
  {
    path: "/vendor-invoices",
    component: VendorInvoicesList,
    protected: true,
  },
  {
    path: "/vendor-invoices/:id",
    component: VendorInvoiceDetail,
    protected: true,
  },
];
