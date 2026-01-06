import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GitCompare, Target } from "lucide-react";

interface ChartComparisonControlsProps {
  showPreviousYear?: boolean;
  onShowPreviousYearChange?: (show: boolean) => void;
  showTarget?: boolean;
  onShowTargetChange?: (show: boolean) => void;
  onSetTarget?: () => void;
}

export const ChartComparisonControls = memo(({
  showPreviousYear = false,
  onShowPreviousYearChange,
  showTarget = false,
  onShowTargetChange,
  onSetTarget,
}: ChartComparisonControlsProps) => {
  return (
    <Card className="border-border/40 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Karşılaştırma Seçenekleri
          </h4>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Önceki Yıl Karşılaştırma */}
            {onShowPreviousYearChange && (
              <div className="flex items-center gap-2">
                <Switch
                  id="previous-year"
                  checked={showPreviousYear}
                  onCheckedChange={onShowPreviousYearChange}
                />
                <Label 
                  htmlFor="previous-year" 
                  className="text-sm cursor-pointer"
                >
                  Önceki Yıl
                </Label>
              </div>
            )}

            {/* Hedef Gösterimi */}
            {onShowTargetChange && (
              <div className="flex items-center gap-2">
                <Switch
                  id="show-target"
                  checked={showTarget}
                  onCheckedChange={onShowTargetChange}
                />
                <Label 
                  htmlFor="show-target" 
                  className="text-sm cursor-pointer"
                >
                  Hedef Çizgisi
                </Label>
              </div>
            )}

            {/* Hedef Belirleme Butonu */}
            {onSetTarget && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSetTarget}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Hedef Belirle
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ChartComparisonControls.displayName = "ChartComparisonControls";

