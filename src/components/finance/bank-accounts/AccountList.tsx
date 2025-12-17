
import { useNavigate } from "react-router-dom";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { NewBankAccountForm } from "./NewBankAccountForm";

const AccountList = () => {
  const navigate = useNavigate();
  const { data: accounts, isLoading, error } = useBankAccounts();
  const [isNewAccountSheetOpen, setIsNewAccountSheetOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <h3 className="font-semibold">Banka Hesapları</h3>
        {accounts && accounts.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span>Hesap Bağla</span>
            </Button>
            
            <Sheet open={isNewAccountSheetOpen} onOpenChange={setIsNewAccountSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Yeni Hesap</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Yeni Banka Hesabı</SheetTitle>
                </SheetHeader>
                <NewBankAccountForm onSuccess={() => setIsNewAccountSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        )}
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
              <TableRow 
                key={account.id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/finance/accounts/${account.id}`)}
              >
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
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-gray-500">
                      <p className="text-sm font-medium mb-1">Henüz banka hesabı bulunmamaktadır.</p>
                      <p className="text-xs text-gray-400">İlk banka hesabınızı ekleyerek başlayın</p>
                    </div>
                    <Sheet open={isNewAccountSheetOpen} onOpenChange={setIsNewAccountSheetOpen}>
                      <SheetTrigger asChild>
                        <Button 
                          size="sm" 
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Yeni Hesap</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-xl">
                        <SheetHeader>
                          <SheetTitle>Yeni Banka Hesabı</SheetTitle>
                        </SheetHeader>
                        <NewBankAccountForm onSuccess={() => setIsNewAccountSheetOpen(false)} />
                      </SheetContent>
                    </Sheet>
                  </div>
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
