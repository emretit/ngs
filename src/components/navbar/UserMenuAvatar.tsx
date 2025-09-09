
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuAvatarProps {
  user: any | null; // Changed from User to any
  loading: boolean;
  userInitials: string;
}

const UserMenuAvatar = React.forwardRef<HTMLButtonElement, UserMenuAvatarProps>(({ user, loading, userInitials }, ref) => {
  if (loading) {
    return <Button variant="ghost" size="sm" disabled>Yükleniyor...</Button>;
  }

  if (!user) {
    return null;
  }

  return (
    <Button ref={ref} variant="ghost" className="relative rounded-full h-8 w-8 p-0">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{userInitials}</AvatarFallback>
      </Avatar>
    </Button>
  );
});

UserMenuAvatar.displayName = "UserMenuAvatar";

export { UserMenuAvatar };
export default UserMenuAvatar;
