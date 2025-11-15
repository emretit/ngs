
import React from "react";
import { QueryClientProvider } from "./QueryClientProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { ActivityTracker } from "@/components/ActivityTracker";
import "@/i18n/config";

const ActivityTrackerWrapper = () => {
  try {
  const { user } = useAuth();
  
  // Only track activity when user is logged in
  return user ? <ActivityTracker /> : null;
  } catch (error) {
    // Hot reload sırasında AuthProvider context'i kaybolabilir
    console.warn('ActivityTrackerWrapper: Auth context not available');
    return null;
  }
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
