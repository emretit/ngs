import { useEffect, useRef } from 'react';
import { updateActivity } from '@/lib/session-activity';

// Throttle interval: 1 minute
const THROTTLE_INTERVAL = 60 * 1000;

export const ActivityTracker = () => {
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      
      // Throttle: only update if more than 1 minute has passed
      if (now - lastUpdateRef.current > THROTTLE_INTERVAL) {
        updateActivity();
        lastUpdateRef.current = now;
      }
    };

    // Listen to user activity events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  return null; // This component doesn't render anything
};
