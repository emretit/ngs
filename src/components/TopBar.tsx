
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLogout } from "@/components/navbar/useLogout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import HeaderUserInfo from "@/components/HeaderUserInfo";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleLogout } = useLogout();
  const { userData, displayName, userInitials } = useCurrentUser();
  
  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="h-16 border-b bg-card flex items-center justify-between px-6">
      {/* Left side - User and Company info */}
      <HeaderUserInfo />
      
      {/* Right side - Actions and User Menu */}
      <div className="flex items-center gap-4">
        <NotificationCenter />
        <LanguageSwitcher />
        <Separator orientation="vertical" className="h-8" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar>
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleProfileClick}>Profilim</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>Ayarlar</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onSelect={handleLogout}>Çıkış Yap</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopBar;
