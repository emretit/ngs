import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

// Color variants for consistent theming
export type ColorVariant = "blue" | "green" | "purple" | "orange" | "red" | "amber" | "cyan" | "pink" | "teal" | "indigo";

// Status Grid Colors
export type StatusGridColor = "red" | "yellow" | "green" | "blue" | "purple" | "orange" | "gray" | "indigo" | "amber" | "cyan" | "pink" | "teal";

// Card Summary Types
export interface CardSummaryMetricConfig {
  value: string | number;
  label: string;
  color?: ColorVariant;
}

export interface CardSummaryGridItem {
  label: string;
  value: string | number;
  color: StatusGridColor;
  dotColor?: string;
}

export interface CardSummaryFooterConfig {
  type: "progress" | "value" | "custom";
  // progress için
  progressLabel?: string;
  progressValue?: number; // 0-100
  progressTarget?: string;
  progressColor?: StatusGridColor;
  // value için
  valueLabel?: string;
  value?: string | number;
  valueColor?: "success" | "warning" | "danger" | "default";
  // custom için
  customContent?: ReactNode;
}

export interface CardSummaryProps {
  mainMetric: CardSummaryMetricConfig;
  statusGrid: CardSummaryGridItem[];
  footer?: CardSummaryFooterConfig;
  compact?: boolean;
  gridCols?: 2 | 3 | 4;
}

// Quick Link Card Configuration
export interface QuickLinkCardConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: ColorVariant;
  href: string;
  // Stats to display
  stats?: {
    label: string;
    value: string | number;
    color?: "default" | "success" | "warning" | "danger";
  }[];
  // Footer stat
  footerStat?: {
    label: string;
    value: string | number;
    color?: "default" | "success" | "warning" | "danger";
  };
  // New button configuration
  newButton?: {
    onClick?: (e: React.MouseEvent) => void;
    href?: string;
    label?: string;
  };
  // Card Summary configuration (replaces stats with rich summary)
  summaryConfig?: CardSummaryProps;
  // Custom content (replaces stats)
  customContent?: ReactNode;
  // Badge on date label
  dateLabel?: string;
}

// Module Dashboard Header Configuration
export interface ModuleDashboardHeaderConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  // Optional: Quick action buttons in header
  quickActions?: {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline" | "ghost";
  }[];
  // Year/Month filter
  showDateFilter?: boolean;
}

// Full Module Dashboard Configuration
export interface ModuleDashboardConfig {
  header: ModuleDashboardHeaderConfig;
  cards: QuickLinkCardConfig[];
  // Optional additional sections
  additionalContent?: ReactNode;
}

// Color mapping utilities
export const colorVariantClasses: Record<ColorVariant, {
  bg: string;
  text: string;
  border: string;
  lightBg: string;
  lightText: string;
  buttonBg: string;
  buttonHover: string;
}> = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "hover:border-blue-200",
    lightBg: "bg-blue-50",
    lightText: "text-blue-600",
    buttonBg: "bg-blue-600",
    buttonHover: "hover:bg-blue-700",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "hover:border-green-200",
    lightBg: "bg-green-50",
    lightText: "text-green-600",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "hover:border-purple-200",
    lightBg: "bg-purple-50",
    lightText: "text-purple-600",
    buttonBg: "bg-purple-600",
    buttonHover: "hover:bg-purple-700",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "hover:border-orange-200",
    lightBg: "bg-orange-50",
    lightText: "text-orange-600",
    buttonBg: "bg-orange-600",
    buttonHover: "hover:bg-orange-700",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "hover:border-red-200",
    lightBg: "bg-red-50",
    lightText: "text-red-600",
    buttonBg: "bg-red-600",
    buttonHover: "hover:bg-red-700",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "hover:border-amber-200",
    lightBg: "bg-amber-50",
    lightText: "text-amber-600",
    buttonBg: "bg-amber-600",
    buttonHover: "hover:bg-amber-700",
  },
  cyan: {
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    border: "hover:border-cyan-200",
    lightBg: "bg-cyan-50",
    lightText: "text-cyan-600",
    buttonBg: "bg-cyan-600",
    buttonHover: "hover:bg-cyan-700",
  },
  pink: {
    bg: "bg-pink-100",
    text: "text-pink-600",
    border: "hover:border-pink-200",
    lightBg: "bg-pink-50",
    lightText: "text-pink-600",
    buttonBg: "bg-pink-600",
    buttonHover: "hover:bg-pink-700",
  },
  teal: {
    bg: "bg-teal-100",
    text: "text-teal-600",
    border: "hover:border-teal-200",
    lightBg: "bg-teal-50",
    lightText: "text-teal-600",
    buttonBg: "bg-teal-600",
    buttonHover: "hover:bg-teal-700",
  },
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    border: "hover:border-indigo-200",
    lightBg: "bg-indigo-50",
    lightText: "text-indigo-600",
    buttonBg: "bg-indigo-600",
    buttonHover: "hover:bg-indigo-700",
  },
};

export const statColorClasses: Record<"default" | "success" | "warning" | "danger", string> = {
  default: "text-gray-900",
  success: "text-green-600",
  warning: "text-orange-600",
  danger: "text-red-600",
};

// Status Grid Color mapping
export const statusGridColorClasses: Record<StatusGridColor, {
  bg: string;
  border: string;
  dot: string;
  text: string;
  value: string;
}> = {
  red: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700", value: "text-red-600" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500", text: "text-yellow-700", value: "text-yellow-600" },
  green: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "text-green-700", value: "text-green-600" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-700", value: "text-blue-600" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-700", value: "text-purple-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", text: "text-orange-700", value: "text-orange-600" },
  gray: { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-500", text: "text-gray-700", value: "text-gray-600" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500", text: "text-indigo-700", value: "text-indigo-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", value: "text-amber-600" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", dot: "bg-cyan-500", text: "text-cyan-700", value: "text-cyan-600" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", dot: "bg-pink-500", text: "text-pink-700", value: "text-pink-600" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500", text: "text-teal-700", value: "text-teal-600" },
};
