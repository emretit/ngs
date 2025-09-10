import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronDown, ChevronRight, Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { 
  NavigationProps, 
  NavLinkProps, 
  NavCategoryProps, 
  BreadcrumbNavigationProps, 
  BreadcrumbItem as SharedBreadcrumbItem, 
  TabsNavigationProps, 
  TabItem, 
  NavigationHeaderProps 
} from "@/types/shared-types";

// Navigation Item Types
export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  external?: boolean;
}

export interface NavCategory {
  category: string;
  icon: LucideIcon;
  path?: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

export type NavigationItem = NavItem | NavCategory;

// Navigation Link Bileşeni
export interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: string | number;
  external?: boolean;
  isSubItem?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NavLink({
  to,
  icon: Icon,
  label,
  isActive = false,
  isCollapsed = false,
  badge,
  external = false,
  isSubItem = false,
  onClick,
  className,
}: NavLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
    if (external) {
      window.open(to, '_blank');
    } else {
      navigate(to);
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={cn(
        "flex items-center h-9 px-3 rounded-lg transition-all duration-200 group",
        isSubItem && "text-sm h-8 ml-1",
        isActive 
          ? "bg-primary/15 text-primary font-semibold shadow-sm" 
          : "text-gray-300 hover:bg-gray-800/70 hover:text-white",
        className
      )}
    >
      <Icon className={cn(
        "flex-shrink-0",
        isSubItem ? "h-3 w-3" : "h-4 w-4"
      )} />
      
      {!isCollapsed && (
        <>
          <span className={cn(
            "ml-3 font-medium truncate",
            isSubItem ? "text-xs" : "text-sm"
          )}>
            {label}
          </span>
          
          {badge && (
            <span className={cn(
              "ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full",
              isActive 
                ? "bg-primary/20 text-primary" 
                : "bg-gray-700 text-gray-300"
            )}>
              {badge}
            </span>
          )}
          
          {external && (
            <span className="ml-1 text-xs opacity-60">↗</span>
          )}
        </>
      )}
    </a>
  );
}

// Navigation Category Bileşeni
export interface NavCategoryProps {
  category: string;
  icon: LucideIcon;
  path?: string;
  items: NavItem[];
  isCollapsed?: boolean;
  isExpanded?: boolean;
  onToggle?: (category: string) => void;
  currentPath?: string;
}

export function NavCategory({
  category,
  icon: Icon,
  path,
  items,
  isCollapsed = false,
  isExpanded = false,
  onToggle,
  currentPath,
}: NavCategoryProps) {
  const navigate = useNavigate();
  const isActive = currentPath === path;

  const handleCategoryClick = () => {
    if (onToggle) {
      onToggle(category);
    }
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleCategoryClick}
        className={cn(
          "flex items-center w-full h-10 px-3 rounded-lg transition-all duration-200",
          !isCollapsed && "justify-between",
          isActive 
            ? "bg-primary/15 text-primary font-semibold shadow-sm" 
            : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
        )}
      >
        <div className="flex items-center">
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">{category}</span>
          )}
        </div>
        {!isCollapsed && (
          <div className="transition-transform duration-200">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </div>
        )}
      </button>
      
      {isExpanded && !isCollapsed && (
        <div className="ml-2 mt-1 space-y-0.5 border-l border-gray-700/50 pl-2">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              external={item.external}
              isActive={currentPath === item.path}
              isCollapsed={isCollapsed}
              isSubItem={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Ana Navigation Container
export interface NavigationProps {
  items: NavigationItem[];
  isCollapsed?: boolean;
  className?: string;
  defaultExpanded?: string[];
  storageKey?: string;
}

export function Navigation({
  items,
  isCollapsed = false,
  className,
  defaultExpanded = [],
  storageKey = 'expandedCategories',
}: NavigationProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultExpanded;
    }
    return defaultExpanded;
  });

  const toggleCategory = (category: string) => {
    const newExpanded = expandedCategories.includes(category)
      ? expandedCategories.filter(c => c !== category)
      : [...expandedCategories, category];
    
    setExpandedCategories(newExpanded);
    
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newExpanded));
    }
  };

  const isCategory = (item: NavigationItem): item is NavCategory => {
    return 'category' in item && 'items' in item;
  };

  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item) => {
        if (isCategory(item)) {
          const isExpanded = expandedCategories.includes(item.category);
          return (
            <NavCategory
              key={item.category}
              category={item.category}
              icon={item.icon}
              path={item.path}
              items={item.items}
              isCollapsed={isCollapsed}
              isExpanded={isExpanded}
              onToggle={toggleCategory}
              currentPath={currentPath}
            />
          );
        }
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            external={item.external}
            isActive={currentPath === item.path}
            isCollapsed={isCollapsed}
          />
        );
      })}
    </nav>
  );
}

// Breadcrumb Navigation
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: LucideIcon;
}

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  homeLink?: string;
  className?: string;
}

export function BreadcrumbNavigation({
  items,
  homeLink = "/",
  className,
}: BreadcrumbNavigationProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={homeLink} className="flex items-center">
            <Home className="h-3 w-3 mr-1" />
            Ana Sayfa
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.path && index < items.length - 1 ? (
                <BreadcrumbLink href={item.path} className="flex items-center">
                  {item.icon && <item.icon className="h-3 w-3 mr-1" />}
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center">
                  {item.icon && <item.icon className="h-3 w-3 mr-1" />}
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Tabs Navigation
export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsNavigationProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TabsNavigation({
  items,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className,
}: TabsNavigationProps) {
  const variantClasses = {
    default: "bg-gray-100 rounded-lg p-1",
    pills: "space-x-1",
    underline: "border-b border-gray-200",
  };

  const itemClasses = {
    default: "flex-1 text-center rounded-md transition-all duration-200",
    pills: "rounded-md transition-all duration-200",
    underline: "border-b-2 border-transparent transition-all duration-200",
  };

  const activeClasses = {
    default: "bg-white shadow-sm text-gray-900",
    pills: "bg-primary text-primary-foreground",
    underline: "border-primary text-primary",
  };

  const inactiveClasses = {
    default: "text-gray-600 hover:text-gray-900",
    pills: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    underline: "text-gray-600 hover:text-gray-900 hover:border-gray-300",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  return (
    <div className={cn(
      "flex",
      variantClasses[variant],
      className
    )}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => !item.disabled && onTabChange(item.id)}
          disabled={item.disabled}
          className={cn(
            "flex items-center justify-center space-x-2 font-medium",
            itemClasses[variant],
            sizeClasses[size],
            activeTab === item.id ? activeClasses[variant] : inactiveClasses[variant],
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.label}</span>
          {item.badge && (
            <span className={cn(
              "px-1.5 py-0.5 text-xs font-semibold rounded-full",
              activeTab === item.id 
                ? "bg-primary/20 text-primary" 
                : "bg-gray-200 text-gray-600"
            )}>
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Navigation Header
export interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function NavigationHeader({
  title,
  subtitle,
  logo,
  actions,
  className,
}: NavigationHeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between p-4 border-b border-gray-200 bg-white",
      className
    )}>
      <div className="flex items-center space-x-3">
        {logo && (
          <div className="flex-shrink-0">
            {logo}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </header>
  );
}
