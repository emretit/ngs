import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: "default" | "destructive" | null) => {
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, className, duration, ...props }) {
        return (
          <Toast 
            key={id} 
            variant={variant}
            className={cn(
              "bg-background border shadow-lg",
              className
            )}
            duration={duration || 1000}
            {...props}
          >
            <div className="flex items-start gap-3">
              {getIcon(variant)}
              <div className="grid gap-1 flex-1">
                {title && (
                  <ToastTitle className="text-sm font-medium">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-sm text-muted-foreground">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
