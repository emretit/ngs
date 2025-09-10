
// Shared types that can be used across different modules
export type ProposalStatusShared = 
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired';

export const proposalWorkflowSteps: ProposalStatusShared[] = [
  'draft', 'pending_approval', 'sent', 'accepted'
];

export const finalProposalStages: ProposalStatusShared[] = [
  'accepted', 'rejected', 'expired'
];

// ===== SHARED COMPONENT TYPES =====

// Form Component Types
export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export interface FormSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
}

export interface FormGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

// Input Component Types
export interface BaseInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export interface TextInputGroupProps extends BaseInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  icon?: React.ComponentType<{ className?: string }>;
  value?: string;
  onChange?: (value: string) => void;
}

export interface TextareaGroupProps extends BaseInputProps {
  rows?: number;
  maxLength?: number;
  value?: string;
  onChange?: (value: string) => void;
}

export interface SelectGroupProps extends BaseInputProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  searchable?: boolean;
  clearable?: boolean;
}

export interface DateGroupProps extends BaseInputProps {
  value?: Date;
  onChange?: (value: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
}

export interface CheckboxGroupProps extends BaseInputProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  labelPosition?: 'left' | 'right';
}

export interface NumberInputGroupProps extends BaseInputProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  prefix?: string;
  suffix?: string;
}

export interface FileUploadGroupProps extends BaseInputProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  value?: File[];
  onChange?: (files: File[]) => void;
  onError?: (error: string) => void;
}

// Button Component Types
export interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export interface ActionButtonGroupProps {
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  saveText?: string;
  cancelText?: string;
  deleteText?: string;
  saveLoading?: boolean;
  deleteLoading?: boolean;
  className?: string;
  showDelete?: boolean;
}

// Card Component Types
export interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export interface StructuredCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

export interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export interface InfoCardProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
  children?: React.ReactNode;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

// Chart Component Types
export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

export interface EnhancedChartProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string;
}

export interface CardChartProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string;
}

export interface SimpleLineChartProps {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  dataKey: string;
  xAxisKey: string;
  title?: string;
  description?: string;
  height?: number;
  smooth?: boolean;
  showDots?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  className?: string;
}

export interface SimpleBarChartProps {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  dataKeys: string[];
  xAxisKey: string;
  title?: string;
  description?: string;
  height?: number;
  showTooltip?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export interface SimpleAreaChartProps {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  dataKey: string;
  xAxisKey: string;
  title?: string;
  description?: string;
  height?: number;
  showTooltip?: boolean;
  showGrid?: boolean;
  className?: string;
}

export interface SimplePieChartProps {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  dataKey: string;
  nameKey: string;
  title?: string;
  description?: string;
  height?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  className?: string;
}

export interface ChartGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

// Navigation Component Types
export interface NavigationProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  className?: string;
  onClick?: () => void;
}

export interface NavCategoryProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsNavigationProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export interface NavigationHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

// Common Utility Types
export type ColorVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
export type SizeVariant = 'sm' | 'md' | 'lg';
export type DirectionVariant = 'horizontal' | 'vertical';
export type AlignVariant = 'start' | 'center' | 'end' | 'stretch';
