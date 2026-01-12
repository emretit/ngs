// Main component
export { default as ModuleDashboard } from "./ModuleDashboard";

// Sub-components
export { default as ModuleDashboardHeader, MONTHS } from "./ModuleDashboardHeader";
export { default as QuickLinkCard } from "./QuickLinkCard";
export { default as CardSummary } from "./CardSummary";

// Types
export type {
  ColorVariant,
  StatusGridColor,
  QuickLinkCardConfig,
  ModuleDashboardHeaderConfig,
  ModuleDashboardConfig,
  CardSummaryProps,
  CardSummaryMetricConfig,
  CardSummaryGridItem,
  CardSummaryFooterConfig,
} from "./types";

export { colorVariantClasses, statColorClasses, statusGridColorClasses } from "./types";
