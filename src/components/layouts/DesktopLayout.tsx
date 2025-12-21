import { useState } from "react";
import BottomNavigation from "@/components/mobile/BottomNavigation";
import MobileDrawer from "@/components/mobile/MobileDrawer";
import TopBar from "@/components/TopBar";
import { Separator } from "@/components/ui/separator";

interface DesktopLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const DesktopLayout = ({ children, title, subtitle }: DesktopLayoutProps) => {
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
        <div className="p-6">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation - Desktop'ta da kullanıyoruz */}
      <BottomNavigation onMenuClick={handleMenuClick} />
      
      {/* Desktop Drawer */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleDrawerClose} 
      />
    </div>
  );
};

export default DesktopLayout;
