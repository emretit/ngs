import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllAccounts } from "@/hooks/useAccountsData";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { DollarSign, Building, Wallet, CreditCard, Receipt, Calculator, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig } from "@/components/module-dashboard";

const Cashflow = () => {
  const navigate = useNavigate();
  const { data: allAccounts, isLoading: accountsLoading } = useAllAccounts();
  const { categories, loading: categoriesLoading } = useCashflowCategories();

  // Calculate totals - memoized
  const stats = useMemo(() => {
    const totalAccounts = (allAccounts?.cashAccounts?.length || 0) +
      (allAccounts?.bankAccounts?.length || 0) +
      (allAccounts?.creditCards?.length || 0) +
      (allAccounts?.partnerAccounts?.length || 0);

    const totalBalance =
      (allAccounts?.cashAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0) +
      (allAccounts?.bankAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0) +
      (allAccounts?.creditCards?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0) +
      (allAccounts?.partnerAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0);

    const incomeCategories = categories.filter(cat => cat.type === 'income').length;
    const expenseCategories = categories.filter(cat => cat.type === 'expense').length;

    return {
      totalAccounts,
      totalBalance,
      incomeCategories,
      expenseCategories,
      totalCategories: incomeCategories + expenseCategories,
    };
  }, [allAccounts, categories]);

  const cards: QuickLinkCardConfig[] = [
    {
      id: "accounts",
      title: "Hesaplar",
      subtitle: "Banka, kasa, kredi kartı",
      icon: Building,
      color: "blue",
      href: "/cashflow/bank-accounts",
      newButton: {
        href: "/cashflow/bank-accounts",
      },
      stats: [
        { label: "Toplam Hesap", value: stats.totalAccounts },
      ],
      footerStat: {
        label: "Toplam Bakiye",
        value: formatCurrency(stats.totalBalance, 'TRY'),
        color: "success",
      },
    },
    {
      id: "expenses",
      title: "Masraflar",
      subtitle: "Masraf işlemleri",
      icon: Receipt,
      color: "green",
      href: "/cashflow/expenses",
      newButton: {
        href: "/cashflow/expenses",
      },
      stats: [
        { label: "Kategoriler", value: stats.totalCategories },
      ],
      footerStat: {
        label: "Gelir/Gider",
        value: `${stats.incomeCategories}/${stats.expenseCategories}`,
        color: "success",
      },
    },
    {
      id: "budget",
      title: "Bütçe",
      subtitle: "Bütçe yönetimi",
      icon: Calculator,
      color: "purple",
      href: "/cashflow/budget-management",
      newButton: {
        href: "/cashflow/budget-management",
      },
      stats: [
        { label: "Durum", value: "Aktif" },
      ],
      footerStat: {
        label: "Yönetim",
        value: "Açık",
        color: "success",
      },
    },
    {
      id: "checks-notes",
      title: "Çekler/Senetler",
      subtitle: "Çek ve senet takibi",
      icon: Wallet,
      color: "orange",
      href: "/cashflow/checks-notes",
      newButton: {
        href: "/cashflow/checks-notes",
      },
      stats: [
        { label: "Durum", value: "Aktif" },
      ],
      footerStat: {
        label: "Takip",
        value: "Açık",
        color: "success",
      },
    },
    {
      id: "loans",
      title: "Krediler",
      subtitle: "Kredi ve borç yönetimi",
      icon: CreditCard,
      color: "red",
      href: "/cashflow/loans",
      newButton: {
        href: "/cashflow/loans",
      },
      stats: [
        { label: "Durum", value: "Aktif" },
      ],
      footerStat: {
        label: "Yönetim",
        value: "Açık",
        color: "success",
      },
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
