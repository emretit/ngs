import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mail, Phone, Users, Plus, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  isExpanded = true,
  hasChildren,
  onToggleExpand,
  onClick,
  departmentColor = { bg: 'bg-card', border: 'border-border', text: 'text-foreground', accent: '#3b82f6' },
}) => {
  const isActive = status === 'aktif';
  const initials = `${firstName[0]}${lastName[0]}`;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative flex items-stretch rounded-lg shadow-md cursor-pointer",
              "transition-all duration-300 ease-out",
              "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5",
              "bg-card border-2",
              departmentColor.border
            )}
            style={{ width: 220, height: 90 }}
            onClick={onClick}
          >
            {/* Department Color Accent Bar */}
            <div 
              className="w-1.5 rounded-l-lg flex-shrink-0"
              style={{ backgroundColor: departmentColor.accent }}
            />
            
            {/* Card Content */}
            <div className="flex-1 flex items-center gap-3 p-3 min-w-0">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
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
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card",
                    isActive ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>
              
              {/* Info Section */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Name */}
                <h3 className="font-bold text-sm text-foreground leading-tight truncate">
                  {firstName} {lastName}
                </h3>
                
                {/* Position */}
                {position && (
                  <p className="text-xs text-muted-foreground leading-tight truncate mt-0.5">
                    {position}
                  </p>
                )}
                
                {/* Divider */}
                <div className="w-full h-px bg-border my-1.5" />
                
                {/* Bottom Row - Status & Contact Icons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div 
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        isActive ? "bg-green-500" : "bg-gray-400"
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    {email && (
                      <Mail className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Phone className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Direct Reports Badge */}
            {directReports > 0 && (
              <div className="absolute -bottom-2.5 right-3">
                <Badge 
                  variant="secondary" 
                  className="text-[10px] py-0 px-1.5 shadow-sm bg-primary/10 text-primary border border-primary/20"
                >
                  <Users className="h-2.5 w-2.5 mr-0.5" />
                  {directReports}
                </Badge>
              </div>
            )}
            
            {/* Expand/Collapse Button - yFiles style +/- */}
            {hasChildren && (
              <button
                className={cn(
                  "absolute -bottom-3 left-1/2 -translate-x-1/2 z-10",
                  "w-6 h-6 rounded-full bg-card border-2 shadow-md",
                  "flex items-center justify-center",
                  "hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all",
                  "text-muted-foreground",
                  departmentColor.border
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
              >
                {isExpanded ? (
                  <Minus className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="max-w-xs p-3 bg-card border shadow-xl"
          sideOffset={8}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className={cn(departmentColor.bg, departmentColor.text)}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{firstName} {lastName}</p>
                {position && <p className="text-xs text-muted-foreground">{position}</p>}
              </div>
            </div>
            
            {department && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Departman:</span>
                <Badge variant="outline" className={cn("text-[10px]", departmentColor.bg, departmentColor.text)}>
                  {department}
                </Badge>
              </div>
            )}
            
            {email && (
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{email}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs pt-1 border-t">
              <div className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-gray-400")} />
                <span>{isActive ? 'Aktif' : 'Pasif'}</span>
              </div>
              {directReports > 0 && (
                <div className="flex items-center gap-1 text-primary">
                  <Users className="h-3 w-3" />
                  <span>{directReports} ekip üyesi</span>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
