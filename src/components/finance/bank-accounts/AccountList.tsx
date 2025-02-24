
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, Plus } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";

const AccountList = () => {
  const { data: accounts, isLoading, error } = useBankAccounts();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <h3 className="font-semibold">Banka Hesapları</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span>Hesap Bağla</span>
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Yeni Hesap</span>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">Bir hata oluştu. Lütfen tekrar deneyin.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banka</TableHead>
              <TableHead>Hesap Adı</TableHead>
              <TableHead>Hesap No</TableHead>
              <TableHead>IBAN</TableHead>
              <TableHead>Hesap Türü</TableHead>
              <TableHead>Para Birimi</TableHead>
              <TableHead className="text-right">Bakiye</TableHead>
              <TableHead>Son İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts?.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.bank_name}</TableCell>
                <TableCell>{account.account_name}</TableCell>
                <TableCell>{account.account_number}</TableCell>
                <TableCell>{account.iban}</TableCell>
                <TableCell>{account.account_type}</TableCell>
                <TableCell>{account.currency}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: account.currency
                  }).format(account.current_balance)}
                </TableCell>
                <TableCell>
                  {account.last_transaction_date 
                    ? new Date(account.last_transaction_date).toLocaleDateString('tr-TR')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
            {accounts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                  Henüz banka hesabı bulunmamaktadır.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AccountList;
