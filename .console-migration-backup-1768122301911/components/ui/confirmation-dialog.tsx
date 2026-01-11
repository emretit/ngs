import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertTriangle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const ConfirmationDialog = DialogPrimitive.Root

const ConfirmationDialogTrigger = DialogPrimitive.Trigger

const ConfirmationDialogPortal = DialogPrimitive.Portal

const ConfirmationDialogClose = DialogPrimitive.Close

const ConfirmationDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
ConfirmationDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const ConfirmationDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ConfirmationDialogPortal>
    <ConfirmationDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </ConfirmationDialogPortal>
))
ConfirmationDialogContent.displayName = DialogPrimitive.Content.displayName

const ConfirmationDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
ConfirmationDialogHeader.displayName = "ConfirmationDialogHeader"

const ConfirmationDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
ConfirmationDialogFooter.displayName = "ConfirmationDialogFooter"

const ConfirmationDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
ConfirmationDialogTitle.displayName = DialogPrimitive.Title.displayName

const ConfirmationDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ConfirmationDialogDescription.displayName = DialogPrimitive.Description.displayName

// Confirmation Dialog Props
interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const ConfirmationDialogComponent = React.forwardRef<
  HTMLDivElement,
  ConfirmationDialogProps
>(({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
  ...props
}, ref) => {
  const handleConfirm = async () => {
    try {
      await onConfirm()
      // onConfirm başarılı olduğunda dialog'u kapat
      // Not: onConfirm içinde dialog kapatılmıyorsa burada kapatılır
      // Eğer onConfirm içinde zaten kapatılıyorsa, burada kapatma işlemi çift kapatma yapmaz
      // Çünkü onOpenChange zaten false ise tekrar false yapmak sorun yaratmaz
      onOpenChange(false)
    } catch (error) {
      // Hata durumunda dialog açık kalsın, kullanıcı hatayı görebilsin
      console.error('Confirmation action failed:', error)
      // Hata durumunda dialog'u kapatma, kullanıcı hatayı görebilsin
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <ConfirmationDialog open={open} onOpenChange={onOpenChange}>
      <ConfirmationDialogContent ref={ref} {...props}>
        <ConfirmationDialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              variant === "destructive" 
                ? "bg-red-100 text-red-600" 
                : "bg-blue-100 text-blue-600"
            )}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <ConfirmationDialogTitle className={cn(
              variant === "destructive" ? "text-red-900" : "text-gray-900"
            )}>
              {title}
            </ConfirmationDialogTitle>
          </div>
          <ConfirmationDialogDescription className="text-left mt-2">
            {description}
          </ConfirmationDialogDescription>
        </ConfirmationDialogHeader>
        
        <ConfirmationDialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "destructive" 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading ? "İşleniyor..." : confirmText}
          </Button>
        </ConfirmationDialogFooter>
      </ConfirmationDialogContent>
    </ConfirmationDialog>
  )
})
ConfirmationDialogComponent.displayName = "ConfirmationDialogComponent"

export {
  ConfirmationDialog,
  ConfirmationDialogTrigger,
  ConfirmationDialogContent,
  ConfirmationDialogHeader,
  ConfirmationDialogFooter,
  ConfirmationDialogTitle,
  ConfirmationDialogDescription,
  ConfirmationDialogClose,
  ConfirmationDialogComponent,
}
