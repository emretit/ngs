import React from "react";
import { UserManagementNew } from "@/components/settings/users/UserManagementNew";

interface UsersSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const UsersSettings = ({ isCollapsed, setIsCollapsed }: UsersSettingsProps) => {
  return <UserManagementNew />;
};

export default UsersSettings;
