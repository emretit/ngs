import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import NavHeader from "./navbar/NavHeader";
import NavLink from "./navbar/NavLink";
import { navItems, settingsItem } from "./navbar/nav-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const location = useLocation();

  const renderNavItem = (item: any) => {
    if (item.hasDropdown && item.items) {
      // Item with dropdown
      return (
        <DropdownMenu key={item.path}>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex items-center justify-between transition-all duration-200 rounded-lg group cursor-pointer px-3 h-10",
              location.pathname === item.path || item.items.some((subItem: any) => location.pathname === subItem.path)
                ? "bg-primary/15 text-primary font-semibold shadow-sm"
                : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
            )}>
              <div className="flex items-center space-x-3">
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="start" 
            className="w-56 bg-gray-900 border-gray-800"
          >
            <DropdownMenuItem asChild>
              <NavLink
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.path}
                isCollapsed={false}
              />
            </DropdownMenuItem>
            {item.items.map((subItem: any) => (
              <DropdownMenuItem key={subItem.path} asChild>
                <NavLink
                  to={subItem.path}
                  icon={subItem.icon}
                  label={subItem.label}
                  isActive={location.pathname === subItem.path}
                  isCollapsed={false}
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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