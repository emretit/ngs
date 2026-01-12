import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickLinkCardConfig, colorVariantClasses, statColorClasses } from "./types";
import { cn } from "@/lib/utils";

interface QuickLinkCardProps {
  config: QuickLinkCardConfig;
  dateLabel?: string;
}

const QuickLinkCard = ({ config, dateLabel }: QuickLinkCardProps) => {
  const navigate = useNavigate();
  const colors = colorVariantClasses[config.color];
  const IconComponent = config.icon;

  const handleCardClick = () => {
    navigate(config.href);
  };

  const handleNewButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.newButton?.onClick) {
      config.newButton.onClick(e);
    } else if (config.newButton?.href) {
      navigate(config.newButton.href);
    }
  };

  return (
    <div
      className={cn(
        "group bg-card rounded-2xl shadow-md border border-border overflow-hidden",
        "hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer",
        colors.border
      )}
      onClick={handleCardClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{config.title}</h2>
              {config.subtitle && (
                <p className="text-xs text-muted-foreground">{config.subtitle}</p>
              )}
            </div>
          </div>
          
          {config.newButton && (
            <Button
              size="sm"
              className={cn(
                "flex items-center gap-1 text-primary-foreground text-xs px-2 py-1 h-7",
                colors.buttonBg,
                colors.buttonHover
              )}
              onClick={handleNewButtonClick}
            >
              <Plus className="h-3 w-3" />
              {config.newButton.label || "Yeni"}
            </Button>
          )}
        </div>

        {/* Date Label */}
        {(config.dateLabel || dateLabel) && (
          <div className="mb-3">
            <span className={cn("text-xs font-normal px-2 py-1 rounded", colors.lightBg, colors.lightText)}>
              {config.dateLabel || dateLabel}
            </span>
          </div>
        )}

        {/* Custom Content or Stats */}
        {config.customContent ? (
          config.customContent
        ) : (
          <div className="space-y-3">
            {config.stats?.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={cn("text-sm font-bold", statColorClasses[stat.color || "default"])}>
                  {stat.value}
                </span>
              </div>
            ))}
            
            {config.footerStat && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{config.footerStat.label}</span>
                  <span className={cn("text-sm font-bold", statColorClasses[config.footerStat.color || "success"])}>
                    {config.footerStat.value}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickLinkCard;
