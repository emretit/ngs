
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { BankAccount } from "@/hooks/useBankAccounts";
import TransactionHistory from "./TransactionHistory";
import QuickActions from "./QuickActions";

const AccountDetails = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { id } = useParams();

  const { data: account, isLoading } = useQuery({
    queryKey: ["bank-account", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!account) {
    return <div>Hesap bulunamadı</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
      }`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {account.account_name}
              </h1>
              <p className="text-sm text-gray-500">{account.bank_name}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {account.current_balance.toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: account.currency
                })}
              </div>
              <p className="text-sm text-gray-500">Mevcut Bakiye</p>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions account={account} />

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">İşlem Geçmişi</h2>
            <TransactionHistory accountId={account.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountDetails;

