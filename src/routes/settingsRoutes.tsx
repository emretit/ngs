import React from "react";
import { RouteConfig } from "./types";

// Lazy load all settings pages
const Settings = React.lazy(() => import("@/pages/Settings"));
const UsersSettings = React.lazy(() => import("@/pages/settings/UsersSettings"));
const UserRedirect = React.lazy(() => import("@/pages/settings/UserRedirect"));
const RolesSettings = React.lazy(() => import("@/pages/settings/RolesSettings"));
const NilveraSettingsPage = React.lazy(() => import("@/pages/settings/NilveraSettings"));
const VeribanSettingsPage = React.lazy(() => import("@/pages/settings/VeribanSettings"));
const IntegratorSettings = React.lazy(() => import("@/pages/settings/IntegratorSettings"));
const SystemSettingsPage = React.lazy(() => import("@/pages/settings/SystemSettings"));
const SystemParametersPage = React.lazy(() => import("@/pages/settings/SystemParameters"));
const PdfTemplates = React.lazy(() => import("@/pages/PdfTemplates"));
const PdfTemplateEditor = React.lazy(() => import("@/pages/templates/PdfTemplateEditor"));
const ServiceTemplateEditor = React.lazy(() => import("@/pages/templates/ServiceTemplateEditor"));
const NotificationSettings = React.lazy(() => import("@/pages/NotificationSettings"));
const Subscription = React.lazy(() => import("@/pages/settings/Subscription"));
const AuditLogs = React.lazy(() => import("@/pages/admin/AuditLogs"));
const ApprovalWorkflowSettings = React.lazy(() => import("@/pages/settings/ApprovalWorkflowSettings"));
const UnifiedManagement = React.lazy(() => import("@/pages/settings/UnifiedManagement"));
import Redirect from "@/components/routes/Redirect";

// Define settings routes
export const settingsRoutes: RouteConfig[] = [
  { path: "/settings", component: Settings, protected: true },
  { path: "/settings/user", component: UserRedirect, protected: true },
  { path: "/settings/subscription", component: Subscription, protected: true },
  { path: "/settings/integrator", component: IntegratorSettings, protected: true },
  { path: "/settings/nilvera", component: NilveraSettingsPage, protected: true },
  { path: "/settings/veriban", component: VeribanSettingsPage, protected: true },
  { path: "/settings/system", component: SystemSettingsPage, protected: true },
  { path: "/settings/system-parameters", component: SystemParametersPage, protected: true },
  { path: "/settings/pdf-templates", component: PdfTemplates, protected: true },
  // Service template routes MUST come before general pdf-templates routes (more specific first)
  { path: "/settings/pdf-templates/service/new", component: ServiceTemplateEditor, protected: true },
  { path: "/settings/pdf-templates/service/edit/:id", component: ServiceTemplateEditor, protected: true },
  // Quote/Proposal template routes
  { path: "/settings/pdf-templates/quote/new", component: PdfTemplateEditor, protected: true },
  { path: "/settings/pdf-templates/quote/edit/:templateId", component: PdfTemplateEditor, protected: true },
  { path: "/settings/audit-logs", component: AuditLogs, protected: true },
  { path: "/settings/notifications", component: NotificationSettings, protected: true },
  { path: "/settings/unified-management", component: UnifiedManagement, protected: true },
  // Redirect approval-workflows to unified management
  { 
    path: "/settings/approval-workflows", 
    component: () => <Redirect to="/settings/unified-management?tab=approvals" />, 
    protected: true 
  },
  // Backward compatibility routes (without /settings prefix)
  { path: "/users", component: UsersSettings, protected: true },
  { path: "/roles", component: RolesSettings, protected: true },
  { path: "/subscription", component: Subscription, protected: true },
  { path: "/integrator", component: IntegratorSettings, protected: true },
  { path: "/nilvera", component: NilveraSettingsPage, protected: true },
  { path: "/veriban", component: VeribanSettingsPage, protected: true },
  { path: "/system", component: SystemSettingsPage, protected: true },
  { path: "/system-parameters", component: SystemParametersPage, protected: true },
  { path: "/pdf-templates", component: PdfTemplates, protected: true },
  { path: "/pdf-templates/service/new", component: ServiceTemplateEditor, protected: true },
  { path: "/pdf-templates/service/edit/:id", component: ServiceTemplateEditor, protected: true },
  // Quote/Proposal template routes
  { path: "/pdf-templates/quote/new", component: PdfTemplateEditor, protected: true },
  { path: "/pdf-templates/quote/edit/:templateId", component: PdfTemplateEditor, protected: true },
  // Legacy route redirect - redirect old /pdf-templates/new to /pdf-templates/quote/new
  { 
    path: "/pdf-templates/new", 
    component: () => <Redirect to="/pdf-templates/quote/new" />, 
    protected: true 
  },
  { path: "/audit-logs", component: AuditLogs, protected: true },
  { path: "/notifications", component: NotificationSettings, protected: true },
  // Redirect old routes to unified management
  { 
    path: "/settings/users", 
    component: () => <Redirect to="/settings/unified-management?tab=users" />, 
    protected: true 
  },
  { 
    path: "/settings/roles", 
    component: () => <Redirect to="/settings/unified-management?tab=roles" />, 
    protected: true 
  },
];
