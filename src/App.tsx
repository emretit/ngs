
import React, { useState, useEffect } from "react";
import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes";

function App() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // localStorage'dan sidebar durumunu oku, yoksa varsayılan olarak true (kapalı)
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  // Sidebar durumu değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <AppProviders>
      <AppRoutes isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    </AppProviders>
  );
}

export default App;
