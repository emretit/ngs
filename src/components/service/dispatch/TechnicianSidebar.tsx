import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DispatchTechnician } from "./types";
import { User, Wrench } from "lucide-react";

interface TechnicianSidebarProps {
  technicians: DispatchTechnician[];
  selectedTechnicianId: string | null;
  onSelectTechnician: (id: string) => void;
}

const statusConfig = {
  available: {
    label: "Müsait",
    className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    dotColor: "bg-green-500",
  },
  busy: {
    label: "Meşgul",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  "on-leave": {
    label: "İzinli",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    dotColor: "bg-gray-500",
  },
  offline: {
    label: "Çevrimdışı",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-500",
    dotColor: "bg-gray-400",
  },
};

export const TechnicianSidebar = ({
  technicians,
  selectedTechnicianId,
  onSelectTechnician,
}: TechnicianSidebarProps) => {
  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Teknisyenler</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {technicians.length} teknisyen
        </p>
      </div>

      {/* Technician List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {technicians.map((technician) => {
            const isSelected = selectedTechnicianId === technician.id;
            const status = statusConfig[technician.status];
            const initials = `${technician.first_name[0]}${technician.last_name[0]}`.toUpperCase();

            return (
              <button
                key={technician.id}
                onClick={() => onSelectTechnician(technician.id)}
                className={cn(
                  "w-full p-3 rounded-lg border transition-all hover:bg-accent/50 text-left",
                  isSelected && "bg-accent border-primary shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={technician.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    {/* Status Indicator */}
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card", status.dotColor)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {technician.first_name} {technician.last_name}
                      </p>
                    </div>
                    
                    {technician.position && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {technician.position}
                      </p>
                    )}

                    {/* Service Count */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        Bugün: {technician.todayServiceCount}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        Hafta: {technician.weekServiceCount}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {technicians.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Teknisyen bulunamadı</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
