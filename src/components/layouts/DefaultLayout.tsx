import React from "react";

interface DefaultLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  isCollapsed?: boolean;
  setIsCollapsed?: (value: boolean) => void;
}

const DefaultLayout = ({
  children,
  title,
  subtitle,
  isCollapsed,
  setIsCollapsed
}: DefaultLayoutProps) => {
  // Props are optional for backward compatibility but not used
  // since ProtectedLayout now handles Navbar and TopBar
  return (
    <div className="w-full">
      {children}
    </div>
  );
};

export default DefaultLayout;
