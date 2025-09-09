
import React from "react";
import { QueryClientProvider } from "./QueryClientProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/auth/AuthContext";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <TooltipProvider>
          {children}
          <ToastProvider />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
