
import { toast } from "sonner";
import { logger } from "./logger";

type ToastOptions = {
  /** Duration in milliseconds */
  duration?: number;
};

/**
 * Shows a success toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  logger.info(`Success: ${message}`, options);
  return toast.success(message, { duration: options?.duration || 5000 });
};

/**
 * Shows an error toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showError = (message: string, options?: ToastOptions) => {
  logger.error(`Error toast: ${message}`);
  return toast.error(message, { duration: options?.duration || 5000 });
};

/**
 * Shows a warning toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  logger.warn(`Warning: ${message}`);
  return toast.warning(message, { duration: options?.duration || 5000 });
};

/**
 * Shows an info toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  logger.info(`Info: ${message}`);
  return toast.info(message, { duration: options?.duration || 5000 });
};

// Re-export the toast function
export { toast };
