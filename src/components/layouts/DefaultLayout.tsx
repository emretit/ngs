
import React from "react";
import Navbar from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import TopBar from "@/components/TopBar";

interface DefaultLayoutProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  title: string;
  subtitle?: string;
}

const DefaultLayout = ({
  children,
  isCollapsed,
  setIsCollapsed,
  title,
  subtitle
}: DefaultLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out overflow-auto ${
          isCollapsed ? "ml-[60px]" : "ml-56"
        }`}
      >
        <TopBar />
        
        <Separator />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DefaultLayout;
