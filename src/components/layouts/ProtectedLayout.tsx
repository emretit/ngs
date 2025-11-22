import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { Separator } from "@/components/ui/separator";

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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default React.memo(ProtectedLayout);
