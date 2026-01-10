import { useState, useMemo, memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import AccountsSkeleton from "../AccountsSkeleton";
import { AccountCardBase } from "./AccountCardBase";
import type { AccountListBaseProps, BaseAccount } from "./types";
import { getAccountTheme } from "./theme.config";

/**
 * Account List Base Component
 * Generic list component for all account types
 * Combines header, cards, and modals with state management
 */
export function AccountListBase<TAccount extends BaseAccount>({
  accountType,
  useAccounts,
  useDeleteAccount,
  showBalances,
  title,
  subtitle,
  statBadges,
  cardFields,
  onAccountClick,
  detailPath,
  modals,
  addButtonLabel = "Yeni",
  emptyStateMessage = "Henüz hesap yok",
  renderHeader,
}: AccountListBaseProps<TAccount> & {
  renderHeader: (accounts: TAccount[], showBalances: boolean, onAddNew: () => void) => React.ReactNode;
}) {
  const theme = getAccountTheme(accountType);
  const Icon = theme.icon;

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  // Data fetching
  const { data: accounts = [], isLoading, refetch } = useAccounts();
  const deleteMutation = useDeleteAccount();

  // Handlers
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

    try {
      await deleteMutation.mutateAsync(accountToDelete.id);
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleAccountClick = (accountId: string) => {
    onAccountClick(accountId);
  };

  // Loading state
  if (isLoading) {
    return <AccountsSkeleton />;
  }

  // Render
  return (
    <div className="space-y-4">
      {/* Header - Custom render function for totals */}
      {renderHeader(accounts, showBalances, () => setIsModalOpen(true))}

      {/* Accounts List */}
      <div className="space-y-2">
        {accounts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-4 text-muted-foreground">
            <Icon className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">{emptyStateMessage}</p>
            <p className="text-xs text-gray-500 mb-2">İlk hesabınızı oluşturun</p>
            <Button
              size="sm"
              className={cn(
                "text-white text-xs px-2 py-1",
                theme.primaryColor === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                theme.primaryColor === 'green' ? 'bg-green-600 hover:bg-green-700' :
                theme.primaryColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                theme.primaryColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
              )}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {addButtonLabel}
            </Button>
          </div>
        ) : (
          /* Account Cards */
          accounts.map((account) => (
            <AccountCardBase
              key={account.id}
              account={account}
              accountType={accountType}
              showBalances={showBalances}
              title={title(account)}
              subtitle={subtitle(account)}
              statBadges={statBadges(account)}
              fields={cardFields(account)}
              onClick={() => handleAccountClick(account.id)}
              onEdit={(e) => handleEdit(e, account.id)}
              onDelete={(e) => handleDelete(e, account.id, title(account))}
            />
          ))
        )}
      </div>

      {/* Create Modal */}
      <modals.create
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Modal */}
      <modals.edit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        mode="edit"
        accountId={accountToEdit || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={(open) => { if (!open) handleDeleteCancel(); }}
        onConfirm={handleDeleteConfirm}
        title="Hesabı Sil"
        description={`"${accountToDelete?.name}" hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  );
}
