import { useState, useEffect, useCallback } from "react";
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
import GlobalSearchDialog from "@/components/GlobalSearchDialog";
import { Calendar, Search, Command } from "lucide-react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  
  const handleProfileClick = () => {
    navigate("/profile");
  };

  const currentDate = format(new Date(), "dd MMM", { locale: tr });
  const currentDay = format(new Date(), "EEEE", { locale: tr });

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      
      <div className="h-14 border-b bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6">
        {/* Left side - User and Company info */}
        <HeaderUserInfo />
        
        {/* Center - Search Button */}
        <Button
          variant="outline"
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 h-9 px-4 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border-border/50 min-w-[200px] lg:min-w-[300px] justify-start"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Hızlı ara...</span>
          <kbd className="ml-auto pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
        
        {/* Mobile - Search Icon Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="sm:hidden h-9 w-9 p-0"
          title="Ara"
        >
          <Search className="h-4 w-4" />
        </Button>
      
        {/* Right side - Actions and User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calendar Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/calendar")}
            className="h-9 w-9 p-0 hover:bg-muted"
            title="Takvim"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          
          <NotificationCenter />
          <LanguageSwitcher />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email || ""}</p>
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
    </>
  );
};

export default TopBar;
