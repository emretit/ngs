import { RouteConfig } from "./types";

// Satın alma modülü sayfaları
import PurchaseManagement from "@/pages/PurchaseManagement";
import PurchasingDashboard from "@/pages/purchasing/index";
import PurchaseRequestsList from "@/pages/purchasing/requests/index";
import NewPurchaseRequest from "@/pages/purchasing/requests/new";
import PurchaseRequestDetail from "@/pages/purchasing/requests/[id]";
import PurchaseOrdersList from "@/pages/purchasing/orders/index";
import NewPurchaseOrder from "@/pages/purchasing/orders/new";
import PurchaseOrderDetail from "@/pages/purchasing/orders/[id]";
import ReceivePurchaseOrder from "@/pages/purchasing/orders/receive";
import RFQsList from "@/pages/purchasing/rfqs/index";
import NewRFQ from "@/pages/purchasing/rfqs/new";
import RFQDetail from "@/pages/purchasing/rfqs/[id]";
import GRNsList from "@/pages/purchasing/grns/index";
import GRNDetail from "@/pages/purchasing/grns/[id]";
import VendorInvoicesList from "@/pages/purchasing/invoices/index";
import VendorInvoiceDetail from "@/pages/purchasing/invoices/[id]";
import PurchasingSettings from "@/pages/purchasing/settings/index";

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
