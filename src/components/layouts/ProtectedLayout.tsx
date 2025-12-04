import React, { useState, useEffect, Suspense } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out overflow-auto ${
          isCollapsed ? "ml-[60px]" : "ml-0 md:ml-56"
        }`}
      >
        <TopBar />
        <Separator />
        
        <main className="p-3 sm:p-4 md:p-6">
          <Suspense fallback={<ContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
