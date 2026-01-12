import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllAccounts } from "@/hooks/useAccountsData";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { DollarSign, Building, Wallet, CreditCard, Receipt, Calculator } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig, CardSummaryProps } from "@/components/module-dashboard";

const Cashflow = () => {
  const navigate = useNavigate();
  const { data: allAccounts, isLoading: accountsLoading } = useAllAccounts();
  const { categories, loading: categoriesLoading } = useCashflowCategories();

  // Calculate totals - memoized
  const stats = useMemo(() => {
    const cashCount = allAccounts?.cashAccounts?.length || 0;
    const bankCount = allAccounts?.bankAccounts?.length || 0;
    const cardCount = allAccounts?.creditCards?.length || 0;
    const partnerCount = allAccounts?.partnerAccounts?.length || 0;

    const cashBalance = allAccounts?.cashAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;
    const bankBalance = allAccounts?.bankAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;
    const cardBalance = allAccounts?.creditCards?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;
    const partnerBalance = allAccounts?.partnerAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

    const totalAccounts = cashCount + bankCount + cardCount + partnerCount;
    const totalBalance = cashBalance + bankBalance + cardBalance + partnerBalance;

    const incomeCategories = categories.filter(cat => cat.type === 'income').length;
    const expenseCategories = categories.filter(cat => cat.type === 'expense').length;

    return {
      totalAccounts,
      totalBalance,
      cashCount,
      bankCount,
      cardCount,
      partnerCount,
      cashBalance,
      bankBalance,
      cardBalance,
      partnerBalance,
      incomeCategories,
      expenseCategories,
      totalCategories: incomeCategories + expenseCategories,
    };
  }, [allAccounts, categories]);

  // CardSummary configurations
  const accountsSummary: CardSummaryProps = {
    mainMetric: { value: stats.totalAccounts, label: "Toplam Hesap", color: "blue" },
    statusGrid: [
      { label: "Kasa", value: stats.cashCount, color: "green" },
      { label: "Banka", value: stats.bankCount, color: "blue" },
      { label: "Kredi Kartı", value: stats.cardCount, color: "orange" },
      { label: "Ortaklık", value: stats.partnerCount, color: "purple" },
    ],
    footer: {
      type: "value",
      valueLabel: "Toplam Bakiye",
      value: formatCurrency(stats.totalBalance, 'TRY'),
      valueColor: "success",
    },
    compact: true,
    gridCols: 2,
  };

  const expensesSummary: CardSummaryProps = {
    mainMetric: { value: stats.totalCategories, label: "Toplam Kategori", color: "green" },
    statusGrid: [
      { label: "Gelir", value: stats.incomeCategories, color: "green" },
      { label: "Gider", value: stats.expenseCategories, color: "red" },
    ],
    footer: {
      type: "progress",
      progressLabel: "Gelir Oranı",
      progressValue: stats.totalCategories > 0 
        ? Math.round((stats.incomeCategories / stats.totalCategories) * 100) 
        : 0,
      progressColor: "green",
    },
    compact: true,
    gridCols: 2,
  };

  const budgetSummary: CardSummaryProps = {
    mainMetric: { value: "Aktif", label: "Bütçe Durumu", color: "purple" },
    statusGrid: [
      { label: "Planlanan", value: "-", color: "blue" },
      { label: "Gerçekleşen", value: "-", color: "green" },
    ],
    compact: true,
    gridCols: 2,
  };

  const checksSummary: CardSummaryProps = {
    mainMetric: { value: "-", label: "Toplam Çek/Senet", color: "orange" },
    statusGrid: [
      { label: "Bekleyen", value: "-", color: "yellow" },
      { label: "Tahsil", value: "-", color: "green" },
    ],
    compact: true,
    gridCols: 2,
  };

  const loansSummary: CardSummaryProps = {
    mainMetric: { value: "-", label: "Aktif Kredi", color: "red" },
    statusGrid: [
      { label: "Ödenen", value: "-", color: "green" },
      { label: "Kalan", value: "-", color: "red" },
    ],
    compact: true,
    gridCols: 2,
  };

  const cards: QuickLinkCardConfig[] = [
    {
      id: "accounts",
      title: "Hesaplar",
      subtitle: "Banka, kasa, kredi kartı",
      icon: Building,
      color: "blue",
      href: "/cashflow/bank-accounts",
      newButton: { href: "/cashflow/bank-accounts" },
      summaryConfig: accountsSummary,
    },
    {
      id: "expenses",
      title: "Masraflar",
      subtitle: "Masraf işlemleri",
      icon: Receipt,
      color: "green",
      href: "/cashflow/expenses",
      newButton: { href: "/cashflow/expenses" },
      summaryConfig: expensesSummary,
    },
    {
      id: "budget",
      title: "Bütçe",
      subtitle: "Bütçe yönetimi",
      icon: Calculator,
      color: "purple",
      href: "/cashflow/budget-management",
      newButton: { href: "/cashflow/budget-management" },
      summaryConfig: budgetSummary,
    },
    {
      id: "checks-notes",
      title: "Çekler/Senetler",
      subtitle: "Çek ve senet takibi",
      icon: Wallet,
      color: "orange",
      href: "/cashflow/checks-notes",
      newButton: { href: "/cashflow/checks-notes" },
      summaryConfig: checksSummary,
    },
    {
      id: "loans",
      title: "Krediler",
      subtitle: "Kredi ve borç yönetimi",
      icon: CreditCard,
      color: "red",
      href: "/cashflow/loans",
      newButton: { href: "/cashflow/loans" },
      summaryConfig: loansSummary,
    },
  ];

  const config: ModuleDashboardConfig = {
    header: {
      title: "Nakit Akış Yönetimi",
      subtitle: "Tüm nakit akışı işlemlerinizi takip edin ve yönetin",
      icon: DollarSign,
    },
    cards,
  };

  const loading = accountsLoading || categoriesLoading;

  return <ModuleDashboard config={config} isLoading={loading} gridCols={4} />;
};

export default memo(Cashflow);
