
import { Button } from "@/components/ui/button";
import { UserWithRoles } from "../types";

type UserActionsProps = {
  user?: UserWithRoles;
  userId?: string;
  onResetPassword?: () => void;
  onDeactivate?: () => void;
};

export const UserActions = ({ user, userId, onResetPassword, onDeactivate }: UserActionsProps) => {
  return (
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
        onClick={() => {
          if (window.confirm('Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?')) {
            onDeactivate?.();
          }
        }}
      >
        Devre Dışı Bırak
      </Button>
    </div>
  );
};
