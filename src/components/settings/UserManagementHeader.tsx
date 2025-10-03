import { InviteUserDialog } from "./InviteUserDialog";
import { Users } from "lucide-react";

const UserManagementHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Sistem kullanıcılarını yönetin ve yetkilendirin.
          </p>
        </div>
      </div>

      {/* Sağ taraf - Yeni Kullanıcı Davet Et butonu */}
      <div className="flex items-center gap-3">
        <InviteUserDialog />
      </div>
    </div>
  );
};

export { UserManagementHeader };
export default UserManagementHeader;
