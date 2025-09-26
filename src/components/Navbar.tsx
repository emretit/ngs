import React from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import NavHeader from "./navbar/NavHeader";
import NavLink from "./navbar/NavLink";
import { navItems, settingsItem } from "./navbar/nav-config";

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const location = useLocation();

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-64"
    )}>
      <NavHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.category && item.items) {
            // Category with sub-items
            return (
              <div key={item.category} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.category}
                  </div>
                )}
                
                {item.items.map((subItem) => (
                  <NavLink
                    key={subItem.path}
                    to={subItem.path}
                    icon={subItem.icon}
                    label={subItem.label}
                    isActive={location.pathname === subItem.path}
                    isCollapsed={isCollapsed}
                    isSubItem={true}
                  />
                ))}
              </div>
            );
          } else {
            // Regular nav item
            return (
              <NavLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.path}
                isCollapsed={isCollapsed}
              />
            );
          }
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-2 border-t border-gray-800">
        <NavLink
          to={settingsItem.path}
          icon={settingsItem.icon}
          label={settingsItem.label}
          isActive={location.pathname === settingsItem.path}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
};

export default Navbar;