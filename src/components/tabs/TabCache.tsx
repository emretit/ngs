import React, { Suspense, useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useTabs } from './TabContext';
import { appRoutes } from '@/routes/appRoutes';
import { Skeleton } from '@/components/ui/skeleton';

// Content skeleton for lazy loading
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

// Error boundary for individual tabs
class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; tabId: string; tabPath: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in tab ${this.props.tabPath}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center space-y-4">
            <div className="text-destructive text-lg font-semibold">
              Bu sekmede bir hata oluştu
            </div>
            <div className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Bilinmeyen hata'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Individual tab content renderer
const TabContent = React.memo<{
  path: string;
  isActive: boolean;
  tabId: string;
  refreshKey?: number;
}>(({ path, isActive, tabId, refreshKey }) => {
  // Find the matching route component
  const routeConfig = useMemo(() => {
    // First try exact match
    let match = appRoutes.find(route => route.path === path);
    
    // If no exact match, try pattern matching for dynamic routes
    if (!match) {
      match = appRoutes.find(route => {
        const matchResult = matchPath(
          { path: route.path, end: true },
          path
        );
        return matchResult !== null;
      });
    }
    
    return match;
  }, [path]);

  if (!routeConfig) {
    console.warn(`No route found for path: ${path}`);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="text-muted-foreground">
            Bu sayfa için route bulunamadı
          </div>
          <div className="text-sm text-muted-foreground/60">{path}</div>
        </div>
      </div>
    );
  }

  const Component = routeConfig.component;

  return (
    <div
      style={{
        display: isActive ? 'block' : 'none',
        // Keep the content in DOM to preserve state
        visibility: isActive ? 'visible' : 'hidden',
      }}
      data-tab-id={tabId}
      data-tab-path={path}
    >
      <TabErrorBoundary tabId={tabId} tabPath={path}>
        <Suspense fallback={<ContentSkeleton />}>
          {/* refreshKey forces remount when incremented */}
          <Component key={refreshKey} />
        </Suspense>
      </TabErrorBoundary>
    </div>
  );
});

TabContent.displayName = 'TabContent';

/**
 * TabCache Component
 * 
 * This component keeps all open tabs mounted in the DOM to preserve their state.
 * Only the active tab is visible, others are hidden with CSS (display: none).
 * 
 * Benefits:
 * - Form data is preserved
 * - Scroll position is maintained
 * - API calls are not repeated
 * - Component state is kept
 * 
 * Trade-offs:
 * - More memory usage with many tabs
 * - Users should close tabs they don't need
 */
export default function TabCache() {
  const { tabs, activeTabId } = useTabs();
  const location = useLocation();

  // Filter only protected tabs (not login, auth, etc.)
  const cachedTabs = useMemo(() => {
    return tabs.filter(tab => {
      const path = tab.path;
      return path !== '/' && path !== '/login' && path !== '/auth';
    });
  }, [tabs]);

  return (
    <>
      {cachedTabs.map(tab => (
        <TabContent
          key={tab.id}
          path={tab.path}
          isActive={tab.id === activeTabId}
          tabId={tab.id}
          refreshKey={tab.refreshKey}
        />
      ))}
    </>
  );
}

