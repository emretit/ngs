import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PartnerAccountModal from "./modals/PartnerAccountModal";
import { usePartnerAccounts, useDeletePartnerAccount } from "@/hooks/useAccountsData";
import AccountsSkeleton from "./AccountsSkeleton";
import { toast } from "sonner";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: "ortak" | "hisse_sahibi" | "yatirimci";
  ownership_percentage: number;
  initial_capital: number;
  current_balance: number;
  profit_share: number;
  last_profit_distribution: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PartnerAccountsProps {
  showBalances: boolean;
}

const PartnerAccounts = ({ showBalances }: PartnerAccountsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { data: partnerAccounts = [], isLoading, refetch } = usePartnerAccounts();
  const { deleteAccount } = useDeletePartnerAccount();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getPartnerTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'ortak': 'Ortak',
      'hisse_sahibi': 'Hisse Sahibi',
      'yatirimci': 'Yatırımcı'
    };
    return types[type] || type;
  };

  const getPartnerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ortak': 'bg-blue-100 text-blue-800',
      'hisse_sahibi': 'bg-green-100 text-green-800',
      'yatirimci': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handlePartnerClick = (partnerId: string) => {
    navigate(`/cashflow/partner-accounts/${partnerId}`);
  };

  const handleModalSuccess = () => {
    refetch();
    setIsModalOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, partnerId: string) => {
    e.stopPropagation();
    setPartnerToEdit(partnerId);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setPartnerToEdit(null);
    refetch();
  };

  const handleDelete = (e: React.MouseEvent, partnerId: string, partnerName: string) => {
    e.stopPropagation();
    setPartnerToDelete({ id: partnerId, name: partnerName });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount(partnerToDelete.id);
      toast.success("Ortak hesabı başarıyla silindi");
      refetch();
      setIsDeleteDialogOpen(false);
      setPartnerToDelete(null);
    } catch (error: any) {
      toast.error("Hesap silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setPartnerToDelete(null);
  };

  const totalCapital = partnerAccounts.reduce((sum, partner) => sum + partner.initial_capital, 0);
  const totalCurrentBalance = partnerAccounts.reduce((sum, partner) => sum + partner.current_balance, 0);
  const totalProfitShare = partnerAccounts.reduce((sum, partner) => sum + partner.profit_share, 0);
  const totalOwnership = partnerAccounts.reduce((sum, partner) => sum + partner.ownership_percentage, 0);

  if (isLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="space-y-4">


      {/* Partners List */}
      <div className="space-y-3">
        {partnerAccounts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz ortak hesabı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk ortak hesabınızı oluşturun</p>
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Yeni
            </Button>
          </div>
        ) : (
          partnerAccounts.map((partner) => (
            <div 
              key={partner.id} 
              className="flex items-center justify-between p-2 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handlePartnerClick(partner.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500 rounded-lg text-white">
                  <Users className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{partner.partner_name}</div>
                  <div className="text-xs text-gray-600">
                    %{partner.ownership_percentage} hisse • {getPartnerTypeLabel(partner.partner_type)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(partner.current_balance, partner.currency) : "••••••"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Kar: {showBalances ? formatCurrency(partner.profit_share, partner.currency) : "••••••"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => handleEdit(e, partner.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => handleDelete(e, partner.id, partner.partner_name)}
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

      <PartnerAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <PartnerAccountModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setPartnerToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        mode="edit"
        accountId={partnerToEdit || undefined}
      />

      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Ortak Hesabını Sil"
        description={`"${partnerToDelete?.name || 'Bu hesap'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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

export default PartnerAccounts;
