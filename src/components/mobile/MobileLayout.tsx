import { useState } from "react";
import BottomNavigation from "./BottomNavigation";
import MobileDrawer from "./MobileDrawer";
import TopBar from "@/components/TopBar";
import { Separator } from "@/components/ui/separator";

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const MobileLayout = ({ children, title, subtitle }: MobileLayoutProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <TopBar />
      <Separator />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="p-4">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation onMenuClick={handleMenuClick} />
      
      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleDrawerClose} 
      />
    </div>
  );
};

export default MobileLayout;
