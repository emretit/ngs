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
const PurchaseOrdersList = lazy(() => import("@/pages/purchasing/orders/index"));
const NewPurchaseOrder = lazy(() => import("@/pages/purchasing/orders/new"));
const PurchaseOrderDetail = lazy(() => import("@/pages/purchasing/orders/[id]"));
const ReceivePurchaseOrder = lazy(() => import("@/pages/purchasing/orders/receive"));
const RFQsList = lazy(() => import("@/pages/purchasing/rfqs/index"));
const RFQDetail = lazy(() => import("@/pages/purchasing/rfqs/[id]"));
const GRNsList = lazy(() => import("@/pages/purchasing/grns/index"));
const GRNDetail = lazy(() => import("@/pages/purchasing/grns/[id]"));
const VendorInvoicesList = lazy(() => import("@/pages/purchasing/invoices/index"));
const VendorInvoiceDetail = lazy(() => import("@/pages/purchasing/invoices/[id]"));
const PurchasingSettings = lazy(() => import("@/pages/purchasing/settings/index"));

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
  {
    path: "/purchasing/rfqs",
    component: RFQsList,
    protected: true,
  },
  {
    path: "/purchasing/rfqs/:id",
    component: RFQDetail,
    protected: true,
  },
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
  {
    path: "/purchasing/settings",
    component: PurchasingSettings,
    protected: true,
  },
];