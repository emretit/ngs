import { UserViewToggle, UserViewType } from "./UserViewToggle";
import { InviteUserDialog } from "./InviteUserDialog";
import { Users, UserPlus } from "lucide-react";

interface UserManagementHeaderProps {
  activeView: UserViewType;
  setActiveView: (view: UserViewType) => void;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

const UserManagementHeader = ({
  activeView,
  setActiveView,
  totalUsers,
  activeUsers,
  inactiveUsers
}: UserManagementHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık ve istatistikler */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Kullanıcı Yönetimi</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Toplam: <span className="font-medium text-foreground">{totalUsers}</span></span>
            <span>•</span>
            <span className="text-green-600">Aktif: <span className="font-medium">{activeUsers}</span></span>
            <span>•</span>
            <span className="text-red-600">Pasif: <span className="font-medium">{inactiveUsers}</span></span>
          </div>
        </div>
      </div>

      {/* Sağ taraf - Toggle ve aksiyonlar */}
      <div className="flex items-center gap-3">
        <UserViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <InviteUserDialog />
      </div>
    </div>
  );
};

export { UserManagementHeader };
export default UserManagementHeader;
