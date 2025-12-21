import { useState, useEffect } from "react";
import MobileLayout from "@/components/mobile/MobileLayout";
import DesktopLayout from "./DesktopLayout";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const ResponsiveLayout = ({ children, title, subtitle }: ResponsiveLayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Ekran genişliğine göre mobil kontrolü
    const checkPlatform = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isSmallScreen);
    };

    checkPlatform();
    
    // Resize listener ekle
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobil platform veya küçük ekran için MobileLayout kullan
  if (isMobile) {
    return (
      <MobileLayout title={title} subtitle={subtitle}>
        {children}
      </MobileLayout>
    );
  }

  // Desktop için yeni DesktopLayout kullan (sidebar yok)
  return (
    <DesktopLayout title={title} subtitle={subtitle}>
      {children}
    </DesktopLayout>
  );
};

export default ResponsiveLayout;
