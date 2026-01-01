import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  fullPage?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Yükleniyor...",
  className,
  size = "md",
  variant = "spinner",
  fullPage = false,
}) => {
  const sizeStyles = {
    sm: {
      container: "py-4",
      icon: "w-4 h-4",
      text: "text-xs",
      dots: "w-1.5 h-1.5",
    },
    md: {
      container: "py-8",
      icon: "w-6 h-6",
      text: "text-sm",
      dots: "w-2 h-2",
    },
    lg: {
      container: "py-12",
      icon: "w-10 h-10",
      text: "text-base",
      dots: "w-3 h-3",
    },
  };

  const styles = sizeStyles[size];

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-pulse",
                  styles.dots
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
        );
      case "pulse":
        return (
          <div className="space-y-2 w-full max-w-xs">
            <div className="h-3 bg-muted animate-pulse rounded w-3/4 mx-auto" />
            <div className="h-3 bg-muted animate-pulse rounded w-1/2 mx-auto" />
          </div>
        );
      default:
        return <Loader2 className={cn(styles.icon, "animate-spin text-primary")} />;
    }
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        styles.container,
        className
      )}
    >
      {renderLoader()}
      {message && (
        <p className={cn("text-muted-foreground", styles.text)}>{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState;
