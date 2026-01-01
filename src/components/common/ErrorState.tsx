import React from "react";
import { LucideIcon, AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  variant?: "default" | "card" | "inline";
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Bir hata oluştu",
  message = "Lütfen daha sonra tekrar deneyin",
  icon: Icon = AlertCircle,
  onRetry,
  retryText = "Tekrar Dene",
  className,
  variant = "default",
}) => {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "inline" ? "py-4" : "py-12",
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          {retryText}
        </Button>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    );
  }

  return content;
};

export default ErrorState;
