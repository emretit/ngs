import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mail, Phone, Users, ChevronDown, ChevronUp } from "lucide-react";

interface OrgChartEmployeeCardProps {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  status?: string;
  directReports?: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggleExpand?: () => void;
  onClick?: () => void;
  departmentColor?: {
    bg: string;
    border: string;
    text: string;
    accent: string;
  };
}

// yFiles-style professional org chart card
export const OrgChartEmployeeCard: React.FC<OrgChartEmployeeCardProps> = ({
  firstName,
  lastName,
  position,
  department,
  email,
  avatarUrl,
  status,
  directReports = 0,
  isExpanded,
  hasChildren,
  onToggleExpand,
  onClick,
  departmentColor = { bg: 'bg-card', border: 'border-border', text: 'text-foreground', accent: '#3b82f6' },
}) => {
  const isActive = status === 'aktif';
  const initials = `${firstName[0]}${lastName[0]}`;

  return (
    <div
      className={cn(
        "relative flex items-stretch rounded-lg shadow-md cursor-pointer",
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5",
        "bg-card border-2",
        departmentColor.border
      )}
      style={{ width: 160, height: 70 }}
      onClick={onClick}
    >
      {/* Department Color Accent Bar */}
      <div 
        className="w-1 rounded-l-lg flex-shrink-0"
        style={{ backgroundColor: departmentColor.accent }}
      />
      
      {/* Card Content */}
      <div className="flex-1 flex items-center gap-2 p-2 min-w-0">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={avatarUrl || undefined} alt={`${firstName} ${lastName}`} />
            <AvatarFallback 
              className={cn(
                "text-sm font-bold",
                departmentColor.bg, 
                departmentColor.text
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Status Indicator */}
          <div 
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
              isActive ? "bg-green-500" : "bg-gray-400"
            )}
          />
        </div>
        
        {/* Info Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Name */}
          <h3 className="font-bold text-xs text-foreground leading-tight truncate">
            {firstName} {lastName}
          </h3>
          
          {/* Position */}
          {position && (
            <p className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">
              {position}
            </p>
          )}
          
          {/* Divider */}
          <div className="w-full h-px bg-border my-1" />
          
          {/* Bottom Row - Status & Contact Icons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  isActive ? "bg-green-500" : "bg-gray-400"
                )}
              />
              <span className="text-[9px] text-muted-foreground">
                {isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            
            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
              {email && (
                <Mail className="h-2.5 w-2.5 text-muted-foreground" />
              )}
              <Phone className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Direct Reports Badge */}
      {directReports > 0 && (
        <div className="absolute -bottom-2 right-2">
          <Badge 
            variant="secondary" 
            className="text-[9px] py-0 px-1 shadow-sm bg-primary/10 text-primary border border-primary/20"
          >
            <Users className="h-2 w-2 mr-0.5" />
            {directReports}
          </Badge>
        </div>
      )}
      
      {/* Expand/Collapse Button */}
      {hasChildren && (
        <button
          className={cn(
            "absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10",
            "w-5 h-5 rounded-full bg-card border-2 shadow-md",
            "flex items-center justify-center",
            "hover:bg-accent hover:border-primary transition-all",
            departmentColor.border
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
};

// Department color palette for consistent styling
export const getDepartmentColorPalette = (departmentName?: string) => {
  const colorPalettes = [
    { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', accent: '#3b82f6' },
    { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-700', accent: '#ec4899' },
    { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', accent: '#f59e0b' },
    { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', accent: '#22c55e' },
    { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', accent: '#a855f7' },
    { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700', accent: '#6366f1' },
    { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700', accent: '#14b8a6' },
    { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', accent: '#f97316' },
    { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700', accent: '#06b6d4' },
    { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700', accent: '#f43f5e' },
  ];

  if (!departmentName) {
    return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', accent: '#6b7280' };
  }

  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < departmentName.length; i++) {
    hash = departmentName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalettes.length;
  return colorPalettes[index];
};

export default OrgChartEmployeeCard;
