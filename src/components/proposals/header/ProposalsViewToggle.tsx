
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export type ViewType = "list" | "kanban";

interface ProposalsViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ProposalsViewToggle = ({ activeView, setActiveView }: ProposalsViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border">
      <Button
        type="button"
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("list")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        type="button"
        variant={activeView === "kanban" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("kanban")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Kanban
      </Button>
    </div>
  );
};

export default ProposalsViewToggle;
