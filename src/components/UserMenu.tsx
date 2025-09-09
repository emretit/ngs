
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UserMenuAvatar from "@/components/navbar/UserMenuAvatar";
import UserMenuContent from "@/components/navbar/UserMenuContent";
import LoginButton from "@/components/navbar/LoginButton";
import { useAuth } from "@/auth/AuthContext";
import { useLogout } from "@/components/navbar/useLogout";

const UserMenu = () => {
  const { user, loading } = useAuth();
  const { handleLogout } = useLogout();
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "";

  if (loading) {
    return <UserMenuAvatar user={null} loading={true} userInitials="" />;
  }

  if (!user) {
    return <LoginButton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserMenuAvatar user={user} loading={false} userInitials={userInitials} />
      </DropdownMenuTrigger>
      <UserMenuContent user={user} onLogout={handleLogout} />
    </DropdownMenu>
  );
};

export default UserMenu;
