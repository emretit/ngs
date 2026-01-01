// Re-export from common components for backward compatibility
// TODO: Gradually migrate imports to use @/components/common directly
import { EmptyState as CommonEmptyState, LoadingState as CommonLoadingState } from "@/components/common";
import { Clock } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  message?: string;
}

// Wrapper to maintain backward compatibility with local styling
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "Arama kriterlerinize uygun servis talebi bulunmuyor" 
}) => {
  return (
    <CommonEmptyState
      icon={<Clock className="h-8 w-8 text-muted-foreground" />}
      title="Servis talebi bulunamadı"
      description={message}
      size="md"
    />
  );
};

export const LoadingState: React.FC = () => {
  return <CommonLoadingState message="Servis talepleri yükleniyor..." />;
};
