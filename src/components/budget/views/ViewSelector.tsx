import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BudgetViewType = "tabs";

interface ViewSelectorProps {
  value: BudgetViewType;
  onChange: (value: BudgetViewType) => void;
  className?: string;
}

const VIEW_OPTIONS = [
  {
    value: "tabs" as const,
    label: "Detay",
    icon: BarChart3,
    description: "Tab görünümü",
  },
];

const ViewSelector = ({ value, onChange, className }: ViewSelectorProps) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val as BudgetViewType)}
      className={cn("bg-muted p-1 rounded-lg", className)}
    >
      {VIEW_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.description}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all",
            "data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm",
            "hover:bg-white/50"
          )}
        >
          <option.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{option.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default ViewSelector;

