import React from "react";
import { RouteConfig } from "./types";

// Lazy load all finance pages
const Cashflow = React.lazy(() => import("@/pages/Cashflow"));
const CashflowExpenses = React.lazy(() => import("@/pages/CashflowExpenses"));
const CashflowLoansAndChecks = React.lazy(() => import("@/pages/CashflowLoansAndChecks"));
const CashflowChecksAndNotes = React.lazy(() => import("@/pages/CashflowChecksAndNotes"));
const CashflowChecks = React.lazy(() => import("@/pages/CashflowChecks"));
const CashflowNotes = React.lazy(() => import("@/pages/CashflowNotes"));
const CashflowLoans = React.lazy(() => import("@/pages/CashflowLoans"));
const CashflowBankAccounts = React.lazy(() => import("@/pages/CashflowBankAccounts"));
const CashflowCategories = React.lazy(() => import("@/pages/CashflowCategories"));
const PurchaseInvoices = React.lazy(() => import("@/pages/PurchaseInvoices"));
const PurchaseInvoiceDetail = React.lazy(() => import("@/pages/PurchaseInvoiceDetail"));
const SalesInvoices = React.lazy(() => import("@/pages/SalesInvoices"));
const CreateSalesInvoice = React.lazy(() => import("@/pages/CreateSalesInvoice"));
const SalesInvoiceDetail = React.lazy(() => import("@/pages/SalesInvoiceDetail"));
const FinancialOverview = React.lazy(() => import("@/pages/FinancialOverview"));
const CashAccountDetail = React.lazy(() => import("@/pages/CashAccountDetail"));
const CreditCardDetail = React.lazy(() => import("@/pages/CreditCardDetail"));
const BankAccountDetail = React.lazy(() => import("@/pages/BankAccountDetail"));
const PartnerAccountDetail = React.lazy(() => import("@/pages/PartnerAccountDetail"));
const EInvoiceProcess = React.lazy(() => import("@/pages/EInvoiceProcess"));
const EInvoices = React.lazy(() => import("@/pages/EInvoices"));
const BudgetEntry = React.lazy(() => import("@/pages/budget/BudgetEntry"));
const BudgetComparison = React.lazy(() => import("@/pages/budget/BudgetComparison"));
const BudgetApprovals = React.lazy(() => import("@/pages/budget/BudgetApprovals"));
const BudgetReports = React.lazy(() => import("@/pages/budget/BudgetReports"));
const BudgetDashboard = React.lazy(() => import("@/pages/budget/BudgetDashboard"));

// Define cashflow routes
export const cashflowRoutes: RouteConfig[] = [
  { path: "/cashflow", component: Cashflow, protected: true },
  // BudgetManagement route'u kaldırıldı, artık BudgetDashboard kullanılıyor
  { path: "/cashflow/budget-management", component: BudgetDashboard, protected: true },
  { path: "/budget", component: BudgetDashboard, protected: true },
  { path: "/budget/entry", component: BudgetEntry, protected: true },
  { path: "/budget/comparison", component: BudgetComparison, protected: true },
  { path: "/budget/approvals", component: BudgetApprovals, protected: true },
  { path: "/budget/reports", component: BudgetReports, protected: true },
  { path: "/cashflow/expenses", component: CashflowExpenses, protected: true },
  // Yeni ayrı route'lar
  { path: "/cashflow/checks", component: CashflowChecks, protected: true },
  { path: "/cashflow/notes", component: CashflowNotes, protected: true },
  // Backward compatibility: eski combined route
  { path: "/cashflow/checks-notes", component: CashflowChecksAndNotes, protected: true },
  { path: "/cashflow/loans", component: CashflowLoans, protected: true },
  // Backward compatibility (optional): keep the old combined route
  { path: "/cashflow/loans-and-checks", component: CashflowLoansAndChecks, protected: true },
  { path: "/cashflow/bank-accounts", component: CashflowBankAccounts, protected: true },
  { path: "/cashflow/categories", component: CashflowCategories, protected: true },
  // Account detail routes
  { path: "/cashflow/cash-accounts/:id", component: CashAccountDetail, protected: true },
  { path: "/cashflow/credit-cards/:id", component: CreditCardDetail, protected: true },
  { path: "/cashflow/bank-accounts/:id", component: BankAccountDetail, protected: true },
  { path: "/cashflow/partner-accounts/:id", component: PartnerAccountDetail, protected: true },
];

// Define finance routes (keeping existing purchase/sales invoice routes)
// NOT: Daha spesifik rotalar önce gelmeli (React Router v6 için önemli)
export const financeRoutes: RouteConfig[] = [
  { path: "/financial-overview", component: FinancialOverview, protected: true },
  { path: "/purchase-invoices/:id", component: PurchaseInvoiceDetail, protected: true },
  { path: "/purchase-invoices", component: PurchaseInvoices, protected: true },
  { path: "/sales-invoices/create", component: CreateSalesInvoice, protected: true },
  { path: "/sales-invoices/:id", component: SalesInvoiceDetail, protected: true },
  { path: "/sales-invoices", component: SalesInvoices, protected: true }, // En son base route
  { path: "/e-invoice/process/:invoiceId", component: EInvoiceProcess, protected: true },
  { path: "/e-invoice", component: EInvoices, protected: true },
];
