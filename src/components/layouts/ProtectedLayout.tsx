import React, { useState, useEffect, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TabProvider } from "@/components/tabs/TabContext";
import TabBar from "@/components/tabs/TabBar";
import TabNavigationHandler from "@/components/tabs/TabNavigationHandler";
import TabCache from "@/components/tabs/TabCache";
import { cn } from "@/lib/utils";

// Inline skeleton for faster render
const ContentSkeleton = () => (
  <div className="space-y-4 animate-in fade-in duration-150">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-32" />
    </div>
    <div className="flex gap-2 flex-wrap">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-32" />
    </div>
    <div className="bg-card rounded-lg border p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

const ProtectedLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Pages that should have no padding (full-screen)
  const fullScreenPages = ['/ai-assistant'];
  const isFullScreen = fullScreenPages.includes(location.pathname);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleResize = () => {
      // Desktop'ta mobile sidebar'ı kapat
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <TabProvider>
      <TabNavigationHandler />
      <div className="flex h-screen bg-gray-50">
        {/* Mobile backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <Navbar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out overflow-auto ${
            // Mobile'da margin yok, desktop'ta sidebar genişliğine göre
            isCollapsed 
              ? "lg:ml-[60px]" 
              : "lg:ml-56"
          }`}
        >
          <TopBar 
            onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />
          <TabBar />
          <Separator />
          
          <main className={cn(isFullScreen ? "" : "p-3 sm:p-4 md:p-6")}>
            <Suspense fallback={<ContentSkeleton />}>
              <TabCache />
            </Suspense>
          </main>
        </div>
      </div>
    </TabProvider>
  );
};

export default ProtectedLayout;
