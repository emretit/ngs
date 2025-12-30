import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreditCardModal from "./modals/CreditCardModal";
import { useCreditCards, useDeleteCreditCard } from "@/hooks/useAccountsData";
import AccountsSkeleton from "./AccountsSkeleton";
import { toast } from "sonner";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface CreditCardAccount {
  id: string;
  card_name: string;
  card_number: string;
  bank_name: string;
  card_type: "credit" | "debit" | "corporate";
  credit_limit: number;
  current_balance: number;
  available_limit: number;
  currency: string;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreditCardsProps {
  showBalances: boolean;
}

const CreditCards = ({ showBalances }: CreditCardsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { data: creditCards = [], isLoading, refetch } = useCreditCards();
  const { deleteCard } = useDeleteCreditCard();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCardNumber = (number: string | null | undefined) => {
    if (!number) return "";
    // Sadece rakamları al
    const numbers = number.replace(/\D/g, '');
    if (!numbers) return "";
    // 4'lü gruplar halinde formatla
    return numbers.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  const getCardTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'credit': 'Kredi Kartı',
      'debit': 'Banka Kartı',
      'corporate': 'Kurumsal Kart'
    };
    return types[type] || type;
  };

  const getCardTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'credit': 'bg-blue-100 text-blue-800',
      'debit': 'bg-green-100 text-green-800',
      'corporate': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleCardClick = (cardId: string) => {
    navigate(`/cashflow/credit-cards/${cardId}`);
  };

  const handleModalSuccess = () => {
    refetch();
    setIsModalOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    setCardToEdit(cardId);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setCardToEdit(null);
    refetch();
  };

  const handleDelete = (e: React.MouseEvent, cardId: string, cardName: string) => {
    e.stopPropagation();
    setCardToDelete({ id: cardId, name: cardName });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteCard(cardToDelete.id);
      toast.success("Kredi kartı başarıyla silindi");
      refetch();
      setIsDeleteDialogOpen(false);
      setCardToDelete(null);
    } catch (error: any) {
      toast.error("Kart silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setCardToDelete(null);
  };

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const totalCurrentBalance = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalAvailableLimit = creditCards.reduce((sum, card) => sum + card.available_limit, 0);

  if (isLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="space-y-4">


      {/* Compact Cards List */}
      <div className="space-y-2">
        {creditCards.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz kredi kartı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk kredi kartınızı ekleyin</p>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Yeni
            </Button>
          </div>
        ) : (
          creditCards.map((card) => (
            <div 
              key={card.id} 
              className="flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handleCardClick(card.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500 rounded-lg text-white">
                  <CreditCard className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{card.card_name}</div>
                  <div className="text-xs text-gray-600">
                    {card.bank_name}{card.card_number ? ` • ${formatCardNumber(card.card_number)}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(card.available_limit, card.currency) : "••••••"}
                  </div>
                  <div className="text-xs text-gray-500">
                    / {showBalances ? formatCurrency(card.credit_limit, card.currency) : "••••••"}
                  </div>
                  <div className="w-12 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-purple-500 h-1 rounded-full transition-all duration-300" 
                      style={{width: `${(card.current_balance / card.credit_limit) * 100}%`}}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => handleEdit(e, card.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => handleDelete(e, card.id, card.card_name)}
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

      <CreditCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <CreditCardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCardToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        mode="edit"
        cardId={cardToEdit || undefined}
      />

      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Kredi Kartını Sil"
        description={`"${cardToDelete?.name || 'Bu kart'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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

export default CreditCards;
