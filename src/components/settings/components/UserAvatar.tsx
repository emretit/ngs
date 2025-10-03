
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserWithRoles } from "../types";

type UserAvatarProps = {
  user: UserWithRoles;
  size?: 'sm' | 'md' | 'lg';
};

export const UserAvatar = ({ user, size = 'md' }: UserAvatarProps) => {
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

  const avatarSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm';
  const gapSize = size === 'sm' ? 'gap-2' : size === 'lg' ? 'gap-4' : 'gap-3';

  return (
    <div className={`flex items-center ${gapSize}`}>
      <Avatar className={avatarSize}>
        <AvatarImage src={user.avatar_url || ''} />
        <AvatarFallback className="text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className={`font-medium ${textSize}`}>
        {user.full_name || 'İsimsiz Kullanıcı'}
      </div>
    </div>
  );
};
