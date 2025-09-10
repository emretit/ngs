import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon, Loader2 } from "lucide-react";
import type { StyledButtonProps, ButtonGroupProps, ActionButtonGroupProps } from "@/types/shared-types";
import { VariantProps } from "class-variance-authority";

// Temel Button Props (shadcn button'dan extend)
export interface BaseButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// Button Variant Types
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface StyledButtonProps extends BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Temel StyledButton Bileşeni
export function StyledButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  type = 'button',
  variant = 'default',
  size = 'default',
}: StyledButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isDisabled}
      className={cn("transition-all duration-200", className)}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Yükleniyor...
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="mr-2 h-4 w-4" />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon className="ml-2 h-4 w-4" />
          )}
        </>
      )}
    </Button>
  );
}

// Primary Action Button
export interface PrimaryButtonProps extends Omit<StyledButtonProps, 'variant'> {
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export function PrimaryButton({ 
  variant = 'default', 
  className,
  ...props 
}: PrimaryButtonProps) {
  const variantClasses = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white", 
    warning: "bg-orange-600 hover:bg-orange-700 text-white",
    info: "bg-gray-600 hover:bg-gray-700 text-white",
  };

  return (
    <StyledButton
      variant="default"
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  );
}

// Secondary Action Button
export function SecondaryButton({ 
  className,
  ...props 
}: StyledButtonProps) {
  return (
    <StyledButton
      variant="outline"
      className={cn("border-gray-300 text-gray-700 hover:bg-gray-50", className)}
      {...props}
    />
  );
}

// Danger Button
export function DangerButton({ 
  className,
  ...props 
}: StyledButtonProps) {
  return (
    <StyledButton
      variant="destructive"
      className={cn("bg-red-600 hover:bg-red-700 text-white", className)}
      {...props}
    />
  );
}

// Ghost Button (minimal görünüm)
export function GhostButton({ 
  className,
  ...props 
}: StyledButtonProps) {
  return (
    <StyledButton
      variant="ghost"
      className={cn("text-gray-600 hover:bg-gray-100", className)}
      {...props}
    />
  );
}

// Button Group Container - Birden fazla buton için
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'normal',
  align = 'start',
  className,
}: ButtonGroupProps) {
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  const spacingClasses = {
    tight: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    normal: orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
    loose: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  const alignClasses = {
    start: 'justify-start items-start',
    center: 'justify-center items-center',
    end: 'justify-end items-end',
    stretch: 'justify-stretch items-stretch',
  };

  return (
    <div className={cn(
      'flex',
      orientationClasses[orientation],
      spacingClasses[spacing],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

// Action Button Group - Form aksiyonları için özel tasarım
export interface ActionButtonGroupProps {
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  saveText?: string;
  cancelText?: string;
  deleteText?: string;
  saveLoading?: boolean;
  deleteLoading?: boolean;
  saveDisabled?: boolean;
  deleteDisabled?: boolean;
  showDelete?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ActionButtonGroup({
  onSave,
  onCancel,
  onDelete,
  saveText = "Kaydet",
  cancelText = "İptal",
  deleteText = "Sil",
  saveLoading = false,
  deleteLoading = false,
  saveDisabled = false,
  deleteDisabled = false,
  showDelete = false,
  className,
  orientation = 'horizontal',
}: ActionButtonGroupProps) {
  return (
    <ButtonGroup 
      orientation={orientation}
      align="end"
      className={cn("pt-4 border-t border-gray-200", className)}
    >
      {showDelete && onDelete && (
        <DangerButton
          onClick={onDelete}
          loading={deleteLoading}
          disabled={deleteDisabled}
        >
          {deleteText}
        </DangerButton>
      )}
      
      <div className={cn(
        "flex",
        orientation === 'horizontal' ? 'space-x-3' : 'space-y-3 flex-col'
      )}>
        {onCancel && (
          <SecondaryButton onClick={onCancel}>
            {cancelText}
          </SecondaryButton>
        )}
        
        {onSave && (
          <PrimaryButton
            onClick={onSave}
            loading={saveLoading}
            disabled={saveDisabled}
            type="submit"
          >
            {saveText}
          </PrimaryButton>
        )}
      </div>
    </ButtonGroup>
  );
}

// Quick Action Buttons - Dashboard için kısa aksiyonlar
export interface QuickActionButtonProps extends Omit<StyledButtonProps, 'size'> {
  label: string;
  count?: number;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
}

export function QuickActionButton({
  label,
  count,
  color = 'blue',
  icon: Icon,
  className,
  ...props
}: QuickActionButtonProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    red: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    gray: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-auto py-2 px-3 flex-col items-center justify-center min-w-[80px]",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 mb-1" />}
      <span className="text-xs font-medium">{label}</span>
      {count !== undefined && (
        <span className="text-xs opacity-75">({count})</span>
      )}
    </Button>
  );
}

// Icon Button - Sadece icon için
export interface IconButtonProps extends Omit<StyledButtonProps, 'children' | 'size'> {
  icon: LucideIcon;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  icon: Icon,
  tooltip,
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "h-6 w-6 p-1",
    md: "h-8 w-8 p-1.5", 
    lg: "h-10 w-10 p-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      title={tooltip}
      className={cn(sizeClasses[size], "rounded-md", className)}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
}
