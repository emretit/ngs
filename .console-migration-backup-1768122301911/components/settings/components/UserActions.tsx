
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserWithRoles } from "../types";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

type UserActionsProps = {
  user?: UserWithRoles;
  userId?: string;
  onResetPassword?: () => void;
  onDeactivate?: () => void;
};

export const UserActions = ({ user, userId, onResetPassword, onDeactivate }: UserActionsProps) => {
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivateClick = () => {
    setIsDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    setIsDeactivating(true);
    try {
      onDeactivate?.();
    } catch (error) {
      console.error('Error deactivating user:', error);
    } finally {
      setIsDeactivating(false);
      setIsDeactivateDialogOpen(false);
    }
  };

  const handleDeactivateCancel = () => {
    setIsDeactivateDialogOpen(false);
  };

  return (
    <>
      <div className="space-x-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onResetPassword}
        >
          Şifre Sıfırla
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:text-red-700"
          onClick={handleDeactivateClick}
        >
          Devre Dışı Bırak
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
        title="Kullanıcıyı Devre Dışı Bırak"
        description="Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?"
        confirmText="Devre Dışı Bırak"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeactivateConfirm}
        onCancel={handleDeactivateCancel}
        isLoading={isDeactivating}
      />
    </>
  );
};
