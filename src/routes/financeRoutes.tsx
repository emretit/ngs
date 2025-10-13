
import Cashflow from "@/pages/Cashflow";
import CashflowOpexEntry from "@/pages/CashflowOpexEntry";
import CashflowExpenses from "@/pages/CashflowExpenses";
import CashflowLoansAndChecks from "@/pages/CashflowLoansAndChecks";
import CashflowBankAccounts from "@/pages/CashflowBankAccounts";
import CashflowCategoriesWrapper from "@/pages/CashflowCategoriesWrapper";
import PurchaseInvoices from "@/pages/PurchaseInvoices";
import SalesInvoices from "@/pages/SalesInvoices";
import CreateSalesInvoice from "@/pages/CreateSalesInvoice";
import SalesInvoiceDetail from "@/pages/SalesInvoiceDetail";
import FinancialOverview from "@/pages/FinancialOverview";
import CashAccountDetail from "@/pages/CashAccountDetail";
import CreditCardDetail from "@/pages/CreditCardDetail";
import BankAccountDetail from "@/pages/BankAccountDetail";
import PartnerAccountDetail from "@/pages/PartnerAccountDetail";
import TransferHistory from "@/pages/TransferHistory";
import EInvoiceProcess from "@/pages/EInvoiceProcess";
import EInvoices from "@/pages/EInvoices";
import { RouteConfig } from "./types";

// Define cashflow routes
export const cashflowRoutes: RouteConfig[] = [
  { path: "/cashflow", component: Cashflow, protected: true },
  { path: "/cashflow/opex-entry", component: CashflowOpexEntry, protected: true },
  { path: "/cashflow/expenses", component: CashflowExpenses, protected: true },
  { path: "/cashflow/loans-and-checks", component: CashflowLoansAndChecks, protected: true },
  { path: "/cashflow/bank-accounts", component: CashflowBankAccounts, protected: true },
  { path: "/cashflow/categories", component: CashflowCategoriesWrapper, protected: true },
  { path: "/cashflow/transfers", component: TransferHistory, protected: true },
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
  { path: "/sales-invoices", component: SalesInvoices, protected: true },
  { path: "/sales-invoices/create", component: CreateSalesInvoice, protected: true },
  { path: "/sales-invoices/:id", component: SalesInvoiceDetail, protected: true },
  { path: "/purchase/e-invoice", component: EInvoices, protected: true },
  { path: "/purchase/e-invoice/process/:invoiceId", component: EInvoiceProcess, protected: true },
];
