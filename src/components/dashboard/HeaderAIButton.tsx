import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Bot, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedAIPanel } from "./UnifiedAIPanel";

interface HeaderAIButtonProps {
  className?: string;
}

export const HeaderAIButton = memo(({ className }: HeaderAIButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative group h-10 px-4 gap-2",
          "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%]",
          "hover:bg-[position:100%_0] transition-all duration-500",
          "text-white font-medium shadow-lg shadow-indigo-500/25",
          "hover:shadow-xl hover:shadow-indigo-500/40",
          "border-0",
          className
        )}
      >
        <div className="relative">
          <Bot className="h-4 w-4" />
          <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
        <span className="hidden sm:inline">AI Asistan</span>
        <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl h-[90vh] sm:h-[85vh] p-0 gap-0 overflow-hidden border-indigo-500/20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  AI Asistan
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-medium">
                    GPT-5
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  İşletmeniz için akıllı asistan
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <UnifiedAIPanel embedded />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

HeaderAIButton.displayName = "HeaderAIButton";
