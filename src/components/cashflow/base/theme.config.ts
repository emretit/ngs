import { CreditCard, Wallet, Users, Building } from "lucide-react";
import type { AccountType, AccountTheme } from "./types";

/**
 * Account theme configurations
 * Each account type has its own color scheme, gradients, and icon
 */
export const accountThemes: Record<AccountType, AccountTheme> = {
  /**
   * Credit Card Theme - Purple
   */
  credit_card: {
    primaryColor: 'purple',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-600',
    hoverFrom: 'hover:from-purple-600',
    hoverTo: 'hover:to-purple-700',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-100',
    textDark: 'text-purple-800',
    icon: CreditCard,
  },

  /**
   * Cash Account Theme - Green
   */
  cash: {
    primaryColor: 'green',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-green-600',
    hoverFrom: 'hover:from-green-600',
    hoverTo: 'hover:to-green-700',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-100',
    textDark: 'text-green-800',
    icon: Wallet,
  },

  /**
   * Partner Account Theme - Orange
   */
  partner: {
    primaryColor: 'orange',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-orange-600',
    hoverFrom: 'hover:from-orange-600',
    hoverTo: 'hover:to-orange-700',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-100',
    textDark: 'text-orange-800',
    icon: Users,
  },

  /**
   * Bank Account Theme - Blue
   */
  bank: {
    primaryColor: 'blue',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    hoverFrom: 'hover:from-blue-600',
    hoverTo: 'hover:to-blue-700',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-100',
    textDark: 'text-blue-800',
    icon: Building,
  },
};

/**
 * Helper to get theme by account type
 * @param type Account type
 * @returns Theme configuration
 */
export const getAccountTheme = (type: AccountType): AccountTheme => {
  return accountThemes[type];
};

/**
 * Stat badge variant color classes
 * Maps variant to Tailwind classes
 */
export const statBadgeVariantClasses: Record<string, string> = {
  primary: 'from-blue-600 to-blue-700',
  secondary: 'from-purple-600 to-purple-700',
  success: 'from-green-600 to-green-700',
  warning: 'from-orange-600 to-orange-700',
  danger: 'from-red-600 to-red-700',
};

/**
 * Quick action variant button classes
 * Maps variant to Tailwind gradient classes
 */
export const quickActionVariantClasses: Record<string, string> = {
  income: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
  expense: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
  transfer: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
  custom: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700',
};
