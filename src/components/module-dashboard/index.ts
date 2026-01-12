// Main component
export { default as ModuleDashboard } from "./ModuleDashboard";

// Sub-components
export { default as ModuleDashboardHeader, MONTHS } from "./ModuleDashboardHeader";
export { default as QuickLinkCard } from "./QuickLinkCard";

// Types
export type {
  ColorVariant,
  QuickLinkCardConfig,
  ModuleDashboardHeaderConfig,
  ModuleDashboardConfig,
} from "./types";

export { colorVariantClasses, statColorClasses } from "./types";
