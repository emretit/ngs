import React from "react";
import { Button } from "@/components/ui/button";
import { List, CalendarDays, LayoutGrid, Map, GanttChart, AlertTriangle, Repeat, FileText, BarChart3, DollarSign, Package, Star, TrendingUp } from "lucide-react";

type ViewType = "list" | "kanban" | "map" | "scheduling" | "calendar" | "sla" | "maintenance" | "templates" | "performance" | "costs" | "parts" | "satisfaction" | "analytics";

interface ServiceViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ServiceViewToggle = ({ activeView, setActiveView }: ServiceViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border shadow-sm">
      <Button
        type="button"
        variant={activeView === "kanban" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("kanban")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Kanban
      </Button>
      <Button
        type="button"
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("list")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        type="button"
        variant={activeView === "map" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("map")}
      >
        <Map className="h-4 w-4 mr-2" />
        Harita
      </Button>
      <Button
        type="button"
        variant={activeView === "scheduling" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("scheduling")}
      >
        <GanttChart className="h-4 w-4 mr-2" />
        Zaman Çizelgesi
      </Button>
      <Button
        type="button"
        variant={activeView === "calendar" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("calendar")}
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        Takvim
      </Button>
      <Button
        type="button"
        variant={activeView === "sla" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("sla")}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        SLA
      </Button>
      <Button
        type="button"
        variant={activeView === "maintenance" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("maintenance")}
      >
        <Repeat className="h-4 w-4 mr-2" />
        Bakım
      </Button>
      <Button
        type="button"
        variant={activeView === "templates" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("templates")}
      >
        <FileText className="h-4 w-4 mr-2" />
        Şablonlar
      </Button>
      <Button
        type="button"
        variant={activeView === "performance" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("performance")}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Performans
      </Button>
      <Button
        type="button"
        variant={activeView === "costs" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("costs")}
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Maliyet
      </Button>
      <Button
        type="button"
        variant={activeView === "parts" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("parts")}
      >
        <Package className="h-4 w-4 mr-2" />
        Parçalar
      </Button>
      <Button
        type="button"
        variant={activeView === "satisfaction" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("satisfaction")}
      >
        <Star className="h-4 w-4 mr-2" />
        Memnuniyet
      </Button>
      <Button
        type="button"
        variant={activeView === "analytics" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("analytics")}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Analitik
      </Button>
    </div>
  );
};

export default ServiceViewToggle;
