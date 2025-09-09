
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserWithRoles } from "../types";

type UserAvatarProps = {
  user: UserWithRoles;
};

export const UserAvatar = ({ user }: UserAvatarProps) => {
  // Split full_name into first and last name for display
  const nameParts = user.full_name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Generate initials from full name
  const initials = user.full_name
    ?.split(' ')
    .filter(name => name.length > 0)
    .map(name => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={user.avatar_url || ''} />
        <AvatarFallback>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium">
          {user.full_name || 'İsimsiz Kullanıcı'}
        </div>
        {user.email && (
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
        )}
      </div>
    </div>
  );
};
