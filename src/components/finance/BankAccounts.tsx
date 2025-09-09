
import { useEffect, useState } from "react";
import QuickActions from "./bank-accounts/QuickActions";
import AccountList from "./bank-accounts/AccountList";
import TransactionHistory from "./bank-accounts/TransactionHistory";
import { useBankAccounts } from "@/hooks/useBankAccounts";

const BankAccounts = () => {
  const { data: accounts } = useBankAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    // Set the first account as selected when accounts are loaded
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const selectedAccount = accounts?.find(account => account.id === selectedAccountId);

  if (!accounts || accounts.length === 0) {
    return <div>Hesap bulunamadı</div>;
  }

  return (
    <div className="grid gap-4">
      <AccountList />
      {selectedAccountId && (
        <>
          <TransactionHistory accountId={selectedAccountId} />
          {selectedAccount && <QuickActions account={selectedAccount} />}
        </>
      )}
    </div>
  );
};

export default BankAccounts;

