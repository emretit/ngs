
import Cashflow from "@/pages/Cashflow";
import CashflowCategoriesWrapper from "@/pages/CashflowCategoriesWrapper";
import PurchaseInvoices from "@/pages/PurchaseInvoices";
import SalesInvoices from "@/pages/SalesInvoices";
import CreateSalesInvoice from "@/pages/CreateSalesInvoice";
import SalesInvoiceDetail from "@/pages/SalesInvoiceDetail";
import FinancialOverview from "@/pages/FinancialOverview";
import { RouteConfig } from "./types";

// Define cashflow routes
export const cashflowRoutes: RouteConfig[] = [
  { path: "/cashflow", component: Cashflow, protected: true },
  
  { path: "/cashflow/opex-entry", component: Cashflow, protected: true },
  { path: "/cashflow/expenses", component: Cashflow, protected: true },
  { path: "/cashflow/employee-costs", component: Cashflow, protected: true },
  { path: "/cashflow/loans-and-checks", component: Cashflow, protected: true },
  { path: "/cashflow/invoices", component: Cashflow, protected: true },
  { path: "/cashflow/bank-accounts", component: Cashflow, protected: true },
  { path: "/cashflow/categories", component: CashflowCategoriesWrapper, protected: true },
];

// Define finance routes (keeping existing purchase/sales invoice routes)
export const financeRoutes: RouteConfig[] = [
  { path: "/financial-overview", component: FinancialOverview, protected: true },
  { path: "/purchase-invoices", component: PurchaseInvoices, protected: true },
  { path: "/sales-invoices", component: SalesInvoices, protected: true },
  { path: "/sales-invoices/create", component: CreateSalesInvoice, protected: true },
  { path: "/sales-invoices/:id", component: SalesInvoiceDetail, protected: true },
];
