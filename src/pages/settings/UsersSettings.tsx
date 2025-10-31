import React from "react";
import { UserManagementNew } from "@/components/settings/users/UserManagementNew";

interface UsersSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const UsersSettings = ({ isCollapsed, setIsCollapsed }: UsersSettingsProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <UserManagementNew />
      </div>
    </div>
  );
};

export default UsersSettings;
