
import Settings from "@/pages/Settings";
import UsersSettings from "@/pages/settings/UsersSettings";
import RolesSettings from "@/pages/settings/RolesSettings";
import NilveraSettingsPage from "@/pages/settings/NilveraSettings";
import SystemSettingsPage from "@/pages/settings/SystemSettings";
import PdfTemplates from "@/pages/PdfTemplates";
import PdfTemplateEditor from "@/pages/templates/PdfTemplateEditor";
import ServiceTemplateEdit from "@/pages/service/ServiceTemplateEdit";
import NotificationSettings from "@/pages/NotificationSettings";
import Subscription from "@/pages/settings/Subscription";
import AuditLogs from "@/pages/admin/AuditLogs";
import { RouteConfig } from "./types";

// Define settings routes
export const settingsRoutes: RouteConfig[] = [
  { path: "/settings", component: Settings, protected: true },
  { path: "/users", component: UsersSettings, protected: true },
  { path: "/roles", component: RolesSettings, protected: true },
  { path: "/subscription", component: Subscription, protected: true },
  { path: "/nilvera", component: NilveraSettingsPage, protected: true },
  { path: "/system", component: SystemSettingsPage, protected: true },
  { path: "/pdf-templates", component: PdfTemplates, protected: true },
  { path: "/audit-logs", component: AuditLogs, protected: true },
  { path: "/notifications", component: NotificationSettings, protected: true },
  { path: "/pdf-templates/new", component: PdfTemplateEditor, protected: true },
  { path: "/pdf-templates/edit/:templateId", component: PdfTemplateEditor, protected: true },
  { path: "/pdf-templates/service/new", component: ServiceTemplateEdit, protected: true },
  { path: "/pdf-templates/service/edit/:id", component: ServiceTemplateEdit, protected: true },
];
