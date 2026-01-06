import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAI } from '@/contexts/AIContext';
import { detectPageContext, enrichPageContext } from '@/services/contextDetectionService';
import { logger } from '@/utils/logger';

/**
 * Hook to automatically detect and update page context for AI
 * Monitors route changes and updates AIContext with current page information
 */
export function usePageContext(additionalData?: Record<string, any>) {
  const location = useLocation();
  const { updatePageContext, pageContext } = useAI();

  useEffect(() => {
    // Detect context from current pathname
    const baseContext = detectPageContext(location.pathname);

    // Enrich with additional data if provided
    const enrichedContext = enrichPageContext(baseContext, additionalData);

    // Update AI context
    updatePageContext(enrichedContext);

    logger.info('Page context detected', {
      route: enrichedContext.route,
      module: enrichedContext.module,
      entities: enrichedContext.entities
    });

    // Cleanup function (optional)
    return () => {
      // You could clear context on unmount if needed
      // But typically we want to keep it until next page
    };
  }, [location.pathname, additionalData, updatePageContext]);

  return pageContext;
}
