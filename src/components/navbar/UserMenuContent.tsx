
import { useNavigate } from "react-router-dom";
import { User as UserIcon, LogOut, Settings, Building2 } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface UserMenuContentProps {
  user: any; // Changed from User to any
  onLogout: () => void;
}

const UserMenuContent = ({ user, onLogout }: UserMenuContentProps) => {
  const navigate = useNavigate();
  const isPrimaryAccount = user.user_metadata?.is_primary_account === true;
  const companyName = user.user_metadata?.company_name;

  return (
    <DropdownMenuContent align="end" className="w-56">
      <div className="flex flex-col p-2">
        <div className="flex items-center justify-start gap-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.user_metadata?.full_name && (
              <p className="font-medium">{user.user_metadata.full_name}</p>
            )}
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        {isPrimaryAccount && companyName && (
          <div className="mt-2 pt-2 border-t border-border flex items-center text-sm text-muted-foreground">
            <Building2 className="mr-2 h-3 w-3" />
            <span>{companyName} (Yönetici)</span>
          </div>
        )}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate("/profile")}>
        <UserIcon className="mr-2 h-4 w-4" />
        <span>Profil</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate("/settings")}>
        <Settings className="mr-2 h-4 w-4" />
        <span>Ayarlar</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Çıkış Yap</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

export default UserMenuContent;
