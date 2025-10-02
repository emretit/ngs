import { RouteConfig } from "./types";
import { lazy } from "react";

const PurchaseManagement = lazy(() => import("@/pages/PurchaseManagement"));
const PurchaseRequests = lazy(() => import("@/pages/PurchaseRequests"));
const ProductMapping = lazy(() => import("@/pages/ProductMapping"));
const PurchaseInvoices = lazy(() => import("@/pages/PurchaseInvoices"));
const PurchaseInvoiceDetail = lazy(() => import("@/pages/PurchaseInvoiceDetail"));
const EInvoices = lazy(() => import("@/pages/EInvoices"));
const EInvoiceProcess = lazy(() => import("@/pages/EInvoiceProcess"));
const PurchasingDashboard = lazy(() => import("@/pages/purchasing/index"));
const PurchaseRequestsList = lazy(() => import("@/pages/purchasing/requests/index"));
const NewPurchaseRequest = lazy(() => import("@/pages/purchasing/requests/new"));
const PurchaseRequestDetail = lazy(() => import("@/pages/purchasing/requests/[id]"));

export const purchaseRoutes: RouteConfig[] = [
  {
    path: "/purchase",
    component: PurchaseManagement,
    protected: true,
  },
  {
    path: "/purchase-management",
    component: PurchaseManagement,
    protected: true,
  },
  {
    path: "/purchase/requests",
    component: PurchaseRequests,
    protected: true,
  },
  {
    path: "/purchase-invoices",
    component: PurchaseInvoices,
    protected: true,
  },
  {
    path: "/purchase-invoices/:id",
    component: PurchaseInvoiceDetail,
    protected: true,
  },
  {
    path: "/purchase/e-invoice",
    component: EInvoices,
    protected: true,
  },
  {
    path: "/purchase/e-invoice/process/:invoiceId",
    component: EInvoiceProcess,
    protected: true,
  },
  {
    path: "/product-mapping/:invoiceId",
    component: ProductMapping,
    protected: true,
  },
  {
    path: "/purchasing",
    component: PurchasingDashboard,
    protected: true,
  },
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
];