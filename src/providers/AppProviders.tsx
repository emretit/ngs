
import React from "react";
import { QueryClientProvider } from "./QueryClientProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { ActivityTracker } from "@/components/ActivityTracker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
    <ErrorBoundary>
      <QueryClientProvider>
        <AuthProvider>
          <ActivityTrackerWrapper />
          <TooltipProvider>
            {children}
            <ToastProvider />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
