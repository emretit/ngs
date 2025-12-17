import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plus, 
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import BankAccountModal from "./modals/BankAccountModal";
import { useBankAccounts } from "@/hooks/useAccountsData";
import { useDeleteBankAccount } from "@/hooks/useBankAccounts";
import AccountsSkeleton from "./AccountsSkeleton";
import { toast } from "sonner";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  is_active: boolean;
}

interface BankAccountsProps {
  showBalances: boolean;
}

const BankAccountsSimple = ({ showBalances }: BankAccountsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { data: bankAccounts = [], isLoading, refetch } = useBankAccounts();
  const { deleteData } = useDeleteBankAccount();

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'vadesiz': 'Vadesiz',
      'vadeli': 'Vadeli',
      'kredi': 'Kredi',
      'pos': 'POS'
    };
    return types[type] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'vadesiz': 'bg-blue-100 text-blue-800',
      'vadeli': 'bg-green-100 text-green-800',
      'kredi': 'bg-red-100 text-red-800',
      'pos': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleAccountClick = (accountId: string) => {
    navigate(`/cashflow/bank-accounts/${accountId}`);
  };

  const handleModalSuccess = () => {
    refetch();
    setIsModalOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    setAccountToEdit(accountId);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setAccountToEdit(null);
    refetch();
  };

  const handleDelete = (e: React.MouseEvent, accountId: string, accountName: string) => {
    e.stopPropagation();
    setAccountToDelete({ id: accountId, name: accountName });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteData(accountToDelete.id);
      toast.success("Banka hesabı başarıyla silindi");
      refetch();
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (error: any) {
      toast.error("Hesap silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const totalBankBalance = bankAccounts.reduce((sum, account) => {
    if (account.currency === 'TRY') {
      return sum + (account.current_balance || 0);
    }
    return sum;
  }, 0);

  const activeAccounts = bankAccounts.filter(acc => acc.is_active).length;

  if (isLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="space-y-4">


      {/* Accounts List */}
      <div className="space-y-3">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Building2 className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz banka hesabı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk banka hesabınızı ekleyin</p>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Yeni
            </Button>
          </div>
        ) : (
          bankAccounts.map((account) => (
            <div 
              key={account.id} 
              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handleAccountClick(account.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                  <Building2 className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{account.account_name}</div>
                  <div className="text-xs text-gray-600">
                    {account.bank_name} • {getAccountTypeLabel(account.account_type)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
                  </div>
                  <Badge className={`text-xs ${getAccountTypeColor(account.account_type)}`}>
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => handleEdit(e, account.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => handleDelete(e, account.id, account.account_name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BankAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <BankAccountModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setAccountToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        mode="edit"
        accountId={accountToEdit || undefined}
      />

      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Banka Hesabını Sil"
        description={`"${accountToDelete?.name || 'Bu hesap'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BankAccountsSimple;
