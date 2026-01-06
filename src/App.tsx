import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes";
import { EmbeddedAIWidget } from "./components/ai/EmbeddedAIWidget";
import { usePageContext } from "./hooks/usePageContext";

// Inner component to use hooks after providers
function AppContent() {
  // Auto-detect page context for AI
  usePageContext();

  return (
    <>
      <AppRoutes />
      <EmbeddedAIWidget />
    </>
  );
}

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
