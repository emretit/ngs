
import React from "react";
import { QueryClientProvider } from "./QueryClientProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { ActivityTracker } from "@/components/ActivityTracker";

const ActivityTrackerWrapper = () => {
  const { user } = useAuth();
  
  // Only track activity when user is logged in
  return user ? <ActivityTracker /> : null;
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <ActivityTrackerWrapper />
        <TooltipProvider>
          {children}
          <ToastProvider />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
