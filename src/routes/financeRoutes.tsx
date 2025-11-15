
import Cashflow from "@/pages/Cashflow";
import CashflowExpenses from "@/pages/CashflowExpenses";
import CashflowLoansAndChecks from "@/pages/CashflowLoansAndChecks";
import CashflowChecksAndNotes from "@/pages/CashflowChecksAndNotes";
import CashflowChecks from "@/pages/CashflowChecks";
import CashflowNotes from "@/pages/CashflowNotes";
import CashflowLoans from "@/pages/CashflowLoans";
import CashflowBankAccounts from "@/pages/CashflowBankAccounts";
import CashflowCategories from "@/pages/CashflowCategories";
import PurchaseInvoices from "@/pages/PurchaseInvoices";
import PurchaseInvoiceDetail from "@/pages/PurchaseInvoiceDetail";
import SalesInvoices from "@/pages/SalesInvoices";
import CreateSalesInvoice from "@/pages/CreateSalesInvoice";
import SalesInvoiceDetail from "@/pages/SalesInvoiceDetail";
import FinancialOverview from "@/pages/FinancialOverview";
import CashAccountDetail from "@/pages/CashAccountDetail";
import CreditCardDetail from "@/pages/CreditCardDetail";
import BankAccountDetail from "@/pages/BankAccountDetail";
import PartnerAccountDetail from "@/pages/PartnerAccountDetail";
import EInvoiceProcess from "@/pages/EInvoiceProcess";
import EInvoices from "@/pages/EInvoices";
import BudgetManagement from "@/pages/BudgetManagement";
import { RouteConfig } from "./types";

// Define cashflow routes
export const cashflowRoutes: RouteConfig[] = [
  { path: "/cashflow", component: Cashflow, protected: true },
  { path: "/cashflow/budget-management", component: BudgetManagement, protected: true },
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
export const financeRoutes: RouteConfig[] = [
  { path: "/financial-overview", component: FinancialOverview, protected: true },
  { path: "/purchase-invoices", component: PurchaseInvoices, protected: true },
  { path: "/purchase-invoices/:id", component: PurchaseInvoiceDetail, protected: true },
  { path: "/sales-invoices", component: SalesInvoices, protected: true },
  { path: "/sales-invoices/create", component: CreateSalesInvoice, protected: true },
  { path: "/sales-invoices/:id", component: SalesInvoiceDetail, protected: true },
  { path: "/e-invoice", component: EInvoices, protected: true },
  { path: "/e-invoice/process/:invoiceId", component: EInvoiceProcess, protected: true },
];
