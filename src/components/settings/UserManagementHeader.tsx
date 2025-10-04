import { InviteUserDialog } from "./InviteUserDialog";
import { Users } from "lucide-react";

const UserManagementHeader = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Kullanıcı Yönetimi
              </h1>
              <p className="text-sm text-blue-100">
                Sistem kullanıcılarını yönetin, rol atayın ve izinleri kontrol edin
              </p>
            </div>
          </div>

          {/* Sağ taraf - Yeni Kullanıcı Davet Et butonu */}
          <div className="flex items-center gap-3">
            <InviteUserDialog />
          </div>
        </div>
      </div>
    </div>
  );
};

export { UserManagementHeader };
export default UserManagementHeader;
