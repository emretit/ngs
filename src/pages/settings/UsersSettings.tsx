import React from "react";
import { UserManagement } from "@/components/settings/UserManagement";
import { Settings2, Users } from "lucide-react";
interface UsersSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const UsersSettings = ({ isCollapsed, setIsCollapsed }: UsersSettingsProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <UserManagement />
      </div>
    </div>
  );
};
export default UsersSettings;
