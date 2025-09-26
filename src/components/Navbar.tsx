import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newExpanded = new Set<string>(expandedMenus);
    navItems.forEach((item: any) => {
      if (item.hasDropdown && item.items) {
        const isParentActive = location.pathname === item.path;
        const hasActiveChild = item.items.some((s: any) => location.pathname === s.path);
        if (isParentActive || hasActiveChild) {
          newExpanded.add(item.path);
        }
      }
    });
    setExpandedMenus(newExpanded);
  }, [location.pathname]);

  const toggleMenu = (path: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedMenus(newExpanded);
  };

  const handleParentClick = (item: any) => {
    if (item.hasDropdown && item.items) {
      // Toggle the menu when clicked and navigate to the parent page
      const newExpanded = new Set(expandedMenus);
      if (newExpanded.has(item.path)) {
        newExpanded.delete(item.path);
      } else {
        newExpanded.add(item.path);
      }
      setExpandedMenus(newExpanded);
      navigate(item.path);
    } else {
      navigate(item.path);
    }
  };

  const renderNavItem = (item: any) => {
    if (item.hasDropdown && item.items) {
      const isExpanded = expandedMenus.has(item.path);
      const isActive = location.pathname === item.path;
      const hasActiveChild = item.items.some((subItem: any) => location.pathname === subItem.path);
      
      return (
        <div key={item.path} className="space-y-1">
          {/* Parent item */}
          <div
            onClick={() => handleParentClick(item)}
            className={cn(
              "flex items-center justify-between transition-all duration-200 rounded-lg group cursor-pointer",
              isCollapsed ? "justify-center px-3 h-10" : "px-3 h-10",
              isActive || hasActiveChild
                ? "bg-primary/15 text-primary font-semibold shadow-sm"
                : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </div>
            {!isCollapsed && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(item.path);
                }}
                className="p-1 hover:bg-gray-700/50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
          
          {/* Sub-items */}
          {!isCollapsed && isExpanded && (
            <div className="ml-4 space-y-1 border-l border-gray-700 pl-4">
              {item.items.map((subItem: any) => (
                <NavLink
                  key={subItem.path}
                  to={subItem.path}
                  icon={subItem.icon}
                  label={subItem.label}
                  isActive={location.pathname === subItem.path}
                  isCollapsed={false}
                  isSubItem={true}
                />
              ))}
            </div>
          )}
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
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-64"
    )}>
      <NavHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(renderNavItem)}
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