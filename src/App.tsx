
import React, { useState } from "react";
import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes";

function App() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <AppProviders>
      <AppRoutes isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    </AppProviders>
  );
}

export default App;
