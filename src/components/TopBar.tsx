
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLogout } from "@/components/navbar/useLogout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import HeaderUserInfo from "@/components/HeaderUserInfo";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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

  const currentDate = format(new Date(), "dd MMM", { locale: tr });
  const currentDay = format(new Date(), "EEEE", { locale: tr });

  return (
    <div className="h-16 border-b bg-card flex items-center justify-between px-6">
      {/* Left side - User and Company info */}
      <HeaderUserInfo />
      
      {/* Center - Date and Calendar Button */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {currentDate}
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400 hidden lg:inline">
          {currentDay}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/calendar")}
          className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
          title="Takvimi Aç"
        >
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
      </div>
      
      {/* Mobile - Only Calendar Button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/calendar")}
          className="h-8 w-8 p-0"
          title="Takvimi Aç"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
      
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
