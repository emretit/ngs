import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Users } from "lucide-react";

export type UserViewType = "list" | "grid" | "kanban";

interface UserViewToggleProps {
  activeView: UserViewType;
  setActiveView: (view: UserViewType) => void;
}

const UserViewToggle = ({ activeView, setActiveView }: UserViewToggleProps) => {
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
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("grid")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Grid
      </Button>
      <Button
        type="button"
        variant={activeView === "kanban" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("kanban")}
      >
        <Users className="h-4 w-4 mr-2" />
        Kanban
      </Button>
    </div>
  );
};

export { UserViewToggle };
export default UserViewToggle;
