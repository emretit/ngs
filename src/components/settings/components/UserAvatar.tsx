
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserWithRoles } from "../types";

type UserAvatarProps = {
  user: UserWithRoles;
};

export const UserAvatar = ({ user }: UserAvatarProps) => {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={user.avatar_url || ''} />
        <AvatarFallback>
          {user.first_name?.[0]}{user.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium">
          {user.first_name} {user.last_name}
        </div>
      </div>
    </div>
  );
};
