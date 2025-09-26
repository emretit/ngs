
import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
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
  logger.info(`Success: ${message}`);
  return toast({
    title: "Başarılı",
    description: message,
    duration: options?.duration || 5000,
    className: "border-l-4 border-l-green-500",
  });
};

/**
 * Shows an error toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showError = (message: string, options?: ToastOptions) => {
  logger.error(`Error toast: ${message}`);
  return toast({
    title: "Hata",
    description: message,
    variant: "destructive",
    duration: options?.duration || 5000,
    className: "border-l-4 border-l-red-500",
  });
};

/**
 * Shows a warning toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  logger.warn(`Warning: ${message}`);
  return toast({
    title: "Uyarı",
    description: message,
    duration: options?.duration || 5000,
    className: "border-l-4 border-l-yellow-500",
  });
};

/**
 * Shows an info toast notification
 * @param message The message to display
 * @param options Optional configuration options
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  logger.info(`Info: ${message}`);
  return toast({
    title: "Bilgi",
    description: message,
    duration: options?.duration || 5000,
    className: "border-l-4 border-l-blue-500",
  });
};

// Re-export the toast function
export { toast };
