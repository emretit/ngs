import React from "react";
import { UserManagement } from "@/components/settings/UserManagement";
import { Settings2, Users } from "lucide-react";
interface UsersSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const UsersSettings = ({ isCollapsed, setIsCollapsed }: UsersSettingsProps) => {
  return (
    <div className="space-y-6">
        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <UserManagement />
          </div>
        </div>
      </div>
  );
};
export default UsersSettings;
