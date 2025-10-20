// Session activity tracking utilities
// 8 hours in milliseconds
export const ACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'last_activity_timestamp';

// Update the last activity timestamp
export const updateActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to update activity timestamp:', error);
  }
};

// Get the last activity timestamp
export const getLastActivity = (): number | null => {
  try {
    const timestamp = localStorage.getItem(LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.warn('Failed to get activity timestamp:', error);
    return null;
  }
};

// Check if session has expired (8 hours of inactivity)
export const isSessionExpired = (): boolean => {
  const lastActivity = getLastActivity();
  // Treat missing activity as expired to enforce inactivity logout
  if (!lastActivity) return true;
  const timeSinceLastActivity = Date.now() - lastActivity;
  return timeSinceLastActivity > ACTIVITY_TIMEOUT;
};

// Clear activity data on logout
export const clearActivity = () => {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch (error) {
    console.warn('Failed to clear activity timestamp:', error);
  }
};
